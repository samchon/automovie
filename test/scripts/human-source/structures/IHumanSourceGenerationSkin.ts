import type { IHumanSourceCutSample } from "./IHumanSourceCutSample.ts";

/**
 * The one connected skin of a generation (P2).
 *
 * Vertex ids `[0, originalVertices)` are the subdivided MPFB skin's; id
 * `originalVertices + i` is the frozen cut sample `intersections[i]`.
 * `positions` is the neutral (metres, shared frame) and `neutralOrigin` names
 * per vertex where it comes from: 0 published face, 1 published body plus the
 * source chin bake, 2 upstream source plus the chin bake. `triangles` carry a
 * partition label each (0 head, 1 body), the source parent triangle and three
 * corner UVs. The face and body vertex maps let derivatives authored on the
 * published surfaces be re-addressed without searching by position.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationSkin {
  originalVertices: number;
  intersections: IHumanSourceCutSample[];
  positions: number[];
  neutralOrigin: number[];
  triangles: number[];
  labels: number[];
  parents: number[];
  cornerUvs: number[];
  faceVertexToSkin: number[];
  bodyVertexToSkin: number[];
}
