import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * The evaluated exterior against which a body's inward rays are observed.
 *
 * The mesh may include the head that continues an open body collar. Each native body vertex names its actual vertex in this mesh. This identity, rather than a positional exclusion radius, determines incident triangles. All positions retain the body's evaluated metre frame. Providing this reference does not establish embedding, anatomical thickness or coverage.
 *
 * @evidence contracts/common.md#principled-implementation Native body origins address actual vertices in one evaluated exterior mesh, including continuing head sheets in the same metre frame.
 * @evidence contracts/common.md#clear-and-simple-design Mesh and canonical origin map keep incident-triangle ownership explicit for layer normal/ray consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identity replaces positional exclusion bands, and providing an exterior certifies no embedding or anatomical thickness.
 * @evidence contracts/common.md#meaningful-documentation Comments define continued sheets, native-to-exterior correspondence and common evaluated coordinates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The exterior result type performs no ray casting or incidence reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Origin correspondence is output identity without cached normal/ray evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned mesh/map storage belongs to its reader and the type opens no query resource.
 * @author Samchon
 */
export interface IHumanBodyLayerExterior {
  /** Evaluated exterior triangles, including any actual continuing sheets. */
  mesh: IAutoMovieMesh;

  /** One resident exterior vertex index for each native body vertex. */
  originVertices: readonly number[];
}
