import { IHumanBuildFileHost } from "./IHumanBuildFileHost";

/**
 * Synchronize complete file membership while keeping the output root stable.
 *
 * Equal bytes need no write. Completed replacements precede obsolete-file
 * removal; an effect failure propagates to the publication owner's rollback.
 * An undefined source restores an originally absent output to empty membership.
 */
export function synchronizeHumanBuild(
  host: IHumanBuildFileHost,
  source: string | undefined,
  output: string,
): void {
  const previous: readonly IHumanBuildFileHost.IEntry[] = host.files(output);
  const next: readonly IHumanBuildFileHost.IEntry[] =
    source === undefined ? [] : host.files(source);
  const digests: Map<string, string> = new Map(
    previous.map((entry: IHumanBuildFileHost.IEntry): [string, string] => [
      entry.file,
      entry.digest,
    ]),
  );
  const membership: Set<string> = new Set(
    next.map((entry: IHumanBuildFileHost.IEntry): string => entry.file),
  );
  for (const { file, digest } of next)
    if (source !== undefined && digests.get(file) !== digest)
      host.replace(source, output, file);
  for (const { file } of previous)
    if (!membership.has(file)) host.remove(output, file);
}
