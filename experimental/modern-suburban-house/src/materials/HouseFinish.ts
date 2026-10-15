/**
 * Shared data shape for the material owners. A finish names the host
 * surface partitions, its physical response, and the metric tile consumed by
 * the viewer. Geometry and UV axes stay with each model or space host.
 * Changing a finish invalidates material captures of every named host.
 */
import type { IAutoMovieMaterial } from "@automovie/interface";

/** One already-coloured sRGB tile; the renderer uses a white tint for it. */
interface HouseTexture {
  readonly file: string;
  readonly metres: readonly [number, number];
  readonly projection: "wall" | "roof" | "ground" | "local";
}

/** A model id and its face ids; trailing punctuation identifies a model family. */
interface ModelFaceBinding {
  readonly model: string;
  readonly faces: readonly string[];
}

/** Material and its exact host-face vocabulary from the material design. */
export interface HouseFinish {
  /** Native material of the finish. */
  readonly material: IAutoMovieMaterial;
  /** Host face ids that take this finish. */
  readonly faces: readonly string[];
  /** Model faces that take this finish. */
  readonly modelBindings?: readonly ModelFaceBinding[];
  /** Metric tile the viewer draws on the finish. */
  readonly texture?: HouseTexture;
}

