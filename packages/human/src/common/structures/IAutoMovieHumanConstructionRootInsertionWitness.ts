/**
 * The actual sphere classification of one reported free-shaft intersection.
 * The crossing owner retains the strict intersection point and the root-ring
 * values that its existing predicate compared. These geometric observations
 * explain that predicate; they define no new insertion allowance or clinical
 * follicle dimension. Coordinates and distances are model metres, read from
 * the same locally Float32-published meshes reconstructed through ordinary
 * part TRS as the owning crossing witness.
 *
 *
 * @evidence contracts/common.md#principled-implementation The retained strict crossing point, shaft ordinal, actual root-ring mean and radius reproduce the existing insertion-sphere comparison.
 * @evidence contracts/common.md#clear-and-simple-design Point-to-root distance and represented root radius remain separate observations beside the owning crossing witness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record grants no larger insertion region or clinical follicle dimension and retains the same published mesh observations.
 * @evidence contracts/common.md#meaningful-documentation The prose explains model-metre reconstruction and each field names the actual point, ring statistic or compared distance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Root-sphere predicate witness shape is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Root-sphere predicate witness shape specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Root-sphere predicate witness shape acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanConstructionRootInsertionWitness {
  /** Strict transverse point that the original predicate counted as free. */
  point: number[];

  /** Shaft ordinal whose root supplied the insertion test. */
  shaft: number;

  /** Mean of that shaft's actual represented root ring. */
  centre: number[];

  /** Maximum actual root-ring distance from its centre, metres. */
  radiusMetres: number;

  /** Point-to-root distance compared with that radius, metres. */
  distanceMetres: number;
}
