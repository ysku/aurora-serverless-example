import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import { AppName, DbName, DatabaseStackName, NetworkStackName } from './config';

export type FunctionProps = {
  id: string
  srcPath: string
  handler: string
  environment?: { [key: string]: string }
  vpc: ec2.Vpc
} & cdk.StackProps;

export class Function extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: FunctionProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    const functionRole = new iam.Role(this, 'FunctionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    const secretsManagerDbCredentialsAccessPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
        'secretsmanager:PutResourcePolicy',
        'secretsmanager:PutSecretValue',
        'secretsmanager:DeleteSecret',
        'secretsmanager:DescribeSecret',
        'secretsmanager:TagResource',
      ],
      resources: [
        cdk.Fn.importValue(`${DatabaseStackName}SecretArn`)
      ]
    });
    functionRole.addToPolicy(secretsManagerDbCredentialsAccessPolicy);

    const rdsDataServiceAccessPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:CreateSecret',
        'secretsmanager:ListSecrets',
        'secretsmanager:GetRandomPassword',
        'tag:GetResources',
        'rds-data:BatchExecuteStatement',
        'rds-data:BeginTransaction',
        'rds-data:CommitTransaction',
        // 'rds-data:ExecuteSql',   // NOTE: This API is deprecated
        'rds-data:ExecuteStatement',
        'rds-data:RollbackTransaction'
      ],
      resources: [
        // TODO: specify resources explicitly
        '*'
        // cdk.Fn.importValue(`${DatabaseStackName}ClusterArn`)
      ]
    });
    functionRole.addToPolicy(rdsDataServiceAccessPolicy);

    const lambdaInVpcPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'ec2:CreateNetworkInterface',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DeleteNetworkInterface',
      ],
      resources: [
        // TODO: specify resources explicitly
        '*'
      ]
    });
    functionRole.addToPolicy(lambdaInVpcPolicy);

    const secret = secretsmanager.Secret.fromSecretArn(
      this, 'ImportedSecret', cdk.Fn.importValue(`${DatabaseStackName}SecretArn`)
    );

    const now = new Date();

    const func = new lambda.Function(this, props.id, {
      functionName: props.id,
      code: new lambda.AssetCode(props.srcPath),
      handler: props.handler,
      runtime: lambda.Runtime.NODEJS_8_10,
      description: `deployed at ${now.toISOString()}`,
      environment: {
        APP_NAME: AppName, // just for example
        DB_NAME: DbName,
        DB_CLUSTER_ARN: cdk.Fn.importValue(`${DatabaseStackName}ClusterArn`),
        SECRET_STORE_ARN: cdk.Fn.importValue(`${DatabaseStackName}SecretArn`)
      },
      role: functionRole,
      vpc: vpc,
      // NOTE: by default the instances are placed in the private subnets.
      // cf. https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-ec2.SubnetSelection.html
      // vpcSubnets: []
      securityGroup: ec2.SecurityGroup.fromSecurityGroupId(
        this, 'DBAccessSGID', cdk.Fn.importValue(`${NetworkStackName}DBAccessSGID`))
    });

    secret.grantRead(func)
  }
}
