/**
 * Synchronize complete file membership while keeping the output root stable.
 * Equal bytes need no write. Completed replacements precede obsolete-file
 * removal; an effect failure propagates to the publication owner's rollback.
 * Undefined source restores an originally absent output to empty membership.
 *
 * @param {import('./IHumanBuildFileHost').IHumanBuildFileHost} host
 * @param {string | undefined} source
 * @param {string} output
 */
export function synchronizeHumanBuild(host, source, output) {
  const previous = host.files(output);
  const next = source === undefined ? [] : host.files(source);
  const digests = new Map(previous.map(({ file, digest }) => [file, digest]));
  const membership = new Set(next.map(({ file }) => file));
  for (const { file, digest } of next)
    if (digests.get(file) !== digest) host.replace(source, output, file);
  for (const { file } of previous)
    if (!membership.has(file)) host.remove(output, file);
}
