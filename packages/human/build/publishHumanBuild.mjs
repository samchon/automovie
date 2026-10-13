/**
 * Replace runtime output only after both compiler passes have succeeded.
 * A failed install restores previous file membership, including an originally
 * empty output. If restoration also fails, both errors and the retained backup
 * remain available to the owner. Watched directories keep their identities.
 *
 * @param {import('./IHumanBuildHost').IHumanBuildHost} host
 * @param {string} stage
 *
 * @evidence contracts/common.md#principled-implementation Previous output is copied to a retained backup before replacement; failed replacement restores its complete file membership.
 * @evidence contracts/common.md#clear-and-simple-design Publication owns the single backup/install/restore sequence while the host owns filesystem operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rollback restores actual previous bytes and reports both failures when restoration fails.
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
