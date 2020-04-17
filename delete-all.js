const AWS = require('aws-sdk')

AWS.config.update({
    region: 'us-east-1'
})

const ec2 = new AWS.EC2()
const autoScaling = new AWS.AutoScaling()
const iam = new AWS.IAM()
const elb = new AWS.ELBv2()

const loadBalancerARN = 'arn:aws:elasticloadbalancing:us-east-1:792688616974:loadbalancer/app/test3-lb/1e918f4193f6e8de'
const targetGroupARN = 'arn:aws:elasticloadbalancing:us-east-1:792688616974:targetgroup/test3-tg/47227865ff85c7c0'

doit()
    .then(() => deleteAutoScalingGroup('test3_asg'))
    .then(() => deleteLoadBalancer(loadBalancerARN))
    .then(() => deleteTargetGroup(targetGroupARN))
    .then(() => deleteLaunchConfiguration('test3_lc'))
    .then(() => deleteSecurityGroup('test3_sg_lb'))
    .then(() => deleteSecurityGroup('test3_sg_ec2'))
    .then(() => deleteKeyPair('test3_key'))
    .then(() => removeRoleFromInstanceProfile('test3_admin_role_profile', 'test3_admin_role'))
    .then(() => removeRolePolicy('test3_admin_role'))
    .then(() => deleteIamInstanceProfile('test3_admin_role_profile'))
    .then(() => deleteIamRole('test3_admin_role'))
    .then(() => console.log('DONE!'))
    .catch(message => console.log('ERROR: ', message))

function doit() {
    return new Promise(resolve => resolve())
}

function deleteAutoScalingGroup(asgName) {
    const params = {
        AutoScalingGroupName: asgName,
        ForceDelete: true
    }

    return new Promise((resolve, reject) => {
        autoScaling.deleteAutoScalingGroup(params, (err, data) => {
            if (err) {
                console.log('could not delete auto scaling group')
            } else {
                console.log('auto scaling group deleted')
            }

            resolve()
        })
    })
}

function removeRolePolicy(roleName) {
    return new Promise((resolve, reject) => {
        const params = {
            RoleName: roleName,
            PolicyName: 'AdministratorAccess'
        }

        iam.deleteRolePolicy(params, (err, data) => {
            if (err) { 
                console.log('could remove policy from role', err.message)
            } else {
                console.log('policy removed from role', data)    
            }

            resolve()
        })
    })
}

function deleteLoadBalancer(arn) {
    return new Promise((resolve, reject) => {
        const params = {
            LoadBalancerArn: arn
        }

        elb.deleteLoadBalancer(params, (err, data) => {
            if (err) { 
                console.log('could not delete load blancer', err.message)
            } else {
                console.log('load balancer deleted', data)    
            }

            resolve()
        })
    })
}

function deleteTargetGroup(arn) {
    return new Promise((resolve, reject) => {
        const params = {
            TargetGroupArn: arn
        }

        elb.deleteTargetGroup(params, (err, data) => {
            if (err) {
                console.log('could not delete target group', err.message)    
            } else {
                console.log('target group deleted', data)
            }
            
            resolve()
        })
    })
}

function deleteLaunchConfiguration(name) {
    return new Promise((resolve, reject) => {
        const params = {
            LaunchConfigurationName: name
        }

        autoScaling.deleteLaunchConfiguration(params, (err, data) => {
            if (err) {
                console.log('could not delete launch configuration', err.message)
            } else {    
                console.log('launch configuration deleted', data)
            }
            
            resolve()    
        })
    })
}

function deleteIamRole(name) {
    return new Promise((resolve, reject) => {
        const params = {
            RoleName: name
        }

        iam.deleteRole(params, (err, data) => {
            if (err) {
                console.log('could not delete iam role', err.message)
            } else {
                console.log('launch configuration deleted', data)
            }
            
            resolve()
        })
    })
}

function deleteIamInstanceProfile(name) {
    return new Promise((resolve, reject) => {
        const params = {
            InstanceProfileName: name
        }

        iam.deleteInstanceProfile(params, (err, data) => {
            if (err) {
                console.log('could not delete instance profile', err.message)
            } else {
                console.log('launch configuration deleted', data)
            }
            
            resolve()
        })
    })
}

function removeRoleFromInstanceProfile(instanceProfile, roleName) {
    return new Promise((resolve, reject) => {
        const params = {
            InstanceProfileName: instanceProfile,
            RoleName: roleName
        }

        iam.removeRoleFromInstanceProfile(params, (err, data) => {
            if (err) {
                console.log('could not remove role from instance profile', err.message)
            } else {
                console.log('instance profile removed from role', data)
            }
            
            resolve()
        })
    })
}

function deleteSecurityGroup(sgName) {
    return new Promise((resolve, reject) => {
        const params = {
            GroupName: sgName
        }

        ec2.deleteSecurityGroup(params, (err, data) => {
            if (err) {
                console.log('could not delete security group', err.message)
            } else {
                console.log('security group deleted', data)    
            }
            
            resolve()
        })
    })
}

function deleteKeyPair(keyName) {
    return new Promise((resolve, reject) => {
        const params = {
            KeyName: keyName
        }

        ec2.deleteKeyPair(params, (err, data) => {
            if (err) {
                console.log('could not delete key pair', err)
            } else {
                console.log('key pair deleted', data)
            }
            
            resolve()
        })
    })
}
