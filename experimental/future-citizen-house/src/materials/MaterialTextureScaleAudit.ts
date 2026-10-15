import type { IAutoMovieValidation } from "@automovie/interface";
import { Axis } from "./Axis";

export type MaterialTextureScaleAudit = {
  validation: IAutoMovieValidation;
  models: number;
  parts: number;
  partsWithoutTexture: number;
  axes: Axis[];
};
