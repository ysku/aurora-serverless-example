import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import { Database } from '../lib/database';

test('DBCluster Created', () => {
    const app = new cdk.App();
    const stack = new Database(app, 'MyTestStack');
    expectCDK(stack).to(haveResource("AWS::RDS::DBCluster",{
      Engine: 'aurora',
      EngineMode: 'serverless',
    }));
});

test('Secret Created', () => {
  const app = new cdk.App();
  const stack = new Database(app, 'MyTestStack');
  expectCDK(stack).to(haveResource("AWS::SecretsManager::Secret",{
    GenerateSecretString: {
      ExcludeCharacters: "\"@/",
      GenerateStringKey: "password",
      PasswordLength: 32,
      SecretStringTemplate: "{\"username\": \"user\"}"
    }
  }));
});

test('DBSubnetGroup Created', () => {
  const app = new cdk.App();
  const stack = new Database(app, 'MyTestStack');
  expectCDK(stack).to(haveResource("AWS::RDS::DBSubnetGroup",{
    SubnetIds: [
      {
        "Fn::ImportValue": "ApsNetworkPrivateSubnet1ID"
      },
      {
        "Fn::ImportValue": "ApsNetworkPrivateSubnet2ID"
      }
    ]
  }));
});
