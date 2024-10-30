const chalk = require('chalk');

const logTypes = {
    info: chalk.blue,
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow
};

const formatTimestamp = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

const log = (type, category, message) => {
    const color = logTypes[type] || chalk.white;
    const timestamp = formatTimestamp();
    console.log(color(`[${timestamp}] [${type.toUpperCase()}] [${category}] ${message}`));
};

module.exports = { log };