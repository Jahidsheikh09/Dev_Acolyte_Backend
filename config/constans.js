var moment_tz = require('moment-timezone');

const getMomentExDate = (date) => {
    return moment_tz(date).tz('Asia/Kolkata').format('YYYY-MM-DD');
}

const getMomentExDateFormate = (date) => {
    return moment_tz(date).tz('Asia/Kolkata').format('DD-MM-YYYY');
}
const getMomentExTime = (date) => {
    return moment_tz(date).tz('Asia/Kolkata').format('HH:mm');
}

const getCurrentDateTimeMoment = () => {
    return moment_tz().tz('Asia/Kolkata');
}

const getCurrentDate = () => {
    return getCurrentDateTimeMoment().format('YYYY-MM-DD');
}
const getCurrentDatePro = () => {
    return getCurrentDateTimeMoment().format('DD-MM-YYYY');
}

const getCurrentDateTime = () => {
    return getCurrentDateTimeMoment().format('YYYY-MM-DD HH:mm:ss');
}

const getCurrentTime = () => {
    return getCurrentDateTimeMoment().format('HH:mm');
}

const getTMinusDate = (days) => {
    return getCurrentDateTimeMoment().subtract(days, 'days').format('YYYY-MM-DD');
};

const getTPlusDate = (days) => {
    return getCurrentDateTimeMoment().add(days, 'days').format('YYYY-MM-DD');
};

const getTMinusDateTime = (days) => {
    return getCurrentDateTimeMoment().subtract(days, 'days').format('YYYY-MM-DD HH:mm:ss');
};

const getTPlusDateTime = (days) => {
    return getCurrentDateTimeMoment().add(days, 'days').format('YYYY-MM-DD HH:mm:ss');
};

const getCurrentUnixTime = () => {
    return Math.floor(Date.now() / 1000); // Current UNIX time in seconds
};




module.exports = {
    getMomentExDateFormate,
    getMomentExTime,
    getMomentExDate,
    getCurrentDate,
    getCurrentDateTime,
    getTMinusDate,
    getTPlusDate,
    getTMinusDateTime,
    getTPlusDateTime,
    getCurrentUnixTime,
    getCurrentTime,
    getCurrentDatePro
};
