/*
 * sample lambda function handler
 */
import * as AWS from 'aws-sdk';

const rdsDataService = new AWS.RDSDataService();

export const handler = async (event: any = {}) : Promise <any> => {
  const params = {
    secretArn: process.env.SECRET_STORE_ARN || '',
    resourceArn: process.env.DB_CLUSTER_ARN || '',
    sql: 'select * from sample;', /* required */
    database: process.env.DB_NAME || ''
  };
  const res = await rdsDataService.executeStatement(params).promise();
  return { statusCode: 200, body: {
    message: 'ok',
    result: res
  }};
};
