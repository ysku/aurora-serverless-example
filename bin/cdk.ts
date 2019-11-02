#!/usr/bin/env node
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
new Database(app, DatabaseStackName);
const network = new Network(app, NetworkStackName);
new Bastion(app, BastionStackName, { vpc: network.vpc });
FunctionPropsList.map(props =>
  new Function(app, props.id, { ...props, vpc: network.vpc }));

app.synth();
