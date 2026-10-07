import type { IHumanSourceCutSample } from "./IHumanSourceCutSample.ts";

/**
 * The one frozen neck cut of the source generation and every view of it.
 *
 * G1 vertex ids are the source vertex ids `[0, originalVertices)` followed by
 * one id per `intersections` entry. `triangles`/`labels` are the one skin:
 * head triangles first, in published face `Human` order, then body triangles
 * in complement order. `faceToG1` maps each published face skin vertex,
 * `r16ToSource` each published body skin vertex to its exact source twin, and
 * `p1Body*` describe the complementary body surface of the P1 representation.
 *
 * @author Samchon
 */
export interface IHumanSourceCut {
  minimumY: number;
  originalVertices: number;
  intersections: IHumanSourceCutSample[];
  faceSamples: IHumanSourceCutSample[];
  faceToG1: Int32Array;
  r16ToSource: Int32Array;
  triangles: Int32Array;
  labels: Uint8Array;
  parents: Int32Array;
  cornerUv: Float64Array;
  p1BodySamples: IHumanSourceCutSample[];
  p1BodyToG1: Int32Array;
  p1BodyIndices: Int32Array;
  p1BodyUv: Float64Array;
  p1BodyParents: Int32Array;
  p1FaceParents: Int32Array;
  checks: Record<string, number | boolean | string>;
}
