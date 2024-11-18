const fs = require('fs');

module.exports.verificationTemplate = (code) => {
    let template_data = fs.readFileSync(__dirname + '/../templates/verification.html', 'utf8');
    return template_data.replace('§verificationCode§', code);
}