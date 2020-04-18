const fs = require('fs')
const path = require('path')
const os = require('os')
const AWS = require('aws-sdk')

AWS.config.update({
  region: 'us-east-1'
})

const ec2 = new AWS.EC2()
const autoScaling = new AWS.AutoScaling()
const iam = new AWS.IAM()
const elb = new AWS.ELBv2()
const rds = new AWS.RDS()

function createAutoScalingGroup(paramsData) {
  const params = {
    AutoScalingGroupName: paramsData.asgName,
    AvailabilityZones: [
      'us-east-1a',
      'us-east-1b'
    ],
    TargetGroupARNs: [
      paramsData.tgArn
    ],
    LaunchConfigurationName: paramsData.launchConfigurationName,
    MaxSize: 2,
    MinSize: 1
  }

  return new Promise((resolve, reject) => {
    autoScaling.createAutoScalingGroup(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        console.log('autoscaling group created', data)

        resolve(paramsData)
      }
    })
  })
}

function createLoadBalancer(paramsData) {
  const params = {
    Name: paramsData.lbName,
    Subnets: paramsData.subnets,
    SecurityGroups: [
      paramsData.lbSgId
    ]
  }

  return new Promise((resolve, reject) => {
    elb.createLoadBalancer(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        console.log('Load balancer created', data)
        paramsData.lbArn = data.LoadBalancers[0].LoadBalancerArn
        paramsData.lbDNS = data.LoadBalancers[0].DNSName

        resolve(paramsData)
      }
    })
  })
}

function createTargetGroup(paramsData) {
  const params = {
    Name: paramsData.tgName,
    Port: paramsData.ec2Port,
    Protocol: 'HTTP',
    VpcId: paramsData.vpcId
  }

  return new Promise((resolve, reject) => {
    elb.createTargetGroup(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        console.log('Target group created', data)
        paramsData.tgArn = data.TargetGroups[0].TargetGroupArn

        resolve(paramsData)
      }
    })
  })
}

function createListener(paramsData) {
  const params = {
    DefaultActions: [{
      TargetGroupArn: paramsData.tgArn,
      Type: 'forward'
    }],
    LoadBalancerArn: paramsData.lbArn,
    Port: paramsData.listenerPort,
    Protocol: 'HTTP'
  }

  return new Promise((resolve, reject) => {
    elb.createListener(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        console.log('Listener created', data)

        resolve(paramsData)
      }
    })
  })
}

function createIamRole(paramsData) {
  const profileName = `${paramsData.roleName}_profile`
  const params = {
    RoleName: paramsData.roleName,
    AssumeRolePolicyDocument: '{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": { "Service": "ec2.amazonaws.com" }, "Action": "sts:AssumeRole" } ] }'
  }

  return new Promise((resolve, reject) => {
    iam.createRole(params, (err) => {
      if (err) {
        reject(err)
      } else {
        console.log('IAM role created')

        const params = {
          PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
          RoleName: paramsData.roleName
        }

        iam.attachRolePolicy(params, (err) => {
          if (err) {
            reject(err)
          } else {
            console.log('  IAM role attached to policy')

            iam.createInstanceProfile({
              InstanceProfileName: profileName
            }, (err, iData) => {
              if (err) {
                reject(err)
              } else {
                console.log('  IAM instance profile created')

                const params = {
                  InstanceProfileName: profileName,
                  RoleName: paramsData.roleName
                }

                iam.addRoleToInstanceProfile(params, (err) => {
                  if (err) {
                    reject(err)
                  } else {
                    console.log('  IAM role added to instance profile')
                    // Profile creation is slow, need to wait
                    paramsData.profileArn = iData.InstanceProfile.Arn
                    setTimeout(() => resolve(paramsData), 10000)
                  }
                })
              }
            })
          }
        })
      }
    })
  })
}

function createLaunchConfiguration(paramsData) {
  const params = {
    IamInstanceProfile: paramsData.profileArn,
    ImageId: paramsData.amiImageId,
    InstanceType: 't2.micro',
    LaunchConfigurationName: paramsData.launchConfigurationName,
    KeyName: paramsData.keyName,
    SecurityGroups: [
      paramsData.ec2SgName
    ],
    UserData: paramsData.userData
  }

  return new Promise((resolve, reject) => {
    autoScaling.createLaunchConfiguration(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        console.log('Launch configuration created', data)
        resolve(paramsData)
      }
    })
  })
}

function createLBSecurityGroup(paramsData) {
  const params = {
    Description: paramsData.lbSgName,
    GroupName: paramsData.lbSgName
  }

  return new Promise((resolve, reject) => {
    ec2.createSecurityGroup(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        console.log('security LB group created: ', data)

        const params = {
          GroupId: data.GroupId,
          IpPermissions: [{
            IpProtocol: 'tcp',
            FromPort: paramsData.lbPort,
            ToPort: paramsData.lbPort,
            IpRanges: [{
              CidrIp: '0.0.0.0/0'
            }]
          }]
        }
        ec2.authorizeSecurityGroupIngress(params, (err) => {
          if (err) {
            reject(err)
          } else {
            console.log('  Ingress set on security group')
            paramsData.lbSgId = data.GroupId
            resolve(paramsData)
          }
        })
      }
    })
  })
}

