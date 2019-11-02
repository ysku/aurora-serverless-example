# Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template


```
$ export AWS_PROFILE=xxx
$ yarn run cdk deploy ApsNetwork

$ yarn run cdk deploy ApsDatabase

# need to enable data api manually by using cli.
$ aws rds modify-db-cluster \
      --db-cluster-identifier [sample-cluster] \
      --enable-http-endpoint

# NOTE: need to deploy each function one by one.
# when one function needs fixed, this reduces affect to other functions.
$ yarn run cdk deploy SampleFunction
```
