import type { AutoMovieHumanBodyPartId } from "../anatomy/identity/AutoMovieHumanBodyPartId";
import type { IHumanBodyUnderwearFittingProposal } from "../basis/IHumanBodyUnderwearFittingProposal";
import type { IHumanBodyUnderwearFitObservation } from "../basis/IHumanBodyUnderwearFitObservation";

/**
 * A completed body construction boundary, never a timer or acceptance verdict.
 *
 * Constructor events have no document; evaluation events name the admitted
 * document. Parts and quantity paths identify completed source work. The
 * observer runs synchronously and an exception aborts the original call.
 * Garment records identify actual component, envelope, initial-evaluation and
 * affine/native completion boundaries. Their scalar packets do not publish
 * native buffers, certify feasibility or advance a timed heartbeat.
 * Candidate substage records carry the actual work/native-call context; face
 * reporting is batched at powers of two and the final processed count, without
 * sampling or skipping any geometric validation.
 *
 * @evidence contracts/common.md#principled-implementation Each event identifies work that actually completed at the body or source owner.
 * @evidence contracts/common.md#clear-and-simple-design One optional synchronous observer carries constructor and evaluation boundaries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No timer or synthetic heartbeat stands in for completed work.
 * @evidence contracts/common.md#meaningful-documentation States document omission, actual source work and observer failure propagation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Source part identities are reported rather than defined.
 * @evidenceExclude contracts/modeling.md#parameter-channels Progress changes no authored input.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Fitting observations retain their owner's units; progress defines no spatial convention.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Existing construction owners define boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation Progress establishes no appearance verdict.
 * @evidenceExclude contracts/anatomy.md#anatomical-source No anatomical value is added.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission and source solvers retain their guards.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Progress adds no personal control.
 *
 * @author Samchon
 */
export interface IHumanBodyConstructionProgress {
  /** Actual immutable body basis being evaluated. */
  basis: string;

  /** Admitted document identity; absent during constructor work. */
  document?: string;

  /** Construction boundary that has completed. */
  stage:
    | "basis-schema-admitted"
    | "basis-copied"
    | "basis-admitted"
    | "document-admitted"
    | "shape-evaluated"
    | "pose-evaluated"
    | "skin-evaluated"
    | "garment-evaluated"
    | "garment-component-read"
    | "garment-envelope-evaluated"
    | "garment-initial-evaluated"
    | "garment-affine-program-assembled"
    | "garment-native-round-completed"
    | "garment-candidate-normals-evaluated"
    | "garment-candidate-vertices-evaluated"
    | "garment-candidate-faces-evaluated"
    | "garment-candidate-evaluated"
    | "garment-proposal-evaluated"
    | "source-quantity-read"
    | "source-part-completed"
    | "assembly-evaluated"
    | "model-validated";

  /** Actual source part whose work completed. */
  part?: AutoMovieHumanBodyPartId;

  /** Actual anatomical quantity path consumed. */
  path?: string;

  /** Completed source parts, candidate vertices, or processed candidate faces as named by the stage; not an acceptance count. */
  completed?: number;

  /** Actual source-part, candidate-vertex or candidate-face population associated with this stage. */
  total?: number;

  /**
   * Owned numerical observations from the completed garment evaluation.
   * Each observation retains its declared units and native solver status;
   * this transport supplies no appearance or anatomical acceptance verdict.
   */
  garmentFitting?: readonly IHumanBodyUnderwearFitObservation[];

  /** Actual native surface whose cut material supplies this component. */
  garmentSurface?: string;

  /** Zero-based connected component in that cut surface's original indexed order. */
  garmentComponent?: number;

  /** Existing objective phase of the affine program or completed native call. */
  garmentPhase?: IHumanBodyUnderwearFitObservation["phase"];

  /** Zero-based native call ordinal; candidate stages associate the last completed native call, absent before any call. */
  garmentRound?: number;

  /** Actual common native-call and candidate-evaluation work already spent. */
  garmentWorkUsed?: number;

  /** Original material-sized shared work limit; progress never resets it. */
  garmentWorkBound?: number;

  /** Actual scalar-variable population of this assembled program. */
  garmentVariables?: number;

  /** Actual original affine interval-row population before native cone conversion. */
  garmentRows?: number;

  /** Stored affine coefficient entries, including original exact zeros. */
  garmentEntries?: number;

  /** Smallest represented nonzero absolute affine coefficient; null when no such coefficient exists. */
  garmentMinimumNonzeroCoefficient?: number | null;

  /** Largest represented absolute affine coefficient; this is not a condition number. */
  garmentMaximumCoefficient?: number;

  /** Actual original field excess at the named completed candidate-evaluation boundary, in metres. */
  garmentFieldResidualMetres?: number;

  /** Raw located local failures accumulated through the named candidate boundary, including repeated witnesses; not an acceptance count. */
  garmentGeometryFailures?: number;

  /** Actual completed proximal proposal comparison, excluding raw coordinate buffers. */
  garmentProposal?: Omit<IHumanBodyUnderwearFittingProposal, "base" | "normalizedCoordinates">;

  /** Existing native and nonlinear scalar readings; full native buffers remain in final fitting or failure. */
  garmentFittingRound?: Pick<
    IHumanBodyUnderwearFitObservation,
    "round" | "phase" | "status" | "nativeIterations" |
    "nativeMaximumViolation" | "nativeStationarityResidual" |
    "fieldResidualMetres" | "normalizedViolationSum" | "elasticSlackSum" |
    "edgeObjective" | "proximalCoefficient"
  >;
}
