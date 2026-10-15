import type { IAutoMovieValidation } from "@automovie/interface";
import { Axis } from "./Axis";

/** Texture-scale census of the built models with the engine's own validation. */
export type MaterialTextureScaleAudit = {
  /** Engine texture-scale validation of the same models. */
  validation: IAutoMovieValidation;
  /** Number of models inspected. */
  models: number;
  /** Number of model parts inspected. */
  parts: number;
  /** Number of parts whose material binds no texture. */
  partsWithoutTexture: number;
  /** Verdict for each texture axis of each bound slot, in model, part, slot and axis order. */
  axes: Axis[];
};
