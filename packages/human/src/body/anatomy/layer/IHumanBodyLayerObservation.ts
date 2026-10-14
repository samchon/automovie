import type { IAutoMovieHumanBodyNativeSubcutaneousQualification } from "../../export/IAutoMovieHumanBodyNativeSubcutaneousQualification";
import type { IHumanBodyLayerSurfaces } from "./IHumanBodyLayerSurfaces";

/**
 * Native layer observations of one evaluated skin, separate from face admission. Counts and native ordinals survive root placement; geometry lives in the actual model parts rather than a second unplaced coordinate record.
 *
 * @evidence contracts/common.md#principled-implementation Normal/dermal/fascial coordinate arrays are omitted from inherited observations while native counts/ordinals and optional SAT provenance accompany actual model geometry.
 * @evidence contracts/common.md#clear-and-simple-design A report stores original observation qualification and shell identities without duplicating unplaced coordinate records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts/ordinals survive placement and remain separate from face admission or global embedding certificates.
 * @evidence contracts/common.md#meaningful-documentation Members state exact basis/surface, native populations, field qualification and actual shell/native-owner provenance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Observation schemas report outcomes without recomputing normals or layer offsets.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Placement-stable ordinals describe output provenance without repeated observation caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Metadata retains no duplicate layer coordinate arrays or active inspection task.
 * @author Samchon
 */
export interface IHumanBodyLayerObservation extends Omit<
  IHumanBodyLayerSurfaces,
  "normals" | "dermis" | "fascia"
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
