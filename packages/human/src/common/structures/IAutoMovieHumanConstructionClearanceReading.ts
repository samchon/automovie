import type { IAutoMovieHumanConstructionCrossingWitness } from "./IAutoMovieHumanConstructionCrossingWitness";

/**
 * One measured spatial relation between a constructed part and the surface it
 * must stay beside. A construction admission carries the whole population of
 * these readings, including relations that passed, so a refusal names a
 * quantity and a consumer can see every neighbour of the one that failed.
 *
 * Signed distances are model-frame metres reconstructed from local Float32
 * mesh publication through the part's ordinary TRS, without a second rounding.
 * Negative values lie inside a closed exterior, or behind an oriented open
 * sheet; positive values lie outside. The reading states the instrument's
 * result and no anatomical judgment: `judged` says whether an existing
 * admission condition reads this relation, and only a judged relation can be
 * `refused`.
 *
 * @evidence contracts/common.md#principled-implementation Counts and signed-distance extrema describe the same queried Float32-published local mesh reconstructed through ordinary part TRS into model metres.
 * @evidence contracts/common.md#clear-and-simple-design Owner, geometry state and subject/reference identities accompany judgement, reach exclusions, distributions and optional crossing witnesses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown open rims and unavailable measurements remain explicit; an unjudged relation cannot become refused or claim anatomical validity.
 * @evidence contracts/common.md#meaningful-documentation Field prose distinguishes known-side extrema, unreached vertices, nearest-rank distributions and optional witness populations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Measured clearance result schema is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Measured clearance result schema specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Measured clearance result schema acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 *
 * @author Samchon
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

  /** Retained transverse crossing witnesses, at most one per subject triangle with the default instrument; null when the relation reads vertices only. */
  crossings: number | null;

  /** First non-coplanar crossing the instrument found, or null when there is none; omitted when the owner does not locate crossings. */
  crossingWitness?: IAutoMovieHumanConstructionCrossingWitness | null;

  /** Reason the instrument could not read the relation, or null when it did. */
  unavailable: string | null;
}
