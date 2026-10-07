/**
 * The fixed numbering that gathers shared surface vertices into one material
 * region's render vertices. A source/UV chart pair owns each resident, so UV
 * seams duplicate residents without duplicating the physical source answer.
 * Arrays are owned by the compiled correspondence and contain no pose values.
 *
 * @evidence contracts/common.md#principled-implementation Parallel source and UV arrays retain the shared-vertex/chart pairing that defines resident numbering.
 * @evidence contracts/common.md#clear-and-simple-design Source indices, triangle indices and UVs carry one region's correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The numbering is compiled from region corners, not rediscovered from rendered positions.
 * @evidence contracts/common.md#meaningful-documentation States index spaces, chart splitting, pose independence and ownership.
 * @evidence contracts/modeling.md#spatial-conventions Sources address shared surface vertices, indices address residents, and UVs are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Correspondence transports one existing region, not a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Correspondence defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The region already determines the emitted triangles.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Correspondence defines no geometric boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The region's owner observes the displayed result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Indices and UVs add no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Correspondence admits no biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Correspondence adds no person input.
 * @author Samchon
 */
export interface IHumanBasisRegionCorners {
  /** Shared surface vertex copied by each resident render vertex. */
  sources: number[];

  /** Region triangles in resident render-vertex index space. */
  indices: number[];

  /** Two UV components per resident vertex, or null for an untextured region. */
  uvs: number[] | null;
}
