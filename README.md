# Aurora Serverless Example

provision [aurora-serverless](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless.html) and lambda function using AWS CDK.

## Usage

```
$ export AWS_PROFILE=xxx
$ yarn run cdk deploy MyAppNetwork

$ yarn run cdk deploy MyAppDatabase

# need to enable data api manually by using cli.
$ aws rds modify-db-cluster \
      --db-cluster-identifier [sample-cluster] \
      --enable-http-endpoint

# NOTE: need to deploy each function one by one.
# when one function needs fixed, this reduces affect to other functions.
$ yarn run cdk deploy SampleFunction
```