function createEC2SecurityGroup(paramsData) {
  const params = {
    Description: paramsData.ec2SgName,
    GroupName: paramsData.ec2SgName
  }

  return new Promise((resolve, reject) => {
    ec2.createSecurityGroup(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        console.log('security EC2 group created: ', data)

        const params = {
          GroupId: data.GroupId,
          IpPermissions: [{
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            IpRanges: [{
              CidrIp: '0.0.0.0/0'
            }]
          }, {
            IpProtocol: 'tcp',
            FromPort: paramsData.ec2Port,
            ToPort: paramsData.ec2Port,
            IpRanges: [{
              CidrIp: '0.0.0.0/0'
            }]
          }]
        }
        ec2.authorizeSecurityGroupIngress(params, (err) => {
          if (err) {
            reject(err)
          } else {
            console.log('  Ingress set on security group')
            paramsData.ec2SgId = data.GroupId
            resolve(paramsData)
          }
        })
      }
    })
  })
}

function createKeyPair(paramsData) {
  const params = {
    KeyName: paramsData.keyName
  }

  return new Promise((resolve, reject) => {
    ec2.createKeyPair(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        console.log('key pair created:', data.KeyName)
        paramsData.keyData = data
        resolve(paramsData)
      }
    })
  })
}

function persistKeyPair(paramsData) {
  return new Promise((resolve, reject) => {
    const keyPath = path.join(os.homedir(), '.ssh', paramsData.keyData.KeyName)
    const options = {
      encoding: 'utf8',
      mode: 0o600
    }

    fs.writeFile(keyPath, paramsData.keyData.KeyMaterial, options, (err) => {
      if (err) {
        reject(err)
      } else {
        console.log('Key written to', keyPath)
        resolve(paramsData)
      }
    })
  })
}

function createASGPolicy(paramsData) {
  const params = {
    AdjustmentType: 'ChangeInCapacity',
    AutoScalingGroupName: paramsData.asgName,
    PolicyName: paramsData.asgPolicyName,
    PolicyType: 'TargetTrackingScaling',
    TargetTrackingConfiguration: {
      TargetValue: 5,
      PredefinedMetricSpecification: {
        PredefinedMetricType: 'ASGAverageCPUUtilization'
      }
    }
  }

  return new Promise((resolve, reject) => {
    autoScaling.putScalingPolicy(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        console.log('auto scaling policy attached')

        resolve(paramsData)
      }
    })
  })
}

function createDBSecurityGroup(paramsData) {
  const params = {
    Description: paramsData.dbSgName,
    GroupName: paramsData.dbSgName
  }

  return new Promise((resolve, reject) => {
    ec2.createSecurityGroup(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        console.log('security DB group created: ', data)

        const params = {
          GroupId: data.GroupId,
          IpPermissions: [{
            IpProtocol: 'tcp',
            FromPort: 3306,
            ToPort: 3306,
            IpRanges: [{
              CidrIp: '0.0.0.0/0'
            }]
          }]
        }
        ec2.authorizeSecurityGroupIngress(params, (err) => {
          if (err) {
            reject(err)
          } else {
            console.log('  Ingress set on security group')
            paramsData.dbSgId = data.GroupId
            resolve(paramsData)
          }
        })
      }
    })
  })
}

function createDatabase(paramsData) {
  const params = {
    AllocatedStorage: 5,
    DBInstanceClass: 'db.t2.micro',
    DBInstanceIdentifier: paramsData.dbName,
    Engine: 'mysql',
    DBName: paramsData.dbName,
    VpcSecurityGroupIds: [paramsData.dbSgId],
    MasterUsername: 'root',
    MasterUserPassword: 'password'
  }

  return new Promise((resolve, reject) => {
    rds.createDBInstance(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        process.stdout.write('Waiting to create database...')

        const params = {
          DBInstanceIdentifier: paramsData.dbName
        }

        const maxTries = 100
        var tries = 0

        var intervalId = setInterval(() => {
          tries += 1

          rds.describeDBInstances(params, (err, data) => {
            process.stdout.write('.')
            if (err) {
              console.log('database didn\'t create correctly')
              reject(err)
            } else if (tries === maxTries) {
              clearInterval(intervalId)

              console.log(' timed out')
              reject('Took too long to start the database')
            } else if (data.DBInstances[0].Endpoint !== undefined) {
              clearInterval(intervalId)

              console.log(' database created!')

              paramsData.dbEndpoint = data.DBInstances[0].Endpoint.Address
              resolve(paramsData)
            }
          })
        }, 10000)
      }
    })
  })
}

module.exports = {
  persistKeyPair,
  createIamRole,
  createEC2SecurityGroup,
  createLBSecurityGroup,
  createKeyPair,
  createLaunchConfiguration,
  createLoadBalancer,
  createTargetGroup,
  createListener,
  createAutoScalingGroup,
  createASGPolicy,
  createDBSecurityGroup,
  createDatabase
}