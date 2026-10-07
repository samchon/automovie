import type {
  IAutoMovieMeshGeometry,
  IAutoMovieModelPart,
} from "@automovie/interface";

/**
 * One static native face region with its registered material and mesh.
 * The resident gatherer creates this part without changing its source identity.
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
