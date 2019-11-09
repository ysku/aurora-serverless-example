export const AppName = 'MyApp';   // FIXME: set proper your application name
export const KeyName = '';  // FIXME: set proper ssh key pair name
/************
 * Network
 ************/
export const NetworkStackName = `${AppName}Network`;
export const NetworkCidr = '172.31.0.0/16'; // default subnet
/************
 * Database
 ************/
export const DatabaseStackName = `${AppName}Database`;
export const DbName = 'aps'; // default
export const DbUserName = 'user'; // default
export const Engine = 'aurora';
export const EngineMode = 'serverless';
export const EngineVersion = '5.6.10a';
export const ParameterGroupFamily = 'aurora5.6';
export const ScalingMaxCapacity = 4;
export const ScalingMinCapacity = 1;
export const ScalingSecondsUtilAutoPause = 900; // 15min
/************
 * Bastion
 ************/
export const BastionStackName = `${AppName}Bastion`;
/************
 * Functions
 ************/
export const FunctionPropsList = [
  {
    id: 'SampleFun',
    srcPath: 'src',  // TODO:
    handler: 'index.handler'
  }
];
