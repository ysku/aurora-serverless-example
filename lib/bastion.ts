import { CompanyGlobalIpAddress, KeyName } from './config';
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

type BastionProps = {
  vpc: ec2.Vpc
} & cdk.StackProps;
/*
 * EC2 １台と SG を作成する
 */
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
      cidrIp: CompanyGlobalIpAddress
    });

    // TODO: need to assign this security group to bastion ec2 instance.
    // however, `ec2.Instance` does not allow to assign more than one security group.
    // const dbAccessSG = ec2.SecurityGroup.fromSecurityGroupId(this, 'DBAccessSGID', cdk.Fn.importValue(`${NetworkStackName}DBAccessSGID`));

    // TODO: explicitly specify subnet for instance
    // const subnet = ec2.PublicSubnet.fromPublicSubnetAttributes(
    //   this, 'PublicSubnet1', {
    //     availabilityZone: 'ap-northeast-1a',
    //     subnetId: cdk.Fn.importValue(`${NetworkStackName}PublicSubnet1ID`)
    //   });

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
