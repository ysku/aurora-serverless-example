import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import { Network } from '../lib/network';

test('VPC Created', () => {
    const app = new cdk.App();
    const stack = new Network(app, 'MyTestStack');
    expectCDK(stack).to(haveResource("AWS::EC2::VPC",{
      InstanceTenancy: 'default'
    }));
});
