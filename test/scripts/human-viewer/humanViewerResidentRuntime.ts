/**
 * The resident runtime of one domain for a basis identity: reused while the
 * identity stays, created anew (and the previous one released) when it
 * changes, so candidate bases do not accumulate tens of megabytes each.
 * Concurrent callers share the pending load. A rejected load keeps its
 * original rejection but removes only its own cache entry, permitting the
 * next explicit same-identity request to retry a transient transport failure.
 * A late failure cannot remove a newer identity's replacement.
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
    const pending = found;
    void pending.catch(() => {
      if (cache.get(identity) === pending) cache.delete(identity);
    });
  }
  return found;
}
