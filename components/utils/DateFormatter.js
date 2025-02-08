// utils/DateFormatter.js
class DateFormatter {
    static formatToUSA(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    }
  }
  
  export default DateFormatter;
  