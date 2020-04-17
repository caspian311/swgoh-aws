const AWS = require('aws-sdk')
const helpers = require('./helpers')

AWS.config.update({
    region: 'us-east-1'
})

const ec2 = new AWS.EC2()
const sgName = 'test3_sg'
const keyName = 'test3_key'



createSecurityGroup(sgName, 4567)
    .then(() => {
        return createKeyPair(keyName)
    })
    .then(helpers.persistKeyPair)
    .then(() => {
        return createInstance(sgName, keyName)
    })
    .catch((message) => {
        console.log('Failed...', message)
    })

function createSecurityGroup(sgName, port) {
    const params = {
        Description: sgName,
        GroupName: sgName
    }

    return new Promise((resolve, reject) => {
        ec2.createSecurityGroup(params, (err, data) => {
            if (err) reject(err)
            else {
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
                        FromPort: port,
                        ToPort: port,
                        IpRanges: [{
                            CidrIp: '0.0.0.0/0'
                        }]
                    }]
                }
                ec2.authorizeSecurityGroupIngress(params, (err, data) => {
                    if (err) reject(err)
                    else {
                        console.log('Ingress set on security group', data)
                        resolve()
                    }

                })
            }
        })
    })
}

function createKeyPair(keyName) {
    const params = {
        KeyName: keyName
    }

    return new Promise((resolve, reject) => {
        ec2.createKeyPair(params, (err, data) => {
            if (err) reject(err)
            else {
                console.log('key pair created:', data)
                resolve(data)
            }
        })
    })
}

function createInstance(sgName, keyName) {
    const params = {
        ImageId: 'ami-0323c3dd2da7fb37d',
        InstanceType: 't2.micro',
        KeyName: keyName,
        MaxCount: 1,
        MinCount: 1,
        SecurityGroups: [
            sgName
        ],
        UserData: 'IyEvYmluL2Jhc2gKCiMgZm9yIGluc3RhbmNlIElEIGFtaS0wMzIzYzNkZDJkYTdmYjM3ZAoKeXVtIGluc3RhbGwgLXkgZ2l0IGRvY2tlcgpzZXJ2aWNlIGRvY2tlciBzdGFydApkb2NrZXIgcHVsbCBydWJ5CgpnaXQgY2xvbmUgaHR0cHM6Ly9naXRodWIuY29tL2Nhc3BpYW4zMTEvc3dnb2gtYXBwLmdpdCAvcm9vdC9zd2dvaC1hcHAKZG9ja2VyIHJ1biAtLXJtIC12IC9yb290L3N3Z29oLWFwcDovYXBwIC1wIDQ1Njc6NDU2NyBydWJ5IC9hcHAvc3RhcnR1cC5zaA=='
    }

    return new Promise((resolve, reject) => {
        ec2.runInstances(params, (err, data) => {
            if (err) reject(err)
            else { 
                console.log('Created EC2 instance', data)
                resolve(data)
            }
        })
    })
}