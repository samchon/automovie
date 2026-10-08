import type { IHumanBodyLayerSurfaces } from "./IHumanBodyLayerSurfaces";
import type { IAutoMovieHumanBodyNativeSubcutaneousQualification } from "../../export/IAutoMovieHumanBodyNativeSubcutaneousQualification";

/**
 * Native layer observations of one evaluated skin, separate from face admission.
 * Counts and native ordinals survive root placement; geometry lives in the
 * actual model parts rather than a second unplaced coordinate record.
 *
 * @evidence contracts/common.md#principled-implementation Retains the existing offset owner's limited observations and original native addresses.
 * @evidence contracts/common.md#clear-and-simple-design Omits only geometry buffers already owned by emitted model parts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown reach and inverted offsets remain original observations.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes native addresses, geometric qualification and face admission.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries observations of parts defined by the layer constructor.
 * @evidenceExclude contracts/modeling.md#parameter-channels Contains no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Native ordinals address the named basis surface; counts are dimensionless.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The construction owner supplies shared sheets.
 * @evidenceExclude contracts/modeling.md#rendered-observation Body and person consumers observe the corresponding model parts.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The field owns its measured and authored values.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing surface owner measures the limited offset conditions.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This output supplies no personal sculpt input.
 * @author Samchon
 */
export interface IHumanBodyLayerObservation extends Omit<
  IHumanBodyLayerSurfaces, "normals" | "dermis" | "fascia"
> {
  /** Exact source basis whose native thickness arrays were consumed. */
  basis: string;

  /** Native skin surface addressed by this observation. */
  surface: string;

  /** Native skin vertices on which every observation was requested. */
  nativeVertices: number;

  /** Native skin triangles on which both orientations were read. */
  nativeTriangles: number;

  /** Field owner's original measured/authored and population qualification. */
  fieldQualification: string;

  /** Disjoint outer, inner and nonempty rim members composing the actual subcutaneous shell. */
  subcutaneousShellParts: readonly string[];

  /** Single native SAT provenance and actual members, separate from static atlas sources. */
  nativeSubcutaneous?: IAutoMovieHumanBodyNativeSubcutaneousQualification;
}
