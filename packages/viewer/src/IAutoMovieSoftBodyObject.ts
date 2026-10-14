import type { AutoMovieSoftAnalysisStatus, IAutoMovieSoftBodySurface } from "@automovie/interface";
import type * as THREE from "three";

/**
 * A viewer-owned cloth projection of the currently uploaded canonical surface; updates replace its domain metadata without checking domain identity.
 *
 * @evidence contracts/common.md#principled-implementation Pairs one viewer-owned canonical cloth projection with status-carrying updates and its terminal resource owner.
 * @evidence contracts/common.md#clear-and-simple-design Mutable upload and disposal responsibilities travel with the mesh while Engine solve/derivation remains outside the viewer object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every update requires actual analysis status rather than inheriting an earlier solved claim; mesh/type presence does not prove physical solve, rendered pixels or native release.
 * @evidence contracts/common.md#meaningful-documentation Documents status changes over shot time, owned geometry, optional borrowed material and terminal update/refusal semantics.
 * @evidence contracts/performance.md#efficient-algorithms The handle holds one mesh and closures; actual canonical copying, same-size reuse and topology transfer cost remains with the builder.
 * @evidence contracts/performance.md#reuse-equivalent-work Equivalent buffer representation is reused in place while changed dimensions/index width transfer geometry ownership; equal domain/status alone does not authorize stale surface reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most current plus one failed predecessor geometry is retained after a refused transfer, with further updates blocked; owned default material retires independently and supplied material stays borrowed.
 *
 * @author Samchon
 */
export interface IAutoMovieSoftBodyObject {
  /** Add this mesh to the current scene. */
  object: THREE.Mesh;

  /**
   * Re-upload the panel at a newly analysed shot second.
   *
   * The status is required here for the same reason it is required to build the object: it can change between seconds. A furnishing whose declared step budget stops inside the cut is `solved` early and `not-run` later, and an update that carried only geometry would leave the earlier claim standing over the later panel.
   *
   * @evidence contracts/common.md#principled-implementation Copies the supplied canonical surface and exact analysis status into the current projection, reusing compatible buffers or transferring a completed replacement geometry before predecessor retirement.
   * @evidence contracts/common.md#clear-and-simple-design One update boundary keeps displayed geometry and its outcome metadata together without running a viewer-side solver.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Closed or failed owners refuse additional mutation and a status default cannot fabricate a solved frame; callers must not publish a failed update as successful and native same-frame upload is not proven by CPU writes.
   * @evidence contracts/common.md#meaningful-documentation Documents required surface/status, compatible representation reuse, changed geometry transfer and retained retirement failure.
   * @evidence contracts/performance.md#efficient-algorithms Update costs O(V+I) canonical copies; same-size vertex wrappers/arrays are retained and SDK index preparation owns actual width choice, while changed representation needs fresh attributes.
   * @evidence contracts/performance.md#reuse-equivalent-work Only matching component representation/count and index width/count reuse storage; every provided changed value/status is applied rather than memoized by domain name.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A failed predecessor remains owned with its cause and blocks another update; current geometry still has an independent close attempt and no external resource manager is introduced.
   */
  update: (props: {
    surface: IAutoMovieSoftBodySurface;
    status: AutoMovieSoftAnalysisStatus;
  }) => void;

  /**
   * Release the geometry, and the material when this object created it.
   *
   * @evidence contracts/common.md#principled-implementation Marks the projection closed and independently attempts the current geometry, any sticky failed predecessor and only its owned default material.
   * @evidence contracts/common.md#clear-and-simple-design One sticky terminal close owns resource fan-out while caller scene withdrawal and borrowed material disposal remain external.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Repeat/reentry does not retry uncertain public disposal or report success after failure; public events are not independent native GPU/kernel release proof.
   * @evidence contracts/common.md#meaningful-documentation Documents geometry/default-material ownership, borrowed-material exemption, terminal update refusal and original failure retention.
   * @evidence contracts/performance.md#efficient-algorithms At most two geometry attempts and one default-material attempt are fixed fan-out, delegating native release work and occurring only once through this handle.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated close represents the same owned lifetime and shares its original result rather than reacquiring or redisposing the resources.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Closed state prevents new update effects, independent owners still receive their attempt and failed cause/owner references remain until the handle is unreachable; caller removes the borrowed mesh from further draws.
   */
  dispose: () => void;
}
