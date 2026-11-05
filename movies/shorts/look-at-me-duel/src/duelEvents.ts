/** Shared absolute scene seconds for actual contact and consequence events. */
export const duelEvents: Readonly<{ gripReleaseEnd: number; armRecoveryEnd: number; turnEnd: number; retreatStart: number; retreatEnd: number; carinaHeelsDown: number; harryHeelsDown: number; shotLaunch: number; shotDeflect: number; mortarImpact: number; escapeStart: number; escapePlanted: number; capRelease: number; shieldRaised: number; shieldFade: number }> = Object.freeze({
  gripReleaseEnd: 15.15,
  armRecoveryEnd: 16.3,
  turnEnd: 17.1,
  retreatStart: 17.4,
  retreatEnd: 20.2,
  carinaHeelsDown: 17.8,
  harryHeelsDown: 20.9,
  shotLaunch: 536 / 24,
  shotDeflect: 560 / 24,
  mortarImpact: 579 / 24,
  escapeStart: 38.2,
  escapePlanted: 40,
  capRelease: 40.875,
  shieldRaised: 40.5,
  shieldFade: 44.4,
});
