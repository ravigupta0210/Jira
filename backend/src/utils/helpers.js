const { v4: uuidv4 } = require('uuid');

const generateId = () => uuidv4();

const formatDate = (date) => {
  return new Date(date).toISOString();
};

const parseJSON = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

const generateMeetingLink = () => {
  // Return the default Google Meet link as requested
  return 'https://meet.google.com/wmp-tzfx-hac';
};

module.exports = {
  generateId,
  formatDate,
  parseJSON,
  sanitizeUser,
  generateMeetingLink
};
