import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * The evaluated exterior against which a body's inward rays are observed.
 *
 * The mesh may include the head that continues an open body collar. Each
 * native body vertex names its actual vertex in this mesh. This identity,
 * rather than a positional exclusion radius, determines incident triangles.
 * All positions retain the body's evaluated metre frame. Providing this
 * reference does not establish embedding, anatomical thickness or coverage.
 *
 * @author Samchon
 */
export interface IHumanBodyLayerExterior {
  /** Evaluated exterior triangles, including any actual continuing sheets. */
  mesh: IAutoMovieMesh;

  /** One resident exterior vertex index for each native body vertex. */
  originVertices: readonly number[];
}
