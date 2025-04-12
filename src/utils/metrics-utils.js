const moment = require("moment");

/**
 * Get start dates for current and previous month
 * @returns {Object} Date range objects
 */
function getDateRanges() {
  const startOfMonth = moment().startOf("month").toDate();
  const startOfLastMonth = moment()
    .subtract(1, "months")
    .startOf("month")
    .toDate();

  return { startOfMonth, startOfLastMonth };
}

/**
 * Calculate percentage change between two values
 * @param {Number} current - Current value
 * @param {Number} previous - Previous value to compare against
 * @returns {Number} Percentage change
 */
function calcPercentChange(current, previous) {
  return previous ? ((current - previous) / previous) * 100 : 0;
}

/**
 * Format order ID from MongoDB ObjectId
 * @param {ObjectId} id - MongoDB ObjectId
 * @returns {String} Formatted order ID
 */
function formatOrderId(id) {
  return `ORD-${id.toString().slice(-4)}`;
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {String} Formatted date string
 */
function formatDate(date) {
  return moment(date).format("YYYY-MM-DD");
}

module.exports = {
  getDateRanges,
  calcPercentChange,
  formatOrderId,
  formatDate,
};
