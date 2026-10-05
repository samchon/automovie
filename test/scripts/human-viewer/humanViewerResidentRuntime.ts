/**
 * The resident runtime of one domain for a basis identity: reused while the
 * identity stays, created anew (and the previous one released) when it
 * changes, so candidate bases do not accumulate tens of megabytes each.
 *
 * @author Samchon
 */
export function humanViewerResidentRuntime<T>(
  cache: Map<string, Promise<T>>,
  identity: string,
  create: () => Promise<T>,
): Promise<T> {
  let found = cache.get(identity);
  if (found === undefined) {
    cache.clear();
    found = create();
    cache.set(identity, found);
  }
  return found;
}
