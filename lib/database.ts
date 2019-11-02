import * as cdk from '@aws-cdk/core';
import * as rds from '@aws-cdk/aws-rds';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import {
  NetworkStackName,
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


export class Database extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const subnetGroup = new rds.CfnDBSubnetGroup(this, 'SubnetGroup', {
      dbSubnetGroupDescription: 'CloudFormation managed DB subnet group.',
      subnetIds: [
        cdk.Fn.importValue(
          `${NetworkStackName}PrivateSubnet1ID`
        ),
        cdk.Fn.importValue(
          `${NetworkStackName}PrivateSubnet2ID`
        )
      ]
    });

    // use secret manager to configure database username and password
    // cf. https://docs.aws.amazon.com/ja_jp/secretsmanager/latest/userguide/intro.html
    const secret = new secretsmanager.Secret(
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
          secret.secretArn,
          ':SecretString:username}}'
        ]),
        masterUserPassword: cdk.Fn.join('', [
          '{{resolve:secretsmanager:',
          secret.secretArn,
          ':SecretString:password}}'
        ]),
        scalingConfiguration: {
          autoPause: true,
          maxCapacity: ScalingMaxCapacity,
          minCapacity: ScalingMinCapacity,
          secondsUntilAutoPause: ScalingSecondsUtilAutoPause
        },
        vpcSecurityGroupIds: [
          cdk.Fn.importValue(`${NetworkStackName}DBSGID`)
        ]
      }
    );

    /**********
     * Output
     **********/
    if (db.databaseName) {
      new cdk.CfnOutput(this, 'DatabaseName', {
        exportName: `${id}DatabaseName`,
        value: db.databaseName
      });
    } else {
      // FIXME: need warning log to notify name is not exposed
    }

    new cdk.CfnOutput(this, 'ClusterArn', {
      exportName: `${id}ClusterArn`,
      value: this.formatArn({
        service: 'rds',
        resource: 'cluster',
        sep: ':',
        // NOTE: resourceName should be lower case for RDS
        // however arn is evaluated in case sensitive.
        resourceName: (db.dbClusterIdentifier || '').toString().toLowerCase()
      })
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      exportName: `${id}SecretArn`,
      value: secret.secretArn
    });
  }
}
