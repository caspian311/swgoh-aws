const helpers = require('./helpers')

const paramsData = {
    ec2SgName: 'test3_sg_ec2',
    asgName: 'test3_asg',
    asgPolicyName: 'test3_asg_policy',
    lbName: 'test3-lb',
    lbSgName: 'test3_sg_lb',
    tgName: 'test3-tg',
    keyName: 'test3_key',
    roleName: 'test3_admin_role',
    amiImageId: 'ami-0323c3dd2da7fb37d',
    launchConfigurationName: 'test3_lc',
    dbName: 'test3Db',
    dbSgName: 'test3_sg_db',
    ec2Port: 4567,
    lbPort: 80,
    listenerPort: 80,
    userData: 'IyEvYmluL2Jhc2gKCiMgZm9yIGluc3RhbmNlIElEIGFtaS0wMzIzYzNkZDJkYTdmYjM3ZAoKeXVtIGluc3RhbGwgLXkgZ2l0IGRvY2tlcgpzZXJ2aWNlIGRvY2tlciBzdGFydApkb2NrZXIgcHVsbCBydWJ5CgpnaXQgY2xvbmUgaHR0cHM6Ly9naXRodWIuY29tL2Nhc3BpYW4zMTEvc3dnb2gtYXBwLmdpdCAvcm9vdC9zd2dvaC1hcHAKZG9ja2VyIHJ1biAtLXJtIC12IC9yb290L3N3Z29oLWFwcDovYXBwIC1wIDQ1Njc6NDU2NyBydWJ5IC9hcHAvc3RhcnR1cC5zaA==',
    vpcId: 'vpc-ad9225cb',
    subnets: [
        'subnet-54bd3431',
        'subnet-2fd0bb02'
    ]
}

// aws iam delete-instance-profile --instance-profile-name test3_admin_role_profile

doit(paramsData)
    .then(helpers.createIamRole)
    .then(helpers.createKeyPair)
    .then(helpers.persistKeyPair)
    .then(helpers.createEC2SecurityGroup)
    .then(helpers.createLBSecurityGroup)
    .then(helpers.createDBSecurityGroup)
    .then(helpers.createDatabase)
    .then(helpers.prepareUserData)
    .then(helpers.createLaunchConfiguration)
    .then(helpers.createLoadBalancer)
    .then(helpers.createTargetGroup)
    .then(helpers.createListener)
    .then(helpers.createAutoScalingGroup)
    .then(helpers.createASGPolicy)
    .then(data => console.log(data))
    .catch(message => {
        console.log('Failed...', message)
    })

function doit(paramsData) {
    return new Promise(resolve => resolve(paramsData))
}