import { KeyName } from './config';
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

type BastionProps = {
  vpc: ec2.Vpc
} & cdk.StackProps;

export class Bastion extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: BastionProps) {
    super(scope, id, props);

    const instanceType = new ec2.InstanceType('t2.micro');
    const machineImage = new ec2.AmazonLinuxImage();
    const vpc = props.vpc;

    const bastionSG = new ec2.SecurityGroup(this, 'BastionSG', {
      vpc,
      allowAllOutbound: true,
      description: 'bastion',
      securityGroupName: 'Bastion'
    });
    new ec2.CfnSecurityGroupIngress(this, 'BastionSGIngressFromCompany', {
      groupId: bastionSG.securityGroupId,
      ipProtocol: 'tcp',
      description: `from company network access`,
      fromPort: 22,
      toPort: 22,
      cidrIp: '0.0.0.0/0' // FIXME:
    });

    // ec2 instance for bastion server.
    new ec2.Instance(this, 'Bastion', {
      keyName: KeyName,
      instanceType: instanceType,
      machineImage: machineImage,
      // NOTE: only one security group is allowed to assign in creation.
      securityGroup: bastionSG,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      }
    })
  }
}
