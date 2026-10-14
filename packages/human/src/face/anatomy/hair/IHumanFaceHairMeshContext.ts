import type {
  IAutoMovieMeshQueryBudget,
  IAutoMovieMeshSeparationAttachment,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";

import type { IHumanFaceHairContactCurve } from "./IHumanFaceHairContactCurve";
import type { IHumanFaceHairSeparationReaders } from "./IHumanFaceHairSeparationReaders";

/**
 * Per-layer inputs `buildHumanFaceHairMesh` needs beside its curves.
 *
 * `budgets` and `attachments` align one entry per curve, and each budget continues that curve's lock work in place. Ribbon construction also requires aligned density widths and the signed query; the terminal-shaft branch uses the layer's diameter and paired separation readers instead. The representation owner publishes actual station/vertex membership through observeContactCurve so assembly need not guess it from buffer order.
 *
 * @evidence contracts/common.md#principled-implementation Per-curve widths, budgets and canonical attachments align with actual curves while same-host separation readers certify the emitted representation.
 * @evidence contracts/common.md#clear-and-simple-design The mesher receives numerical context and publishes geometry-owned station membership, leaving assembly free from guessed ring/ribbon correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual representation membership is emitted by its owner; the input defines no fixture-specific vertex pairing or independent root seat.
 * @evidence contracts/common.md#meaningful-documentation The comment documents curve alignment, metre widths, in-place shared budgets, canonical seats and observer timing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This per-layer argument does no station simplification or cell certification; buildHumanFaceHairMesh owns those curve/station traversals.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Query and separation readers are shared across the layer, while each curve continues its own lock budget and attachment provenance.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Observer callbacks are caller-owned references; the context starts no watcher or task and retains no callback history.
 *
 * @author Samchon
 */
export interface IHumanFaceHairMeshContext {
  /** Nominal density-derived ribbon width per curve, in metres; the explicit terminal-shaft branch takes its physical diameter from the layer instead. */
  widths: readonly number[];

  /** Signed closed-collider query of the host skin. */
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;

  /** Source and represented separation readers of the host skin. */
  separation: IHumanFaceHairSeparationReaders;

  /** Each curve's shared lock budget, spent in place. */
  budgets: readonly IAutoMovieMeshQueryBudget[];

  /** Each curve's canonical root seat on the host skin. */
  attachments: readonly IAutoMovieMeshSeparationAttachment[];

  /**
   * Reports a completed curve buffer in its actual representation; whole-mesh validation remains downstream.
   *
   * @evidence contracts/common.md#principled-implementation The ordinal callback reports completion of one actual curve buffer while whole-mesh validation remains a later responsibility.
   * @evidence contracts/common.md#clear-and-simple-design One optional synchronous notification keeps progress consumption outside the numerical mesher without exposing mutable mesh buffers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress is not a clearance certificate or a special path that skips validation for an observed curve.
   * @evidence contracts/common.md#meaningful-documentation The member states actual-representation buffer completion and explicitly reserves whole-mesh validation for downstream admission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type implements no progress aggregation algorithm; the mesher emits once per completed curve and the caller owns observer cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Progress notifications are ordered effects for actual emitted curves, so equal ordinals from separate builds are not interchangeable cached results.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The context borrows this callback and starts no watcher; a thrown observer error propagates synchronously to its build caller.
   */
  progress?: (ordinal: number) => void;

  /**
   * Publish actual per-curve emitted vertex membership after its source and Float32 contact checks. Ribbon whole-mesh triangle validation still follows these notifications; callback return is not final build admission.
   *
   * @evidence contracts/common.md#principled-implementation The geometry emitter publishes certified per-curve vertex membership and its canonical attachment so assembly consumes actual representation facts.
   * @evidence contracts/common.md#clear-and-simple-design A single optional observer transfers contact layout metadata without requiring assembly to derive rings from ribbon vertex ordering.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The published layout is produced by emitted geometry, with no fixture address table or independently guessed root registration.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies emitted vertex membership and per-curve contact-check timing while reserving ribbon whole-mesh validation for later; a callback can run before a build subsequently refuses.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This notification signature chooses no layout-copy strategy; the emitter constructs membership while the consuming observer owns any retained copy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each callback corresponds to one emitted curve effect and is not coalesced merely because two curves have equal station counts.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The receiving observer decides whether to retain the layout; the callback declaration acquires no resource or background subscription.
   */
  observeContactCurve?: (curve: IHumanFaceHairContactCurve) => void;
}
