import type { IHumanSourceSamplePart } from "./IHumanSourceSamplePart.ts";
import type { IHumanSourceSampleFile } from "./IHumanSourceSampleFile.ts";
import type { IHumanSourceSampleState } from "./IHumanSourceSampleState.ts";

/**
 * `manifest.json` of one Blender sampling run (`sample-mpfb-generation.py`).
 * Coordinates in every referenced file are Blender metres, Z up, facing -Y.
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
  elapsedSeconds: number;
  states: IHumanSourceSampleState[];
  files: Record<string, IHumanSourceSampleFile>;
}
