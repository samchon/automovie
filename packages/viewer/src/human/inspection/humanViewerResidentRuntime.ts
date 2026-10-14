/**
 * The resident runtime of one domain for a basis identity: reused while the identity stays, created anew (and the previous map entry removed) when it changes, so candidate bases do not accumulate tens of megabytes each. Concurrent callers share the pending load. A rejected load keeps its original rejection but removes only its own cache entry, permitting the next explicit same-identity request to retry a transient transport failure. A late failure cannot remove a newer identity's replacement.
 *
 * @evidence contracts/common.md#principled-implementation Equal current identity shares its pending asset promise, replacement clears the prior map slot and rejection removes only that exact promise to permit a later explicit retry.
 * @evidence contracts/common.md#clear-and-simple-design One map lookup and identity-checked failure observer implement latest-source memoization without another asset decoder or retry loop.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejection remains the original promise cause and a late old failure cannot delete the newer source promise; synchronous factory refusal is not stored as success.
 * @evidence contracts/common.md#meaningful-documentation The comment states latest identity retention, concurrent sharing, explicit retry and late-failure protection.
 * @evidence contracts/performance.md#efficient-algorithms Current lookup and insertion use expected constant-time map operations; clearing is proportional to existing entries and this helper's actual callers keep at most one.
 * @evidence contracts/performance.md#reuse-equivalent-work Exact supplied identity within the caller's fixed source-kind/origin map shares one promise; another identity withdraws that reuse and failed current loading allows explicit reacquisition.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The map holds at most one current promise after helper admission, while callers can retain superseded in-flight work until settlement; no asset bytes are copied or physically disposed by withdrawing the map slot.
 *
 * @author Samchon
 */
export function humanViewerResidentRuntime<T>(
  cache: Map<string, Promise<T>>,
  identity: string,
  create: () => Promise<T>,
): Promise<T> {
  let found: Promise<T> | undefined = cache.get(identity);
  if (found === undefined) {
    cache.clear();
    found = create();
    cache.set(identity, found);
    const pending: Promise<T> = found;
    void pending.catch((): void => {
      if (cache.get(identity) === pending) cache.delete(identity);
    });
  }
  return found;
}
