import type {
  IAutoMovieMeshQueryBudget,
  createAutoMovieMeshRayCaster,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";
import type { IAutoMovieHumanFaceHairRootedTransition } from "./IAutoMovieHumanFaceHairRootedTransition";
import type { IHumanFaceHairMetric } from "./IHumanFaceHairMetric";
import type { IHumanFaceHairRootSupport } from "./IHumanFaceHairRootSupport";

/**
 * One root's inputs to `integrateHumanFaceHairCurve`, also read by `createHumanFaceHairCurveStart`.
 *
 * Positions are head-frame metres. `origin` and `reference` are neutral chart positions that select regional length; `root` and `normal` are the current seated root and host shading normal. Query, ray index and root support share the current closed collider. Rooted walking and later meshing spend the same lock budget in place; the current curved-stem walk does not call the standalone numerical launch helper.
 *
 * @evidence contracts/common.md#principled-implementation Neutral chart inputs select regional length while current seated root, normal and all host readers share one posed closed-collider snapshot.
 * @evidence contracts/common.md#clear-and-simple-design A per-root context keeps shared budget, optional interpolated metric and hierarchy placement beside the one integrator that owns walking.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional metric denotes an already derived strand target; placement can reject without restarting the canonical rooted transition or query budget.
 * @evidence contracts/common.md#meaningful-documentation The prose explains neutral/current frames, metre coordinates, root sequence, budget mutation, optional metric and gathered anchor/direction pairing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This integration-input type implements no station loop; integrateHumanFaceHairCurve owns work bounded by requested length and remaining budget.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type implements no coordination; its caller supplies readers and a budget shared by rooted walking and later meshing, and one completed stem can be offered to hierarchy placement.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The lock caller owns its remaining budget and current host readers, with no independently acquired task in this argument record.
 *
 * @author Samchon
 */
export interface IHumanFaceHairIntegration {
  /** Admitted hairstyle layer the lock belongs to. */
  layer: IAutoMovieHumanFaceHair.Layer;

  /** Neutral chart origin of the layer's domain. */
  origin: IAutoMovieVector3;

  /** The root's neutral chart position. */
  reference: IAutoMovieVector3;

  /** Current seated root position. */
  root: IAutoMovieVector3;

  /** Current skin host's outward unit shading normal at the seated root, including its triangle-plane fallback. */
  normal: IAutoMovieVector3;

  /** The root's sample identity, seeding its length variation and gathering. */
  sequence: number;

  /** Signed closed-collider query of the host skin. */
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;

  /** Ray index over the same current closed collider as query. */
  raycaster: Pick<
    ReturnType<typeof createAutoMovieMeshRayCaster>,
    "nearestHit"
  >;

  /** Original sampler support and triangle proximity on that collider. */
  rootBoundary: IHumanFaceHairRootSupport;

  /** Caller-owned remaining lock work, shared by rooted walking and later mesh checks without replenishment. */
  budget: IAutoMovieMeshQueryBudget;

  /** Derived post-interpolation metric/contact, when different from regional length. */
  metric?: IHumanFaceHairMetric;

  /**
   * Admit a hierarchy remainder once the canonical stem reaches free clearance. Undefined rejects the placement and continues the same metric walk.
   *
   * @evidence contracts/common.md#principled-implementation Placement receives only a completed full-clearance stem and can return undefined so integration continues with the same spent metric and budget.
   * @evidence contracts/common.md#clear-and-simple-design The optional hierarchy seam separates guide interpolation from canonical rooted emergence instead of adding a second root walker.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A rejected placement is not replaced by a restarted stem; the existing integration state continues and gathered hair refuses hierarchy placement upstream.
   * @evidence contracts/common.md#meaningful-documentation The member comment identifies the canonical-stem readiness condition and the hierarchy-remainder admission role; undefined is documented as a rejected proposal.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback signature chooses no hierarchy interpolation algorithm; the supplying guide placer owns its candidate and clearance work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The already integrated stem is reused only within the same lock; rejection returns control to that lock's existing state.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The placement callback is caller-owned and starts no detached task; a successful curve's arrays are transferred through its return value.
   */
  place?: (
    stem: IAutoMovieHumanFaceHairRootedTransition,
  ) => IAutoMovieHumanFaceHairCurve | undefined;

  /** Gather anchor point on the skin, present only for a gathered layer. */
  gatherAnchor?: IAutoMovieVector3;

  /**
   * Current scalp tangent field, present together with `gatherAnchor`. An undefined direction propagates the graph resolver's refusal.
   *
   * @evidence contracts/common.md#principled-implementation The supplied field follows the current scalp toward the paired gather anchor, preserving host correspondence for a directly integrated gathered lock.
   * @evidence contracts/common.md#clear-and-simple-design Gather graph compilation stays outside per-root integration while the callback gives the walker only its required local direction seam.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A gathered layer requires both anchor and direction through the stage's admission; omission does not invent a path through the head.
   * @evidence contracts/common.md#meaningful-documentation The member documents presence together with gatherAnchor and identifies the field as a current scalp tangent with propagated undefined-direction refusal.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This optional field declaration selects no graph-query implementation; createHumanFaceHairGatherField owns the compiled tangent lookup.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same compiled field can serve roots on its current scalp and tie, but the integration signature defines no cross-pose equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The integration caller owns the supplied graph closure and releases it with the evaluated hair build; no new observer task is acquired here.
   */
  gatherDirection?: (point: IAutoMovieVector3) => IAutoMovieVector3;
}
