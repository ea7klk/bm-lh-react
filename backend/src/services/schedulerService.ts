import * as schedule from 'node-schedule';
import { updateTalkgroups, isTalkgroupsTableEmpty } from './talkgroupsService';

export function startScheduler() {
  console.log('Starting talkgroups scheduler...');

  // Check if talkgroups table is empty on startup and load data if needed
  initializeTalkgroups();

  // Schedule daily update at 02:00
  schedule.scheduleJob('0 2 * * *', async () => {
    console.log('Running scheduled talkgroups update at 02:00...');
    try {
      const result = await updateTalkgroups();
      console.log('Scheduled talkgroups update completed:', result);
    } catch (error: any) {
      console.error('Scheduled talkgroups update failed:', error.message);
    }
  });

  console.log('Talkgroups scheduler started - daily updates at 02:00');
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