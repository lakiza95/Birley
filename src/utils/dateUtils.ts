import moment from 'moment-timezone';

export const formatDateTime = (date: string | Date, timezone: string, format: string = 'LLL') => {
  return moment(date).tz(timezone).format(format);
};
