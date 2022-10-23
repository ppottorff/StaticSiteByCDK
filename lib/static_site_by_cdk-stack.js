"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticSiteByCdkStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const acm = require("aws-cdk-lib/aws-certificatemanager");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const iam = require("aws-cdk-lib/aws-iam");
const route53 = require("aws-cdk-lib/aws-route53");
const route53targets = require("aws-cdk-lib/aws-route53-targets");
const s3 = require("aws-cdk-lib/aws-s3");
const aws_cloudfront_1 = require("aws-cdk-lib/aws-cloudfront");
class StaticSiteByCdkStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const domainName = "aws.efrap.com";
        const assetsBucket = new s3.Bucket(this, 'WebsiteBucket', {
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
            accessControl: s3.BucketAccessControl.PRIVATE,
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
            encryption: s3.BucketEncryption.S3_MANAGED,
        });
        const cloudfrontOriginAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'CloudFrontOriginAccessIdentity');
        assetsBucket.addToResourcePolicy(new iam.PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [assetsBucket.arnForObjects('*')],
            principals: [new iam.CanonicalUserPrincipal(cloudfrontOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
        }));
        const zone = route53.HostedZone.fromLookup(this, 'HostedZone', { domainName: domainName });
        const certificate = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
            domainName: domainName,
            hostedZone: zone,
            region: 'us-east-1', // Cloudfront only checks this region for certificates.
        });
        // Add a cloudfront Function to a Distribution
        const rewriteFunction = new cloudfront.Function(this, 'Function', {
            code: cloudfront.FunctionCode.fromFile({ filePath: 'functions/url-rewrite.js' }),
        });
        const responseHeaderPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersResponseHeaderPolicy', {
            comment: 'Security headers response header policy',
            securityHeadersBehavior: {
                contentSecurityPolicy: {
                    override: true,
                    contentSecurityPolicy: "default-src 'self'"
                },
                strictTransportSecurity: {
                    override: true,
                    accessControlMaxAge: aws_cdk_lib_1.Duration.days(2 * 365),
                    includeSubdomains: true,
                    preload: true
                },
                contentTypeOptions: {
                    override: true
                },
                referrerPolicy: {
                    override: true,
                    referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN
                },
                xssProtection: {
                    override: true,
                    protection: true,
                    modeBlock: true
                },
                frameOptions: {
                    override: true,
                    frameOption: cloudfront.HeadersFrameOption.DENY
                }
            }
        });
        const cloudfrontDistribution = new cloudfront.Distribution(this, 'CloudFrontDistribution', {
            certificate: certificate,
            domainNames: [domainName],
            defaultRootObject: 'index.html',
            defaultBehavior: {
                origin: new origins.S3Origin(assetsBucket, {
                    originAccessIdentity: cloudfrontOriginAccessIdentity
                }),
                functionAssociations: [{
                        function: rewriteFunction,
                        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
                    }],
                viewerProtocolPolicy: aws_cloudfront_1.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                responseHeadersPolicy: responseHeaderPolicy
            },
        });
        new route53.ARecord(this, 'ARecord', {
            recordName: domainName,
            target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(cloudfrontDistribution)),
            zone
        });
    }
}
exports.StaticSiteByCdkStack = StaticSiteByCdkStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljX3NpdGVfYnlfY2RrLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3RhdGljX3NpdGVfYnlfY2RrLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDZDQUF5RTtBQUN6RSwwREFBMEQ7QUFDMUQseURBQXlEO0FBQ3pELDhEQUE4RDtBQUM5RCwyQ0FBMkM7QUFDM0MsbURBQW1EO0FBQ25ELGtFQUFrRTtBQUNsRSx5Q0FBeUM7QUFDekMsK0RBQWtFO0FBR2xFLE1BQWEsb0JBQXFCLFNBQVEsbUJBQUs7SUFDN0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUM7UUFFbkMsTUFBTSxZQUFZLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDeEQsZ0JBQWdCLEVBQUUsS0FBSztZQUN2QixpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxhQUFhLEVBQUUsMkJBQWEsQ0FBQyxNQUFNO1lBQ25DLGFBQWEsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsT0FBTztZQUM3QyxlQUFlLEVBQUUsRUFBRSxDQUFDLGVBQWUsQ0FBQyxxQkFBcUI7WUFDekQsVUFBVSxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVO1NBQzNDLENBQUMsQ0FBQztRQUVILE1BQU0sOEJBQThCLEdBQUcsSUFBSSxVQUFVLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLGdDQUFnQyxDQUFDLENBQUM7UUFFbkgsWUFBWSxDQUFDLG1CQUFtQixDQUFDLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUN2RCxPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUM7WUFDekIsU0FBUyxFQUFFLENBQUMsWUFBWSxDQUFD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Q0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ25HLElBQUk7U0FDTCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE1RkQsb0RBNEZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBEdXJhdGlvbiwgUmVtb3ZhbFBvbGljeSwgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhY20gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNlcnRpZmljYXRlbWFuYWdlcic7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCAqIGFzIG9yaWdpbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyByb3V0ZTUzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzJztcbmltcG9ydCAqIGFzIHJvdXRlNTN0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzLXRhcmdldHMnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCB7IFZpZXdlclByb3RvY29sUG9saWN5IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuXG5cbmV4cG9ydCBjbGFzcyBTdGF0aWNTaXRlQnlDZGtTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBkb21haW5OYW1lID0gXCJhd3MuZWZyYXAuY29tXCI7XG5cbiAgICBjb25zdCBhc3NldHNCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdXZWJzaXRlQnVja2V0Jywge1xuICAgICAgcHVibGljUmVhZEFjY2VzczogZmFsc2UsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgICBhY2Nlc3NDb250cm9sOiBzMy5CdWNrZXRBY2Nlc3NDb250cm9sLlBSSVZBVEUsXG4gICAgICBvYmplY3RPd25lcnNoaXA6IHMzLk9iamVjdE93bmVyc2hpcC5CVUNLRVRfT1dORVJfRU5GT1JDRUQsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjbG91ZGZyb250T3JpZ2luQWNjZXNzSWRlbnRpdHkgPSBuZXcgY2xvdWRmcm9udC5PcmlnaW5BY2Nlc3NJZGVudGl0eSh0aGlzLCAnQ2xvdWRGcm9udE9yaWdpbkFjY2Vzc0lkZW50aXR5Jyk7XG5cbiAgICBhc3NldHNCdWNrZXQuYWRkVG9SZXNvdXJjZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCddLFxuICAgICAgcmVzb3VyY2VzOiBbYXNzZXRzQnVja2V0LmFybkZvck9iamVjdHMoJyonKV0sXG4gICAgICBwcmluY2lwYWxzOiBbbmV3IGlhbS5DYW5vbmljYWxVc2VyUHJpbmNpcGFsKGNsb3VkZnJvbnRPcmlnaW5BY2Nlc3NJZGVudGl0eS5jbG91ZEZyb250T3JpZ2luQWNjZXNzSWRlbnRpdHlTM0Nhbm9uaWNhbFVzZXJJZCldLFxuICAgIH0pKTtcblxuICAgIGNvbnN0IHpvbmUgPSByb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLCAnSG9zdGVkWm9uZScsIHsgZG9tYWluTmFtZTogZG9tYWluTmFtZSB9KTtcblxuICAgIGNvbnN0IGNlcnRpZmljYXRlID0gbmV3IGFjbS5EbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZSh0aGlzLCAnU2l0ZUNlcnRpZmljYXRlJyxcbiAgICAgIHtcbiAgICAgICAgZG9tYWluTmFtZTogZG9tYWluTmFtZSxcbiAgICAgICAgaG9zdGVkWm9uZTogem9uZSxcbiAgICAgICAgcmVnaW9uOiAndXMtZWFzdC0xJywgLy8gQ2xvdWRmcm9udCBvbmx5IGNoZWNrcyB0aGlzIHJlZ2lvbiBmb3IgY2VydGlmaWNhdGVzLlxuICAgICAgfSk7XG5cbiAgICAvLyBBZGQgYSBjbG91ZGZyb250IEZ1bmN0aW9uIHRvIGEgRGlzdHJpYnV0aW9uXG4gICAgY29uc3QgcmV3cml0ZUZ1bmN0aW9uID0gbmV3IGNsb3VkZnJvbnQuRnVuY3Rpb24odGhpcywgJ0Z1bmN0aW9uJywge1xuICAgICAgY29kZTogY2xvdWRmcm9udC5GdW5jdGlvbkNvZGUuZnJvbUZpbGUoeyBmaWxlUGF0aDogJ2Z1bmN0aW9ucy91cmwtcmV3cml0ZS5qcycgfSksXG4gICAgfSk7XG5cbiAgICBjb25zdCByZXNwb25zZUhlYWRlclBvbGljeSA9IG5ldyBjbG91ZGZyb250LlJlc3BvbnNlSGVhZGVyc1BvbGljeSh0aGlzLCAnU2VjdXJpdHlIZWFkZXJzUmVzcG9uc2VIZWFkZXJQb2xpY3knLCB7XG4gICAgICBjb21tZW50OiAnU2VjdXJpdHkgaGVhZGVycyByZXNwb25zZSBoZWFkZXIgcG9saWN5JyxcbiAgICAgIHNlY3VyaXR5SGVhZGVyc0JlaGF2aW9yOiB7XG4gICAgICAgIGNvbnRlbnRTZWN1cml0eVBvbGljeToge1xuICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgIGNvbnRlbnRTZWN1cml0eVBvbGljeTogXCJkZWZhdWx0LXNyYyAnc2VsZidcIlxuICAgICAgICB9LFxuICAgICAgICBzdHJpY3RUcmFuc3BvcnRTZWN1cml0eToge1xuICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgIGFjY2Vzc0NvbnRyb2xNYXhBZ2U6IER1cmF0aW9uLmRheXMoMiAqIDM2NSksXG4gICAgICAgICAgaW5jbHVkZVN1YmRvbWFpbnM6IHRydWUsXG4gICAgICAgICAgcHJlbG9hZDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBjb250ZW50VHlwZU9wdGlvbnM6IHtcbiAgICAgICAgICBvdmVycmlkZTogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICByZWZlcnJlclBvbGljeToge1xuICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgIHJlZmVycmVyUG9saWN5OiBjbG91ZGZyb250LkhlYWRlcnNSZWZlcnJlclBvbGljeS5TVFJJQ1RfT1JJR0lOX1dIRU5fQ1JPU1NfT1JJR0lOXG4gICAgICAgIH0sXG4gICAgICAgIHhzc1Byb3RlY3Rpb246IHtcbiAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICBwcm90ZWN0aW9uOiB0cnVlLFxuICAgICAgICAgIG1vZGVCbG9jazogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBmcmFtZU9wdGlvbnM6IHtcbiAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICBmcmFtZU9wdGlvbjogY2xvdWRmcm9udC5IZWFkZXJzRnJhbWVPcHRpb24uREVOWVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBjbG91ZGZyb250RGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsICdDbG91ZEZyb250RGlzdHJpYnV0aW9uJywge1xuICAgICAgY2VydGlmaWNhdGU6IGNlcnRpZmljYXRlLFxuICAgICAgZG9tYWluTmFtZXM6IFtkb21haW5OYW1lXSxcbiAgICAgIGRlZmF1bHRSb290T2JqZWN0OiAnaW5kZXguaHRtbCcsXG4gICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcbiAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5TM09yaWdpbihhc3NldHNCdWNrZXQsIHtcbiAgICAgICAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eTogY2xvdWRmcm9udE9yaWdpbkFjY2Vzc0lkZW50aXR5XG4gICAgICAgIH0pLFxuICAgICAgICBmdW5jdGlvbkFzc29jaWF0aW9uczogW3tcbiAgICAgICAgICBmdW5jdGlvbjogcmV3cml0ZUZ1bmN0aW9uLFxuICAgICAgICAgIGV2ZW50VHlwZTogY2xvdWRmcm9udC5GdW5jdGlvbkV2ZW50VHlwZS5WSUVXRVJfUkVRVUVTVFxuICAgICAgICB9XSxcbiAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IFZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3k6IHJlc3BvbnNlSGVhZGVyUG9saWN5XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCAnQVJlY29yZCcsIHtcbiAgICAgIHJlY29yZE5hbWU6IGRvbWFpbk5hbWUsXG4gICAgICB0YXJnZXQ6IHJvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhuZXcgcm91dGU1M3RhcmdldHMuQ2xvdWRGcm9udFRhcmdldChjbG91ZGZyb250RGlzdHJpYnV0aW9uKSksXG4gICAgICB6b25lXG4gICAgfSk7XG4gIH1cbn0iXX0=