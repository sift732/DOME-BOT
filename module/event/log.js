const chalk = require('chalk');

const logTypes = {
    info: chalk.blue,
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow
};

const log = (type, message) => {
    const color = logTypes[type] || chalk.white;
    console.log(color(message));
};

module.exports = { log };
