/**
 * Shared by autoMovieAssemblyOpeningReveal, matchAutoMovieAssemblyJunction, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `IAutoMovieAssemblyHost` represents the host dimension a build-up is measured against. This ensures each host region retains its ordered construction build-up and total thickness.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `IAutoMovieAssemblyHost` structures the host dimension a build-up is measured against for the system that resolves ordered construction layers into their host face regions.
 * @author Samchon
 */
export const trailingRun = <T>(
  items: readonly T[],
  match: (item: T) => boolean,
): number => {
  let count = 0;
  while (count < items.length && match(items[items.length - 1 - count]!))
    count += 1;
  return count;
};
