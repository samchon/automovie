import type { IHumanSourceSampleFile } from "./IHumanSourceSampleFile.ts";
import type { IHumanSourceSamplePart } from "./IHumanSourceSamplePart.ts";
import type { IHumanSourceSampleState } from "./IHumanSourceSampleState.ts";

/**
 * `manifest.json` of one complete acquired native source sample.
 * Coordinates in every referenced file are Blender metres, Z up, facing -Y.
 * The normal TS importer preserves these original content and tool records.
 * Blender, extension and NumPy fields describe historical acquisition, not
 * execution by the importer. Original host evidence stays separately in
 * `run-environment.json`; no fresh extraction is inferred.
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
