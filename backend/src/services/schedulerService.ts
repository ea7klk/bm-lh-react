import * as schedule from 'node-schedule';
import { updateTalkgroups, isTalkgroupsTableEmpty } from './talkgroupsService';
import { SummaryService } from './summaryService';
import { cleanupService } from './cleanupService';

export function startScheduler() {
  console.log('Starting schedulers...');

  // Check if talkgroups table is empty on startup and load data if needed
  initializeTalkgroups();

  // Run initial token cleanup on startup
  initialTokenCleanup();

  // Schedule daily talkgroups update at 02:00
  schedule.scheduleJob('talkgroups-daily', '0 2 * * *', async () => {
    console.log('Running scheduled talkgroups update at 02:00...');
    try {
      const result = await updateTalkgroups();
      console.log('Scheduled talkgroups update completed:', result);
    } catch (error: any) {
      console.error('Scheduled talkgroups update failed:', error.message);
    }
  });

  // Schedule hourly summary job at 5 minutes past each hour (if enabled)
  const enableSummaryScheduler = process.env.ENABLE_SUMMARY_SCHEDULER !== 'false';
  
  if (enableSummaryScheduler) {
    schedule.scheduleJob('summary-hourly', '5 * * * *', async () => {
      console.log('Running scheduled hourly summary at :05...');
      try {
        await SummaryService.runIncrementalSummary();
        console.log('Scheduled hourly summary completed');
      } catch (error: any) {
        console.error('Scheduled hourly summary failed:', error.message);
      }
    });
    console.log('- Summary: hourly updates at :05');
  } else {
    console.log('- Summary: scheduler disabled (ENABLE_SUMMARY_SCHEDULER=false)');
  }

  // Schedule token cleanup every 10 minutes
  schedule.scheduleJob('token-cleanup', '*/10 * * * *', async () => {
    console.log('Running scheduled token cleanup...');
    try {
      const result = await cleanupService.cleanupExpiredTokens();
      
      // Also clean up completed tokens for good housekeeping
      await cleanupService.cleanupUsedPasswordResetTokens();
      await cleanupService.cleanupCompletedEmailChangeTokens();
      
      if (result.passwordResetTokens > 0 || result.emailChangeTokens > 0) {
        console.log(`Token cleanup completed: ${result.passwordResetTokens} password reset, ${result.emailChangeTokens} email change tokens removed`);
      }
    } catch (error: any) {
      console.error('Scheduled token cleanup failed:', error.message);
    }
  });

  console.log('Schedulers started:');
  console.log('- Talkgroups: daily updates at 02:00');
  console.log('- Token cleanup: every 10 minutes');
}

async function initializeTalkgroups() {
  try {
    const isEmpty = await isTalkgroupsTableEmpty();
    if (isEmpty) {
      console.log('Talkgroups table is empty, loading initial data...');
      const result = await updateTalkgroups();
      console.log('Initial talkgroups data loaded:', result);
    } else {
      console.log('Talkgroups table already contains data');
    }
  } catch (error: any) {
    console.error('Error initializing talkgroups:', error.message);
  }
}

async function initialTokenCleanup() {
  try {
    console.log('Running initial token cleanup...');
    const stats = await cleanupService.getTokenStatistics();
    
    if (stats.expiredPasswordResetTokens > 0 || stats.expiredEmailChangeTokens > 0) {
      console.log(`Found expired tokens - Password reset: ${stats.expiredPasswordResetTokens}, Email change: ${stats.expiredEmailChangeTokens}`);
      
      const result = await cleanupService.cleanupExpiredTokens();
      await cleanupService.cleanupUsedPasswordResetTokens();
      await cleanupService.cleanupCompletedEmailChangeTokens();
      
      console.log(`Initial cleanup completed: ${result.passwordResetTokens} password reset, ${result.emailChangeTokens} email change tokens removed`);
    } else {
      console.log('No expired tokens found on startup');
    }
  } catch (error: any) {
    console.error('Error during initial token cleanup:', error.message);
  }
}

export function stopScheduler() {
  console.log('Stopping talkgroups scheduler...');
  schedule.gracefulShutdown();
}