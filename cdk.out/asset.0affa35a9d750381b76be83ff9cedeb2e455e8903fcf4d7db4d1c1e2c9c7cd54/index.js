"use strict";const aws=require("aws-sdk"),defaultSleep=function(ms){return new Promise(resolve=>setTimeout(resolve,ms))};let defaultResponseURL,waiter,sleep=defaultSleep,random=Math.random,maxAttempts=10,report=function(event,context,responseStatus,physicalResourceId,responseData,reason){return new Promise((resolve,reject)=>{const https=require("https"),{URL}=require("url");var responseBody=JSON.stringify({Status:responseStatus,Reason:reason,PhysicalResourceId:physicalResourceId||context.logStreamName,StackId:event.StackId,RequestId:event.RequestId,LogicalResourceId:event.LogicalResourceId,Data:responseData});const parsedUrl=new URL(event.ResponseURL||defaultResponseURL),options={hostname:parsedUrl.hostname,port:443,path:parsedUrl.pathname+parsedUrl.search,method:"PUT",headers:{"Content-Type":"","Content-Length":responseBody.length}};https.request(options).on("error",reject).on("response",res=>{res.resume(),res.statusCode>=400?reject(new Error(`Server returned error ${res.statusCode}: ${res.statusMessage}`)):resolve()}).end(responseBody,"utf8")})};const addTags=async function(certificateArn,region,tags){const result=Array.from(Object.entries(tags)).map(([Key,Value])=>({Key,Value}));await new aws.ACM({region}).addTagsToCertificate({CertificateArn:certificateArn,Tags:result}).promise()},requestCertificate=async function(requestId,domainName,subjectAlternativeNames,certificateTransparencyLoggingPreference,hostedZoneId,region,route53Endpoint){const crypto=require("crypto"),acm=new aws.ACM({region}),route53=route53Endpoint?new aws.Route53({endpoint:route53Endpoint}):new aws.Route53;waiter&&(route53.waitFor=acm.waitFor=waiter),console.log(`Requesting certificate for ${domainName}`);const reqCertResponse=await acm.requestCertificate({DomainName:domainName,SubjectAlternativeNames:subjectAlternativeNames,Options:{CertificateTransparencyLoggingPreference:certificateTransparencyLoggingPreference},IdempotencyToken:crypto.createHash("sha256").update(requestId).digest("hex").slice(0,32),ValidationMethod:"DNS"}).promise();console.log(`Certificate ARN: ${reqCertResponse.CertificateArn}`),console.log("Waiting for ACM to provide DNS records for validation...");let records=[];for(let attempt=0;attempt<maxAttempts&&!records.length;attempt++){const{Certificate}=await acm.describeCertificate({CertificateArn:reqCertResponse.CertificateArn}).promise();if(records=getDomainValidationRecords(Certificate),!records.length){const base=Math.pow(2,attempt);await sleep(random()*base*50+base*150)}}if(!records.length)throw new Error(`Response from describeCertificate did not contain DomainValidationOptions after ${maxAttempts} attempts.`);return console.log(`Upserting ${records.length} DNS records into zone ${hostedZoneId}:`),await commitRoute53Records(route53,records,hostedZoneId),console.log("Waiting for validation..."),await acm.waitFor("certificateValidated",{$waiter:{delay:30,maxAttempts:19},CertificateArn:reqCertResponse.CertificateArn}).promise(),reqCertResponse.CertificateArn},deleteCertificate=async function(arn,region,hostedZoneId,route53Endpoint,cleanupRecords){const acm=new aws.ACM({region}),route53=route53Endpoint?new aws.Route53({endpoint:route53Endpoint}):new aws.Route53;waiter&&(route53.waitFor=acm.waitFor=waiter);try{console.log(`Waiting for certificate ${arn} to become unused`);let inUseByResources,records=[];for(let attempt=0;attempt<maxAttempts;attempt++){const{Certificate}=await acm.describeCertificate({CertificateArn:arn}).promise();if(cleanupRecords&&(records=getDomainValidationRecords(Certificate)),inUseByResources=Certificate.InUseBy||[],inUseByResources.length||!records.length){const base=Math.pow(2,attempt);await sleep(random()*base*50+base*150)}else break}if(inUseByResources.length)throw new Error(`Response from describeCertificate did not contain an empty InUseBy list after ${maxAttempts} attempts.`);if(cleanupRecords&&!records.length)throw new Error(`Response from describeCertificate did not contain DomainValidationOptions after ${maxAttempts} attempts.`);console.log(`Deleting certificate ${arn}`),await acm.deleteCertificate({CertificateArn:arn}).promise(),cleanupRecords&&(console.log(`Deleting ${records.length} DNS records from zone ${hostedZoneId}:`),await commitRoute53Records(route53,records,hostedZoneId,"DELETE"))}catch(err){if(err.name!=="ResourceNotFoundException")throw err}};function getDomainValidationRecords(certificate){const options=certificate.DomainValidationOptions||[];if(options.length>0&&options.every(opt=>opt&&!!opt.ResourceRecord)){const unique=options.map(val=>val.ResourceRecord).reduce((acc,cur)=>(acc[cur.Name]=cur,acc),{});return Object.keys(unique).sort().map(key=>unique[key])}return[]}async function commitRoute53Records(route53,records,hostedZoneId,action="UPSERT"){const changeBatch=await route53.changeResourceRecordSets({ChangeBatch:{Changes:records.map(record=>(console.log(`${record.Name} ${record.Type} ${record.Value}`),{Action:action,ResourceRecordSet:{Name:record.Name,Type:record.Type,TTL:60,ResourceRecords:[{Value:record.Value}]}}))},HostedZoneId:hostedZoneId}).promise();console.log("Waiting for DNS records to commit..."),await route53.waitFor("resourceRecordSetsChanged",{$waiter:{delay:30,maxAttempts:10},Id:changeBatch.ChangeInfo.Id}).promise()}function shouldUpdate(oldParams,newParams,physicalResourceId){return!oldParams||oldParams.DomainName!==newParams.DomainName||oldParams.SubjectAlternativeNames!==newParams.SubjectAlternativeNames||oldParams.CertificateTransparencyLoggingPreference!==newParams.CertificateTransparencyLoggingPreference||oldParams.HostedZoneId!==newParams.HostedZoneId||oldParams.Region!==newParams.Region||!physicalResourceId||!physicalResourceId.startsWith("arn:")}exports.certificateRequestHandler=async function(event,context){var responseData={},physicalResourceId,certificateArn;async function processRequest(){certificateArn=await requestCertificate(event.RequestId,event.ResourceProperties.DomainName,event.ResourceProperties.SubjectAlternativeNames,event.ResourceProperties.CertificateTransparencyLoggingPreference,event.ResourceProperties.HostedZoneId,event.ResourceProperties.Region,event.ResourceProperties.Route53Endpoint),responseData.Arn=physicalResourceId=certificateArn}try{switch(event.RequestType){case"Create":await processRequest(),event.ResourceProperties.Tags&&physicalResourceId.startsWith("arn:")&&await addTags(physicalResourceId,event.ResourceProperties.Region,event.ResourceProperties.Tags);break;case"Update":shouldUpdate(event.OldResourceProperties,event.ResourceProperties,event.PhysicalResourceId)?await processRequest():responseData.Arn=physicalResourceId=event.PhysicalResourceId,event.ResourceProperties.Tags&&physicalResourceId.startsWith("arn:")&&await addTags(physicalResourceId,event.ResourceProperties.Region,event.ResourceProperties.Tags);break;case"Delete":physicalResourceId=event.PhysicalResourceId;const removalPolicy=event.ResourceProperties.RemovalPolicy??"destroy";physicalResourceId.startsWith("arn:")&&removalPolicy==="destroy"&&await deleteCertificate(physicalResourceId,event.ResourceProperties.Region,event.ResourceProperties.HostedZoneId,event.ResourceProperties.Route53Endpoint,event.ResourceProperties.CleanupRecords==="true");break;default:throw new Error(`Unsupported request type ${event.RequestType}`)}console.log("Uploading SUCCESS response to S3..."),await report(event,context,"SUCCESS",physicalResourceId,responseData),console.log("Done.")}catch(err){console.log(`Caught error ${err}. Uploading FAILED message to S3.`),await report(event,context,"FAILED",physicalResourceId,null,err.message)}},exports.withReporter=function(reporter){report=reporter},exports.withDefaultResponseURL=function(url){defaultResponseURL=url},exports.withWaiter=function(w){waiter=w},exports.resetWaiter=function(){waiter=void 0},exports.withSleep=function(s){sleep=s},exports.resetSleep=function(){sleep=defaultSleep},exports.withRandom=function(r){random=r},exports.resetRandom=function(){random=Math.random},exports.withMaxAttempts=function(ma){maxAttempts=ma},exports.resetMaxAttempts=function(){maxAttempts=10};
//# sourceMappingURL=index.js.map
