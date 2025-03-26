function main() {
  // ===== CONFIGURATION =====
  var threshold = 0.30;  // 30% increase threshold
  var emailRecipient = "your.email@example.com, anothermail@example.com";  // Replace with your email
  
  // ===== DATE CALCULATIONS =====
  // Get the current account time zone for proper date formatting.
  var timeZone = AdsApp.currentAccount().getTimeZone();
  
  // Calculate dates: Yesterday and the day before yesterday
  var today = new Date();
  
  // Yesterday:
  var yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  var yesterdayStr = Utilities.formatDate(yesterday, timeZone, "yyyyMMdd");
  
  // Day before yesterday:
  var dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(today.getDate() - 2);
  var dayBeforeYesterdayStr = Utilities.formatDate(dayBeforeYesterday, timeZone, "yyyyMMdd");
  
  // ===== PROCESS CAMPAIGNS =====
  var anomaliesFound = [];
  var campaignIterator = AdsApp.campaigns().get();
  
  while (campaignIterator.hasNext()) {
    var campaign = campaignIterator.next();
    var campaignName = campaign.getName();
    
    // Retrieve spend statistics for the two days
    var statsYesterday = campaign.getStatsFor(yesterdayStr, yesterdayStr);
    var statsDayBefore = campaign.getStatsFor(dayBeforeYesterdayStr, dayBeforeYesterdayStr);
    
    var costYesterday = statsYesterday.getCost();
    var costDayBefore = statsDayBefore.getCost();
    
    // Only check if there was spend on the day before yesterday to avoid division by zero.
    if (costDayBefore > 0) {
      // Calculate the percentage change in spend.
      var percentageChange = (costYesterday - costDayBefore) / costDayBefore;
      
      // Check if the increase is at least the threshold (30%).
      if (percentageChange >= threshold) {
        anomaliesFound.push({
          campaignName: campaignName,
          costDayBefore: costDayBefore,
          costYesterday: costYesterday,
          percentageChange: percentageChange
        });
      }
    }
  }
  
  // ===== SEND EMAIL IF ANY ANOMALIES DETECTED =====
  if (anomaliesFound.length > 0) {
    // Get the account name
    var accountName = AdsApp.currentAccount().getName();
    
    // Include account name in the subject
    var subject = "Google Ads (" + accountName + ") Spend Anomaly Alert";
    
    var body = "The following campaigns have exceeded the 30% spend increase threshold:\n\n";
    
    for (var i = 0; i < anomaliesFound.length; i++) {
      var anomaly = anomaliesFound[i];
      body += "Campaign: " + anomaly.campaignName + "\n" +
              "Spend on " + dayBeforeYesterdayStr + ": $" + anomaly.costDayBefore.toFixed(2) + "\n" +
              "Spend on " + yesterdayStr + ": $" + anomaly.costYesterday.toFixed(2) + "\n" +
              "Increase: " + (anomaly.percentageChange * 100).toFixed(2) + "%\n\n";
    }
    
    MailApp.sendEmail(emailRecipient, subject, body);
    Logger.log("Alert email sent to " + emailRecipient);
  } else {
    Logger.log("No anomalies found.");
  }
}
