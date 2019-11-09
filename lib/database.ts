import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import {
  DbName,
  DbUserName,
  Engine,
  EngineMode,
  EngineVersion,
  ParameterGroupFamily,
  ScalingMaxCapacity,
  ScalingMinCapacity,
  ScalingSecondsUtilAutoPause
} from './config';

type DatabaseProps = {
  vpc: ec2.Vpc
} & cdk.StackProps;

export class Database extends cdk.Stack {
  public readonly dbSG: ec2.SecurityGroup;
  public readonly dbClusterArn: string;
  public readonly secret: secretsmanager.Secret;

  constructor(scope: cdk.App, id: string, props: DatabaseProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    this.dbSG = new ec2.SecurityGroup(this, 'DBSG', {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'for database',
      securityGroupName: 'Database'
    });

    const subnetGroup = new rds.CfnDBSubnetGroup(this, 'SubnetGroup', {
      dbSubnetGroupDescription: 'CloudFormation managed DB subnet group.',
      subnetIds: vpc.publicSubnets.map(sub => sub.subnetId)
    });

    // use secret manager to configure database username and password
    // cf. https://docs.aws.amazon.com/ja_jp/secretsmanager/latest/userguide/intro.html
    this.secret = new secretsmanager.Secret(
      this, 'Secret', {
        secretName: `${id}Secret`,
        description: 'RDS database auto-generated user password',
        generateSecretString: {
          excludeCharacters: '"@/',
          generateStringKey: 'password',
          passwordLength: 32,
          secretStringTemplate: `{"username": "${DbUserName}"}`,
        }
      }
    );

    const parameterGroup = new rds.ClusterParameterGroup(
      this, 'RDSParameterGroup', {
        description: `parameter group for ${DbName}`,
        family: ParameterGroupFamily,
        parameters: {
          character_set_client: 'utf8mb4',
          character_set_connection: 'utf8mb4',
          character_set_database: 'utf8mb4',
          character_set_results: 'utf8mb4',
          character_set_server: 'utf8mb4'
        }
      });

    const db = new rds.CfnDBCluster(
      this, 'RDS',
      {
        // cannot use upper case characters.
        databaseName: DbName,
        dbClusterIdentifier: id,
        dbClusterParameterGroupName: parameterGroup.parameterGroupName,
        dbSubnetGroupName: subnetGroup.ref,
        engine: Engine,
        engineMode: EngineMode,
        // 5.7.mysql_aurora.2.03.2 didn't work
        // RDS The engine mode serverless you requested is currently unavailable.
        engineVersion: EngineVersion,
        // need to build following format
        // {{resolve:secretsmanager:secret-id:secret-string:json-key:version-stage:version-id}}
        // cf. https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/dynamic-references.html
        masterUsername: cdk.Fn.join('', [
          '{{resolve:secretsmanager:',
          this.secret.secretArn,
          ':SecretString:username}}'
        ]),
        masterUserPassword: cdk.Fn.join('', [
          '{{resolve:secretsmanager:',
          this.secret.secretArn,
          ':SecretString:password}}'
        ]),
        scalingConfiguration: {
          autoPause: true,
          maxCapacity: ScalingMaxCapacity,
          minCapacity: ScalingMinCapacity,
          secondsUntilAutoPause: ScalingSecondsUtilAutoPause
        },
        vpcSecurityGroupIds: [
          this.dbSG.securityGroupId
        ]
      }
    );

    this.dbClusterArn = this.formatArn({
      service: 'rds',
      resource: 'cluster',
      sep: ':',
      // NOTE: resourceName should be lower case for RDS
      // however arn is evaluated in case sensitive.
      resourceName: (db.dbClusterIdentifier || '').toString().toLowerCase()
    });
  }
}
