/**
 * Replace runtime output only after both compiler passes have succeeded.
 * A failed install restores previous file membership, including an originally
 * empty output. If restoration also fails, both errors and the retained backup
 * remain available to the owner. Watched directories keep their identities.
 *
 * @param {import('./IHumanBuildHost').IHumanBuildHost} host
 * @param {string} stage
 */
export function publishHumanBuild(host, stage) {
  const previous = host.hasPrevious();
  if (previous) host.backup(stage);
  try {
    host.install(stage);
  } catch (error) {
    try {
      host.restore(stage);
    } catch (restoreError) {
      throw new AggregateError(
        [error, restoreError],
        'Human build publication and restoration both failed; recovery output remains in the stage.',
      );
    }
    if (previous) {
      try { host.removeBackup(stage); }
      catch (cleanupError) {
        throw new AggregateError([error, cleanupError], 'Human output was restored, but backup disposal also failed.');
      }
    }
    throw error;
  }
  if (previous) host.removeBackup(stage);
}
