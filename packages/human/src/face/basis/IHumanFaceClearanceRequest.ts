import type { IAutoMovieMeshCrossingOptions } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieTransform } from "@automovie/interface";

/**
 * One relation handed to the face clearance instrument: a subject mesh, the
 * reference surface it is read against and the identities the reading keeps.
 * Coordinates are local metres at source precision; an omitted TRS denotes
 * the head-frame identity. The instrument
 * rounds both local meshes to Float32 and applies their actual publication TRS before it reads them in the common head frame.
 *
 * @evidence contracts/common.md#principled-implementation Actual subject/exterior publication meshes, signed boundary mode and optional witness selection define the instrument's rounded vertex and triangle census in common head-frame metres.
 * @evidence contracts/common.md#clear-and-simple-design Identity/state/admission meaning travel with geometry and publication transforms; measurement and refusal policy remain in measureHumanFaceClearance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Open-sheet reach and immutable exterior reuse require caller grounds; judged false is report-only, and excluding one intended transverse point leaves all other witnesses in scope.
 * @evidence contracts/common.md#meaningful-documentation Members state units, default TRS/forbidden side, vertex/triangle selection, null crossing omission and local-sign uncertainty beyond rims/reach.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This request performs no traversal; native query/crossing and population sorting costs belong to the instrument.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; the instrument keys immutable references by object, transform and boundary mode.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; request/callback lifetimes remain with their owning admission and reference instrument.
 *
 * @author Samchon
 */
export interface IHumanFaceClearanceRequest {
  /** Admission owner asking for the relation. */
  owner: string;

  /** Geometry state both meshes belong to. */
  state: "rest" | "performed";

  /** Identity reported for the subject. */
  subject: string;

  /** Identity reported for the reference surface. */
  against: string;

  /** True when an existing admission condition decides on this relation. */
  judged: boolean;

  /** Measured geometry. */
  mesh: IAutoMovieMesh;

  /** Actual publication TRS applied after rounding the subject's local positions. Omission retains head-frame identity. */
  meshTransform?: IAutoMovieTransform | null;

  /** Reference surface the subject is read against. */
  exterior: IAutoMovieMesh;

  /** Actual reference publication TRS, applied after its local Float32 conversion. */
  exteriorTransform?: IAutoMovieTransform | null;

  /** `closed` for a watertight exterior; `open` for an oriented sheet whose rim has no side. */
  boundary: "closed" | "open";

  /** Side of the reference a judged subject must not be on. `inside` (the default) refuses vertices behind the reference; `outside` refuses vertices in front of it, for a part that must stay beneath a covering surface. */
  forbidden?: "inside" | "outside";

  /** Tolerance in metres for the inside and outside counts. */
  toleranceMetres: number;

  /** Distance in metres within which an open reference tells its two sides apart. A vertex farther away is reported as unreached and read no side. Omitted for a closed reference, whose sign holds at any distance. */
  reachMetres?: number;

  /** Subject vertices to query; omitted reads every vertex an index references. */
  vertices?: readonly number[];

  /** Subject triangles to test for crossings; omitted tests all, and `null` reads vertices only. */
  crossingIndices?: readonly number[] | null;

  /** Optional classification of each strict transverse witness on the rounded meshes. Returning false excludes only that point, not its triangle or other witnesses. */
  acceptTransversePoint?: IAutoMovieMeshCrossingOptions["acceptTransversePoint"];
}
