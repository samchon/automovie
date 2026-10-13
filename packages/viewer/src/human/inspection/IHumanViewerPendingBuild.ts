import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { ConnectedFaceResult } from "@automovie/human/face/runtime/ConnectedFaceResult";

/**
 * One numerical build the page asked its worker for and still awaits.
 *
 * @evidence contracts/common.md#principled-implementation Stores settlement callbacks for one correlated original numerical result while the page waits for its current realm.
 * @evidence contracts/common.md#clear-and-simple-design Keeps model-result correlation separate from admission-only replies and optional cache-write notifications.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/unsuccessful values reject rather than fabricating a preview, and retired request ids cannot affect a later display.
 * @evidence contracts/common.md#meaningful-documentation Documents original Face/Body-compatible result union and refusal Error, with actual operation preserved in successful values.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Callback records perform no build; numerical geometry/encoding costs remain with actual product owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Each build has its own id even when readiness is shared; cache eligibility is decided by actual document/basis/source/AO identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Map entries leave on reply/failure/port retirement, with no independent request cap; returned model lifetime transfers to its viewport/resident.
 *
 * @author Samchon
 */
export interface IHumanViewerPendingBuild {
  /**
   * Settles the request with the worker's model.
   *
   * @evidence contracts/common.md#principled-implementation Settles the exact pending request with the original successful numerical operation/result value.
   * @evidence contracts/common.md#clear-and-simple-design Keeps product value delivery separate from GPU preparation, scene commit and construction admission display.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The page requires actual success and a present value before invoking this resolver; no missing draft becomes a valid preview.
   * @evidence contracts/common.md#meaningful-documentation Face and Body-compatible outputs retain original operation semantics, including supported composed-person transport results.
   * @evidence contracts/performance.md#efficient-algorithms Correlation lookup/removal is expected constant time, while downstream preparation scales with returned geometry.
   * @evidence contracts/performance.md#reuse-equivalent-work Reply delivery is per request; sharing readiness/cache inputs cannot authorize resolving a different pending id.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The request entry is removed and its port-owned id withdrawn on settlement; the consumer retains model arrays under its own resident lifetime.
   */
  resolve: (value: ConnectedFaceResult | ConnectedBodyResult) => void;

  /**
   * Settles the request with the worker's refusal.
   *
   * @evidence contracts/common.md#principled-implementation Rejects this pending result with the original numerical or execution refusal after its correlation is withdrawn.
   * @evidence contracts/common.md#clear-and-simple-design Keeps failure settlement separate from successful value preparation and optional persistence outcomes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No failed build is replayed or replaced by stale cached geometry merely to settle the request successfully.
   * @evidence contracts/common.md#meaningful-documentation The Error preserves original refusal cause; failed transport/source affects all currently pending requests while a document failure targets its id.
   * @evidence contracts/performance.md#efficient-algorithms Single reply rejection is fixed map bookkeeping; terminal failure traverses currently pending callbacks once.
   * @evidence contracts/performance.md#reuse-equivalent-work A later explicitly requested build may use a compatible replacement realm, but this failed promise remains rejected.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Failure, reply and port/frame retirement remove pending references; unresolved tasks have no independent numeric cap in this interface.
   */
  reject: (error: Error) => void;
}
