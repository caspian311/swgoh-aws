const fs = require('fs')
const path = require('path')
const os = require('os')

function persistKeyPair(keyData) {
  return new Promise((resolve, reject) => {
    const keyPath = path.join(os.homedir(), '.ssh', keyData.KeyName)
    const options = {
      encoding: 'utf8',
      mode: 0o600
    }

    fs.writeFile(keyPath, keyData.KeyMaterial, options, (err) => {
      if (err) reject(err)
      else {
        console.log('Key written to', keyPath)
        resolve(keyData.KeyName)
      }
    })
  })
}

function createIamRole(roleName) {
  const profileName = `${roleName}_profile`
  const iam = new AWS.IAM()
  const params = {
    RoleName: roleName,
    AssumeRolePolicyDocument: '{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": { "Service": "ec2.amazonaws.com" }, "Action": "sts:AssumeRole" } ] }'
  }

  return new Promise((resolve, reject) => {
    iam.createRole(params, (err) => {
      if (err) reject(err)
      else {
        const params = {
          PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
          RoleName: roleName
        }

        iam.attachRolePolicy(params, (err) => {
          if (err) reject(err)
          else {
            iam.createInstanceProfile({
              InstanceProfileName: profileName
            }, (err, iData) => {
              if (err) reject(err)
              else {
                const params = {
                  InstanceProfileName: profileName,
                  RoleName: roleName
                }
                iam.addRoleToInstanceProfile(params, (err) => {
                  if (err) reject(err)
                  else {
                    // Profile creation is slow, need to wait
                    setTimeout(() => resolve(iData.InstanceProfile.Arn), 10000)
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

module.exports = {
  persistKeyPair,
  createIamRole
}