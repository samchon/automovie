import type { IHumanSourceSampleFile } from "./IHumanSourceSampleFile.ts";
import type { IHumanSourceSamplePart } from "./IHumanSourceSamplePart.ts";
import type { IHumanSourceSampleState } from "./IHumanSourceSampleState.ts";

/**
 * `manifest.json` of one Blender sampling run (`sample-mpfb-generation.py`).
 * Coordinates in every referenced file are Blender metres, Z up, facing -Y.
 * The manifest holds content and pinned tool versions only, so a rerun that
 * samples the same bytes writes the same manifest; the run clock lives in the
 * sampler's separate `run-environment.json`.
 *
 * @author Samchon
 */
export interface IHumanSourceSampleManifest {
  schema: string;
  blender: string;
  extension: string[];
  extensionModule: string;
  numpy: string;
  vertices: number;
  polygons: number;
  loops: number;
  landmarkIds: string[];
  parts: IHumanSourceSamplePart[];
  partStates: string[];
  neutralRecoveryMetres: number;
  landmarkRecoveryMetres: number;
  states: IHumanSourceSampleState[];
  files: Record<string, IHumanSourceSampleFile>;
}
