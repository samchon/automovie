import type { IHumanSourceSurfaceMesh } from "./IHumanSourceSurfaceMesh.ts";

/**
 * What the body field producers share, all on the body partition view's
 * surface: the neutral mesh, mirror twins, symmetric normals, the smoothing
 * and diffusion operators, the shape evaluator and the current endpoint rows.
 *
 * @author Samchon
 */
export interface IHumanSourceFieldContext {
  /** The body view's neutral surface. */
  mesh: IHumanSourceSurfaceMesh;

  /** Each vertex's mirror twin. */
  twin: Int32Array;

  /** Bilaterally symmetric unit vertex normals. */
  normals: Float64Array;

  /** Uniform-Laplacian sweeps (f ← (f + neighbour mean) / 2). */
  smooth: (field: Float64Array, sweeps: number) => Float64Array;

  /** Implicit heat diffusion over a length in metres, boundary held. */
  diffuse: (field: Float64Array, lengthMetres: number) => Float64Array;

  /** Rest positions of the body view at a shape, through its own basis. */
  evaluate: (shape: Record<string, number>) => Float64Array;

  /** An endpoint's rows as a dense vector field (three per vertex). */
  rows: (name: string) => Float64Array;

  /** A named skin landmark's vertex on the body view. */
  landmark: (name: string) => number;
}
