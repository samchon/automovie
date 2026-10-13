/**
 * The resident runtime of one domain for a basis identity: reused while the
 * identity stays, created anew (and the previous map entry removed) when it
 * changes, so candidate bases do not accumulate tens of megabytes each.
 * Concurrent callers share the pending load. A rejected load keeps its
 * original rejection but removes only its own cache entry, permitting the
 * next explicit same-identity request to retry a transient transport failure.
 * A late failure cannot remove a newer identity's replacement.
 *
 * @evidence contracts/common.md#principled-implementation Promise identity shares a pending same-basis load and ensures a rejected older load cannot evict its replacement.
 * @evidence contracts/common.md#clear-and-simple-design A domain-owned map retains one basis runtime and delegates construction to the supplied loader without introducing another resource cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reuses only the original identity's promise and removes failed ownership; it never substitutes an estimated model or automatically replays failed work.
 * @evidence contracts/common.md#meaningful-documentation States single-basis retention, explicit-request recovery and the late-rejection ownership rule.
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
