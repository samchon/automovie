import type { IHumanBodyLayerSurfaces } from "./IHumanBodyLayerSurfaces";
import type { IAutoMovieHumanBodyNativeSubcutaneousQualification } from "../../export/IAutoMovieHumanBodyNativeSubcutaneousQualification";

/**
 * Native layer observations of one evaluated skin, separate from face admission.
 * Counts and native ordinals survive root placement; geometry lives in the
 * actual model parts rather than a second unplaced coordinate record.
 *
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
