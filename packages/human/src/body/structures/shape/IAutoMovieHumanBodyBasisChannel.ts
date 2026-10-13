/**
 * One dimensionless authored deformation control in an ordered body basis.
 *
 * `humanBodyBasisWeights` resolves a document weight to the named positive or
 * negative endpoint; `evaluateHumanBodyShape` applies its rows wherever that
 * endpoint exists on the connected skin or joint landmarks. A missing row set
 * means that population does not move. The endpoint is measured displacement
 * data in the basis frame, not a claim that a muscle or bone has this shape.
 * The basis publisher owns its source provenance and revision identity.
 *
 * The basis owns order, sign, range and explicit left/right mirror identity.
 * A channel value cannot establish physiological validity or skin contact;
 * those require the posed rig and shared surface to be checked together.
 *
 * @evidence contracts/common.md#principled-implementation Signed dimensionless channel weights select named endpoint rows on shared skin and landmarks; zero lies within the admitted envelope.
 * @evidence contracts/common.md#clear-and-simple-design Ordered channel identity and explicit mirror binding keep trait naming separate from displacement rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source displacement data does not certify muscle, bone, physiological motion or contact validity.
 * @evidence contracts/common.md#meaningful-documentation Members give sign, range, missing-endpoint meaning and explicit left-right mirror ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The basis deformation channel has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The basis deformation channel schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis deformation channel declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisChannel {
  /** Trait name unique within this basis, e.g. `torsoScaleVert` or `upperarmFatLeft`. */
  id: string;

  /** Named body shape edit; a pose is not a channel. */
  kind: "shape";

  /** Source region or `macro`, for grouping in an editor; not evaluated. */
  group: string;

  /**
   * The channel this one mirrors across X, or null for a midline control.
   * Left and right are explicit data so a consumer never infers a pair from
   * a name, and so the extraction can prove each right endpoint is the mirror
   * of its left and record the residual.
   */
  mirror: string | null;

  /** Finite dimensionless envelope including zero; refuse values outside it. */
  minimum: number;

  /** Positive end of the same dimensionless envelope. */
  maximum: number;

  /** Endpoint applied with abs(weight) on the positive side. */
  positive: string;

  /** Negative-side endpoint, or null for a nonnegative control. */
  negative: string | null;
}
