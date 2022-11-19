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
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
const aws_cloudfront_1 = require("aws-cdk-lib/aws-cloudfront");
class StaticSiteByCdkStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const domainName = "aws.efrap.com";
        const assetsBucket = new s3.Bucket(this, 'WebsiteBucket', {
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
            autoDeleteObjects: true
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
            region: 'us-east-1',
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
            enableLogging: true,
            logBucket: new s3.Bucket(this, 'CloudFrontLogBucket', {
                blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
                publicReadAccess: false,
                removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
                autoDeleteObjects: true,
                encryption: s3.BucketEncryption.S3_MANAGED,
            }),
            logFilePrefix: 'cloudfront',
            logIncludesCookies: true,
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
        new s3deploy.BucketDeployment(this, 'DeployWebsite', {
            sources: [s3deploy.Source.asset('./site-contents')],
            destinationBucket: assetsBucket,
            distribution: cloudfrontDistribution,
            distributionPaths: ['/*']
        });
        new route53.ARecord(this, 'ARecord', {
            recordName: domainName,
            target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(cloudfrontDistribution)),
            zone
        });
    }
}
exports.StaticSiteByCdkStack = StaticSiteByCdkStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljX3NpdGVfYnlfY2RrLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3RhdGljX3NpdGVfYnlfY2RrLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDZDQUF5RTtBQUN6RSwwREFBMEQ7QUFDMUQseURBQXlEO0FBQ3pELDhEQUE4RDtBQUM5RCwyQ0FBMkM7QUFDM0MsbURBQW1EO0FBQ25ELGtFQUFrRTtBQUNsRSx5Q0FBeUM7QUFDekMsMERBQTBEO0FBQzFELCtEQUFnRjtBQUdoRixNQUFhLG9CQUFxQixTQUFRLG1CQUFLO0lBQzdDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBa0I7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxVQUFVLEdBQUcsZUFBZSxDQUFDO1FBRW5DLE1BQU0sWUFBWSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3hELGdCQUFnQixFQUFFLEtBQUs7WUFDdkIsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7WUFDakQsYUFBYSxFQUFFLDJCQUFhLENBQUMsT0FBTztZQUNwQyxpQkFBaUIsRUFBRSxJQUFJO1NBQ3hCLENBQUMsQ0FBQztRQUVILE1BQU0sOEJBQThCLEdBQUcsSUFBSSxVQUFVLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLGdDQUFnQyxDQUFDLENBQUM7UUFFbkgsWUFBWSxDQUFDLG1CQUFtQixDQUFDLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUN2RCxPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUM7WUFDekIsU0FBUyxFQUFFLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1QyxVQUFVLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyw4QkFBOEIsQ0FBQywrQ0FBK0Ms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Q0FBb0IsQ0FBQyxpQkFBaUI7Z0JBQzVELHFCQUFxQixFQUFFLG9CQUFvQjthQUM1QztTQUNGLENBQUMsQ0FBQztRQUVILElBQUksUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDbkQsT0FBTyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNuRCxpQkFBaUIsRUFBRSxZQUFZO1lBQy9CLFlBQVksRUFBRSxzQkFBc0I7WUFDcEMsaUJBQWlCLEVBQUUsQ0FBQyxJQUFJLENBQUM7U0FDMUIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7WUFDbkMsVUFBVSxFQUFFLFVBQVU7WUFDdEIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksY0FBYyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDbkcsSUFBSTtTQUNMLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTVHRCxvREE0R0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IER1cmF0aW9uLCBSZW1vdmFsUG9saWN5LCBTdGFjaywgU3RhY2tQcm9wcyB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGFjbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyJztcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuaW1wb3J0ICogYXMgb3JpZ2lucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIHJvdXRlNTMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJvdXRlNTMnO1xuaW1wb3J0ICogYXMgcm91dGU1M3RhcmdldHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJvdXRlNTMtdGFyZ2V0cyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgczNkZXBsb3kgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWRlcGxveW1lbnQnO1xuaW1wb3J0IHsgRGlzdHJpYnV0aW9uLCBWaWV3ZXJQcm90b2NvbFBvbGljeSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcblxuXG5leHBvcnQgY2xhc3MgU3RhdGljU2l0ZUJ5Q2RrU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgZG9tYWluTmFtZSA9IFwiYXdzLmVmcmFwLmNvbVwiO1xuXG4gICAgY29uc3QgYXNzZXRzQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnV2Vic2l0ZUJ1Y2tldCcsIHtcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiB0cnVlXG4gICAgfSk7XG5cbiAgICBjb25zdCBjbG91ZGZyb250T3JpZ2luQWNjZXNzSWRlbnRpdHkgPSBuZXcgY2xvdWRmcm9udC5PcmlnaW5BY2Nlc3NJZGVudGl0eSh0aGlzLCAnQ2xvdWRGcm9udE9yaWdpbkFjY2Vzc0lkZW50aXR5Jyk7XG5cbiAgICBhc3NldHNCdWNrZXQuYWRkVG9SZXNvdXJjZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCddLFxuICAgICAgcmVzb3VyY2VzOiBbYXNzZXRzQnVja2V0LmFybkZvck9iamVjdHMoJyonKV0sXG4gICAgICBwcmluY2lwYWxzOiBbbmV3IGlhbS5DYW5vbmljYWxVc2VyUHJpbmNpcGFsKGNsb3VkZnJvbnRPcmlnaW5BY2Nlc3NJZGVudGl0eS5jbG91ZEZyb250T3JpZ2luQWNjZXNzSWRlbnRpdHlTM0Nhbm9uaWNhbFVzZXJJZCldLFxuICAgIH0pKTtcblxuICAgIGNvbnN0IHpvbmUgPSByb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLCAnSG9zdGVkWm9uZScsIHsgZG9tYWluTmFtZTogZG9tYWluTmFtZSB9KTtcblxuXG4gICAgY29uc3QgY2VydGlmaWNhdGUgPSBuZXcgYWNtLkRuc1ZhbGlkYXRlZENlcnRpZmljYXRlKHRoaXMsICdTaXRlQ2VydGlmaWNhdGUnLFxuICAgICAge1xuICAgICAgICBkb21haW5OYW1lOiBkb21haW5OYW1lLFxuICAgICAgICBob3N0ZWRab25lOiB6b25lLFxuICAgICAgICByZWdpb246ICd1cy1lYXN0LTEnLCAvLyBDbG91ZGZyb250IG9ubHkgY2hlY2tzIHRoaXMgcmVnaW9uIGZvciBjZXJ0aWZpY2F0ZXMuXG4gICAgICB9KTtcblxuICAgIC8vIEFkZCBhIGNsb3VkZnJvbnQgRnVuY3Rpb24gdG8gYSBEaXN0cmlidXRpb25cbiAgICBjb25zdCByZXdyaXRlRnVuY3Rpb24gPSBuZXcgY2xvdWRmcm9udC5GdW5jdGlvbih0aGlzLCAnRnVuY3Rpb24nLCB7XG4gICAgICBjb2RlOiBjbG91ZGZyb250LkZ1bmN0aW9uQ29kZS5mcm9tRmlsZSh7IGZpbGVQYXRoOiAnZnVuY3Rpb25zL3VybC1yZXdyaXRlLmpzJyB9KSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHJlc3BvbnNlSGVhZGVyUG9saWN5ID0gbmV3IGNsb3VkZnJvbnQuUmVzcG9uc2VIZWFkZXJzUG9saWN5KHRoaXMsICdTZWN1cml0eUhlYWRlcnNSZXNwb25zZUhlYWRlclBvbGljeScsIHtcbiAgICAgIGNvbW1lbnQ6ICdTZWN1cml0eSBoZWFkZXJzIHJlc3BvbnNlIGhlYWRlciBwb2xpY3knLFxuICAgICAgc2VjdXJpdHlIZWFkZXJzQmVoYXZpb3I6IHtcbiAgICAgICAgY29udGVudFNlY3VyaXR5UG9saWN5OiB7XG4gICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgY29udGVudFNlY3VyaXR5UG9saWN5OiBcImRlZmF1bHQtc3JjICdzZWxmJ1wiXG4gICAgICAgIH0sXG4gICAgICAgIHN0cmljdFRyYW5zcG9ydFNlY3VyaXR5OiB7XG4gICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgYWNjZXNzQ29udHJvbE1heEFnZTogRHVyYXRpb24uZGF5cygyICogMzY1KSxcbiAgICAgICAgICBpbmNsdWRlU3ViZG9tYWluczogdHJ1ZSxcbiAgICAgICAgICBwcmVsb2FkOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRlbnRUeXBlT3B0aW9uczoge1xuICAgICAgICAgIG92ZXJyaWRlOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHJlZmVycmVyUG9saWN5OiB7XG4gICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgcmVmZXJyZXJQb2xpY3k6IGNsb3VkZnJvbnQuSGVhZGVyc1JlZmVycmVyUG9saWN5LlNUUklDVF9PUklHSU5fV0hFTl9DUk9TU19PUklHSU5cbiAgICAgICAgfSxcbiAgICAgICAgeHNzUHJvdGVjdGlvbjoge1xuICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgIHByb3RlY3Rpb246IHRydWUsXG4gICAgICAgICAgbW9kZUJsb2NrOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIGZyYW1lT3B0aW9uczoge1xuICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgIGZyYW1lT3B0aW9uOiBjbG91ZGZyb250LkhlYWRlcnNGcmFtZU9wdGlvbi5ERU5ZXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3VkZnJvbnREaXN0cmlidXRpb24gPSBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24odGhpcywgJ0Nsb3VkRnJvbnREaXN0cmlidXRpb24nLCB7XG4gICAgICBjZXJ0aWZpY2F0ZTogY2VydGlmaWNhdGUsXG4gICAgICBkb21haW5OYW1lczogW2RvbWFpbk5hbWVdLFxuICAgICAgZW5hYmxlTG9nZ2luZzogdHJ1ZSxcbiAgICAgIGxvZ0J1Y2tldDogbmV3IHMzLkJ1Y2tldCh0aGlzLCAnQ2xvdWRGcm9udExvZ0J1Y2tldCcsIHtcbiAgICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgICAgcHVibGljUmVhZEFjY2VzczogZmFsc2UsXG4gICAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSwgXG4gICAgICAgIGF1dG9EZWxldGVPYmplY3RzOiB0cnVlLFxuICAgICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICB9KSxcbiAgICAgIGxvZ0ZpbGVQcmVmaXg6ICdjbG91ZGZyb250JyxcbiAgICAgIGxvZ0luY2x1ZGVzQ29va2llczogdHJ1ZSxcbiAgICAgIGRlZmF1bHRSb290T2JqZWN0OiAnaW5kZXguaHRtbCcsXG4gICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcbiAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5TM09yaWdpbihhc3NldHNCdWNrZXQsIHtcbiAgICAgICAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eTogY2xvdWRmcm9udE9yaWdpbkFjY2Vzc0lkZW50aXR5XG4gICAgICAgIH0pLFxuICAgICAgICBmdW5jdGlvbkFzc29jaWF0aW9uczogW3tcbiAgICAgICAgICBmdW5jdGlvbjogcmV3cml0ZUZ1bmN0aW9uLFxuICAgICAgICAgIGV2ZW50VHlwZTogY2xvdWRmcm9udC5GdW5jdGlvbkV2ZW50VHlwZS5WSUVXRVJfUkVRVUVTVFxuICAgICAgICB9XSxcbiAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IFZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3k6IHJlc3BvbnNlSGVhZGVyUG9saWN5XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgbmV3IHMzZGVwbG95LkJ1Y2tldERlcGxveW1lbnQodGhpcywgJ0RlcGxveVdlYnNpdGUnLCB7XG4gICAgICBzb3VyY2VzOiBbczNkZXBsb3kuU291cmNlLmFzc2V0KCcuL3NpdGUtY29udGVudHMnKV0sXG4gICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogYXNzZXRzQnVja2V0LFxuICAgICAgZGlzdHJpYnV0aW9uOiBjbG91ZGZyb250RGlzdHJpYnV0aW9uLFxuICAgICAgZGlzdHJpYnV0aW9uUGF0aHM6IFsnLyonXVxuICAgIH0pO1xuXG4gICAgbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCAnQVJlY29yZCcsIHtcbiAgICAgIHJlY29yZE5hbWU6IGRvbWFpbk5hbWUsXG4gICAgICB0YXJnZXQ6IHJvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhuZXcgcm91dGU1M3RhcmdldHMuQ2xvdWRGcm9udFRhcmdldChjbG91ZGZyb250RGlzdHJpYnV0aW9uKSksXG4gICAgICB6b25lXG4gICAgfSk7XG4gIH1cbn0iXX0=