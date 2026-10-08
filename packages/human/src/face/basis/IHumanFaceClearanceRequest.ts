import type { IAutoMovieMeshCrossingOptions } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieTransform } from "@automovie/interface";

/**
 * One relation handed to the face clearance instrument: a subject mesh, the
 * reference surface it is read against and the identities the reading keeps.
 * Coordinates are local metres at source precision; an omitted TRS denotes
 * the head-frame identity. The instrument
 * rounds both local meshes to Float32 and applies their actual publication TRS before it reads them in the common head frame.
 *
 * @evidence contracts/common.md#principled-implementation Names every input the reading depends on, so two owners asking the same relation obtain the same record.
 * @evidence contracts/common.md#clear-and-simple-design One request record replaces per-owner copies of the same query set-up.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries the caller's tolerance unchanged and no override for a part or a side.
 * @evidence contracts/common.md#meaningful-documentation States frame, precision and the meaning of each optional restriction.
 * @evidence contracts/modeling.md#spatial-conventions Local metre meshes plus optional publication TRS; the instrument owns Float32 conversion and head-frame reconstruction.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Names existing parts without defining one.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Describes a relation to measure; the part owners construct the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Transport to a numerical instrument.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries geometry and identities only.
 * @evidenceExclude contracts/anatomy.md#permitted-range The requesting owner owns its bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
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
