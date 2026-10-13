/**
 * Publish one completed staged file through an owned exclusive sibling.
 * A failed reservation never grants permission to remove the colliding path.
 * After reservation, disposal runs on success and failure, preserving both
 * original and disposal errors when they occur together.
 *
 * @param {import('./IHumanBuildFileReplacement').IHumanBuildFileReplacement} host
 */
export function replaceHumanBuildFile(host) {
  let owned = false;
  const failures = [];
  try {
    const release = host.reserve();
    owned = true;
    release();
    host.copy();
    host.publish();
  } catch (error) { failures.push(error); }
  if (owned) {
    try { host.discard(); }
    catch (error) { failures.push(error); }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1)
    throw new AggregateError(failures, 'Human file publication and sibling disposal both failed.');
}
