const fs = require('fs')

function getUserData(databaseUrl, databaseUsername, databasePassword) {
    return new Promise((resolve, reject) => {
        fs.readFile('./scripts/bootstrap.sh', (err, data) => {
            if (err) reject(err)
            else {
                var fileContent = data.toString()
                let [before, after] = fileContent.split('{environment-variables}')
    
                let environmentVariables = [ 
                    `-e "DATABASE_URL=${databaseUrl}"`, 
                    `-e "DATABASE_USER=${databaseUsername}"`, 
                    `-e "DATABASE_PASSWORD=${databasePassword}"` 
                ].join(' ')
                let newContent = `${before}${environmentVariables}${after}`
    
                let userData = Buffer.from(newContent).toString('base64')
                
                resolve(userData)
            }
        })
    })
}

module.exports = {
    getUserData
}