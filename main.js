const AWS = require('aws-sdk')
const helpers = require('./helpers')

const paramsData = {
    sgName: 'test3_sg',
    keyName: 'test3_key',
    roleName: 'test3_rolename',
    amiImageId: 'ami-0323c3dd2da7fb37d',
    launchConfigurationName: 'test3_lc',
    port: 4567,
    userData: 'IyEvYmluL2Jhc2gKCiMgZm9yIGluc3RhbmNlIElEIGFtaS0wMzIzYzNkZDJkYTdmYjM3ZAoKeXVtIGluc3RhbGwgLXkgZ2l0IGRvY2tlcgpzZXJ2aWNlIGRvY2tlciBzdGFydApkb2NrZXIgcHVsbCBydWJ5CgpnaXQgY2xvbmUgaHR0cHM6Ly9naXRodWIuY29tL2Nhc3BpYW4zMTEvc3dnb2gtYXBwLmdpdCAvcm9vdC9zd2dvaC1hcHAKZG9ja2VyIHJ1biAtLXJtIC12IC9yb290L3N3Z29oLWFwcDovYXBwIC1wIDQ1Njc6NDU2NyBydWJ5IC9hcHAvc3RhcnR1cC5zaA=='
}

helpers.createKeyPair(paramsData)
    .then(helpers.persistKeyPair)
    .then(helpers.createSecurityGroup)
    .then(helpers.createIamRole)
    .then(helpers.createLaunchConfiguration)
    .then(data => console.log(data))
    .catch(message => {
        console.log('Failed...', message)
    })
