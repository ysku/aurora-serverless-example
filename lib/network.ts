import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { NetworkCidr } from './config';

export class Network extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpcProps = {
      cidr: NetworkCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE
        }
      ]
    };

    // NOTE: default security group will be also created
    this.vpc = new ec2.Vpc(this, 'VPC', vpcProps);

    const dbAccessSG = new ec2.SecurityGroup(this, 'DBAccessSG', {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: 'for instances that access database',
      securityGroupName: 'Database Access'
    });

    const dbSG = new ec2.SecurityGroup(this, 'DBSG', {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: 'for database',
      securityGroupName: 'Database'
    });

    // allow DatabaseSG to access from DBAccessSG
    new ec2.CfnSecurityGroupIngress(this, 'DBSGIngress', {
      groupId: dbSG.securityGroupId,
      ipProtocol: 'tcp',
      description: `from instances with sg named ${dbAccessSG.securityGroupName}`,
      fromPort: 3306,
      toPort: 3306,
      sourceSecurityGroupId: dbAccessSG.securityGroupId
    });

    // VPC ID
    new cdk.CfnOutput(this, 'VPCID', {
      exportName: `${id}VPCID`,
      value: this.vpc.vpcId
    });
    // Security Group Ids
    new cdk.CfnOutput(this, `${id}DefaultSGID`, {
      exportName: `${id}DefaultSGID`,
      value: this.vpc.vpcDefaultSecurityGroup
    });
    new cdk.CfnOutput(this, 'DBAccessSGID', {
      exportName: `${id}DBAccessSGID`,
      value: dbAccessSG.securityGroupId
    });
    new cdk.CfnOutput(this, 'DBSGID', {
      exportName: `${id}DBSGID`,
      value: dbSG.securityGroupId
    });
    // Subnets
    this.vpc.publicSubnets.forEach((sub, idx) => {
      new cdk.CfnOutput(
        this,
        `PublicSubnet${idx + 1}ID`,
        {
          exportName: `${id}PublicSubnet${idx + 1}ID`,
          value: sub.subnetId
        }
      );
    });
    this.vpc.privateSubnets.forEach((sub, idx) => {
      new cdk.CfnOutput(
        this,
        `PrivateSubnet${idx + 1}ID`,
        {
          exportName: `${id}PrivateSubnet${idx + 1}ID`,
          value: sub.subnetId
        }
      );
    });
  }
}
