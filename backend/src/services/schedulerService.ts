import * as schedule from 'node-schedule';
import { updateTalkgroups, isTalkgroupsTableEmpty } from './talkgroupsService';
import { SummaryService } from './summaryService';

export function startScheduler() {
  console.log('Starting schedulers...');

  // Check if talkgroups table is empty on startup and load data if needed
  initializeTalkgroups();

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

  // Schedule hourly summary job at 5 minutes past each hour
  schedule.scheduleJob('summary-hourly', '5 * * * *', async () => {
    console.log('Running scheduled hourly summary at :05...');
    try {
      await SummaryService.runIncrementalSummary();
      console.log('Scheduled hourly summary completed');
    } catch (error: any) {
      console.error('Scheduled hourly summary failed:', error.message);
    }
  });

  console.log('Schedulers started:');
  console.log('- Talkgroups: daily updates at 02:00');
  console.log('- Summary: hourly updates at :05');
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

export function stopScheduler() {
  console.log('Stopping talkgroups scheduler...');
  schedule.gracefulShutdown();
}