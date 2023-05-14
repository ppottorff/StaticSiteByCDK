import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class LambdaByCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const helloLambda = new NodejsFunction(this, 'HelloResponse', {
      entry: path.join(__dirname, '/../lambda/hello.ts'),
      handler: 'main',
      runtime: lambda.Runtime.NODEJS_16_X,
    });
  }
}