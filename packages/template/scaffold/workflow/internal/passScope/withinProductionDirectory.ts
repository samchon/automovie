/** Keeps both captured physical ownership and root-normalized logical ownership. */
export function withinProductionDirectory(
  root: string,
  filename: string,
  directory: string,
  canonical: (filename: string, logicalRoot?: string) => string,
): boolean {
  return [undefined, root].some((logicalRoot: string | undefined): boolean => {
    const target: string = canonical(filename, logicalRoot);
    const base: string = canonical(directory, logicalRoot);
    return (
      target === base ||
      target.startsWith(base.endsWith("/") ? base : `${base}/`)
    );
  });
}
