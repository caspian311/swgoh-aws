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
        const params = {
          PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
          RoleName: paramsData.roleName
        }

        iam.attachRolePolicy(params, (err) => {
          if (err) {
            reject(err) 
          } else {
            iam.createInstanceProfile({ InstanceProfileName: profileName }, (err, iData) => {
              if (err) {
                reject(err)
              } else {
                const params = {
                  InstanceProfileName: profileName,
                  RoleName: paramsData.roleName
                }

                iam.addRoleToInstanceProfile(params, (err) => {
                  if (err) { 
                    reject(err)
                  } else {
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
          paramsData.sgName
      ],
      UserData: paramsData.userData
  }

  return new Promise((resolve, reject) => {
      autoScaling.createLaunchConfiguration(params, (err, data) => {
          if (err) reject(err)
          console.log('Launch configuration created', data)
          resolve(paramsData)
      })
  })
}

function createSecurityGroup(paramsData) {
  console.log('called createSecurityGroup with: ', paramsData)

  const params = {
      Description: paramsData.sgName,
      GroupName: paramsData.sgName
  }

  return new Promise((resolve, reject) => {
      ec2.createSecurityGroup(params, (err, data) => {
          if (err) {
            reject(err) 
          } else {
              console.log('security group created: ', data)

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
                      FromPort: paramsData.port,
                      ToPort: paramsData.port,
                      IpRanges: [{
                          CidrIp: '0.0.0.0/0'
                      }]
                  }]
              }
              ec2.authorizeSecurityGroupIngress(params, (err, data) => {
                  if (err) {
                    reject(err)
                  } else {
                      console.log('Ingress set on security group', data)
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
          }  else {
              console.log('key pair created:', data)
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
      if (err) { reject(err) 
      } else {
        console.log('Key written to', keyPath)
        resolve(paramsData)
      }
    })
  })
}

module.exports = {
  persistKeyPair,
  createIamRole,
  createSecurityGroup,
  createKeyPair,
  createLaunchConfiguration
}