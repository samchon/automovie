import type { IHumanFaceIrisGlobeTriangle } from "./IHumanFaceIrisGlobeTriangle";

/**
 * One eye's textured globe on the neutral basis.
 *
 * The globe is the first textured, UV-bearing region whose triangles are fully
 * bound to the eye owner (weight one on all three vertices). `texture` is the
 * embedded PNG data URI of its material, `triangles` those bound triangles and
 * `positions` the distinct neutral positions of their vertices.
 *
 * @author Samchon
 */
export interface IHumanFaceIrisGlobe {
  /** Eye owner the globe is bound to. */
  eye: string;

  /** ID of the globe region's material. */
  material: string;

  /** Embedded PNG data URI of that material's base colour texture. */
  texture: string;

  /** Region triangles fully bound to the eye owner. */
  triangles: IHumanFaceIrisGlobeTriangle[];

  /** Distinct neutral positions of those triangles' vertices, metres. */
  positions: [number, number, number][];
}
