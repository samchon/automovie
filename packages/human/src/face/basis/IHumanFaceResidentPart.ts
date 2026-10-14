import type {
  IAutoMovieMeshGeometry,
  IAutoMovieModelPart,
} from "@automovie/interface";

/**
 * One static native face region with its registered material and mesh.
 * The resident gatherer creates this part without changing its source identity.
 *
 * @evidence contracts/common.md#principled-implementation createHumanFaceResidentParts gathers retained native incidence with the source region's actual finish and canonical physical-source order.
 * @evidence contracts/common.md#clear-and-simple-design Native regions always provide material/mesh while inherited ordinary part fields preserve model identity and null transform conventions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generated replacement owners remove only enrolled incidence; coordinates never invent source correspondence or certify complete anatomical ownership.
 * @evidence contracts/common.md#meaningful-documentation Members identify resident source finish and gathered static mesh; prose preserves source identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result gathers nothing; the region producer owns native/UV-split buffer costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; the gatherer reuses compiled unchanged region readers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; emitted part buffers belong to the current model.
 *
 * @author Samchon
 */
export interface IHumanFaceResidentPart extends Omit<
  IAutoMovieModelPart,
  "geometry" | "material"
> {
  /** Actual source material identity; native regions always name a finish. */
  material: string;

  /** Static mesh gathered from the retained native region. */
  geometry: IAutoMovieMeshGeometry;
}
