function formatDuration(duration) {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    const hoursStr = (hours < 10) ? `0${hours}` : hours;
    const minutesStr = (minutes < 10) ? `0${minutes}` : minutes;
    const secondsStr = (seconds < 10) ? `0${seconds}` : seconds;

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

module.exports = formatDuration;
