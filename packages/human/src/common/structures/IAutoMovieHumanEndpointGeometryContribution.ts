/**
 * Actual external geometry and its nonzero endpoint displacement rows.
 * Arrays remain source-owned metre data, not a permission or fitted target.
 *
 * @evidence contracts/common.md#principled-implementation Actual source XYZ positions define the resident index domain of strictly increasing nonzero endpoint displacement quadruples.
 * @evidence contracts/common.md#clear-and-simple-design The source member identity, geometry and sparse rows stay together for humanBodyExternalEndpointContributions admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An endpoint name alone cannot establish residency: the body owner checks finite source geometry and admitted nonzero sparse rows.
 * @evidence contracts/common.md#meaningful-documentation Members state source ownership, metre units, row ordering and the index/dx/dy/dz quadruple layout.
 * @evidenceExclude contracts/performance.md#efficient-algorithms External endpoint displacement schema is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work External endpoint displacement schema specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources External endpoint displacement schema acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 *
 * @author Samchon
 */
export interface IAutoMovieHumanEndpointGeometryContribution {
  /** Actual source member identity. */
  id: string;

  /** Flat source XYZ metres, used to admit resident row indices. */
  positions: number[];

  /** Strictly increasing nonzero [index, dx, dy, dz] quadruples. */
  rows: number[];
}
