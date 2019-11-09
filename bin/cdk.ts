import * as cdk from '@aws-cdk/core';
import {
  BastionStackName,
  DatabaseStackName,
  FunctionPropsList,
  NetworkStackName
} from "../lib/config";
import { Database } from '../lib/database';
import { Network } from '../lib/network';
import { Bastion } from '../lib/bastion';
import { Function } from '../lib/functions';

const app = new cdk.App();
const network = new Network(app, NetworkStackName);
const database = new Database(app, DatabaseStackName, { vpc: network.vpc });
new Bastion(app, BastionStackName, { vpc: network.vpc });
FunctionPropsList.map(props =>
  new Function(app, props.id, {
    ...props,
    vpc: network.vpc,
    secret: database.secret,
    dbClusterArn: database.dbClusterArn,
    dbSG: database.dbSG
  }));

app.synth();
