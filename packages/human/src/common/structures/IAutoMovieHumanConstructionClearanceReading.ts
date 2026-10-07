import type { IAutoMovieHumanConstructionCrossingWitness } from "./IAutoMovieHumanConstructionCrossingWitness";

/**
 * One measured spatial relation between a constructed part and the surface it
 * must stay beside. A construction admission carries the whole population of
 * these readings, including relations that passed, so a refusal names a
 * quantity and a consumer can see every neighbour of the one that failed.
 *
 * Signed distances are metres on the Float32 coordinates the model emits.
 * Negative values lie inside a closed exterior, or behind an oriented open
 * sheet; positive values lie outside. The reading states the instrument's
 * result and no anatomical judgment: `judged` says whether an existing
 * admission condition reads this relation, and only a judged relation can be
 * `refused`.
 *
 * @evidence contracts/common.md#principled-implementation The record keeps the exact counts and extrema an admission condition compared, so the verdict is a function of the reported numbers.
 * @evidence contracts/common.md#clear-and-simple-design One flat record per subject and reference surface; judged and report-only relations share it and differ by one flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A report-only relation can never refuse, and a judged relation keeps its original tolerance in the record.
 * @evidence contracts/common.md#meaningful-documentation States sign convention, units, coordinate precision and the difference between judged and observed relations.
 * @evidence contracts/modeling.md#spatial-conventions Distances are metres in the owning model's frame, read on Float32 coordinates.
 * @evidence contracts/modeling.md#rendered-observation A numerical reading of constructed geometry; it does not replace the rendered observation its part owner owes.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Names existing part identities without defining one.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Reports a boundary's measured state; the part owners construct it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A geometric reading supplies no biological value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The admission owner that produced the reading owns its bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
 */
export interface IAutoMovieHumanConstructionClearanceReading {
  /** Admission owner that measured the relation. */
  owner: string;

  /** Geometry state the relation was read in. */
  state: "rest" | "performed";

  /** Measured part or named point population. */
  subject: string;

  /** Surface the subject was measured against. */
  against: string;

  /** True when an existing admission condition decides on this relation. */
  judged: boolean;

  /** True when that condition refuses; always false for an unjudged relation. */
  refused: boolean;

  /** Tolerance in metres the counts below were taken with. */
  toleranceMetres: number;

  /** Subject vertices that were queried. */
  vertices: number;

  /** Queried vertices whose signed distance is below minus the tolerance. */
  insideVertices: number;

  /** Queried vertices whose signed distance is above the tolerance. */
  outsideVertices: number;

  /** Queried vertices whose nearest feature is the rim of an open reference, so their side is unknown. */
  boundaryVertices: number;

  /** Queried vertices farther from an open reference than its stated reach, where a sheet reads no side; omitted when the relation states no reach. They enter no count and no extremum. */
  unreachedVertices?: number;

  /** Smallest signed distance among vertices with a known side, or null when none has one. */
  minimumSignedMetres: number | null;

  /** Largest signed distance among vertices with a known side, or null when none has one. */
  maximumSignedMetres: number | null;

  /** Subject vertex index of the minimum, or null. */
  worstVertex: number | null;

  /** Coordinates of that vertex in metres, or null. */
  worstPoint: number[] | null;

  /** Subject vertex index of the maximum, the outermost vertex; omitted when the owner does not track it. */
  outermostVertex?: number | null;

  /** Coordinates of the outermost vertex in metres; omitted with its index. */
  outermostPoint?: number[] | null;

  /** Median signed distance over vertices with a known side; omitted when the owner reports no distribution. */
  medianSignedMetres?: number | null;

  /** 95th percentile of the signed distance (nearest-rank) over vertices with a known side; omitted with the median. */
  percentile95SignedMetres?: number | null;

  /** Non-coplanar triangle crossings with the reference, or null when the relation reads vertices only. */
  crossings: number | null;

  /** First non-coplanar crossing the instrument found, or null when there is none; omitted when the owner does not locate crossings. */
  crossingWitness?: IAutoMovieHumanConstructionCrossingWitness | null;

  /** Reason the instrument could not read the relation, or null when it did. */
  unavailable: string | null;
}
