import type { IHumanSourceSampleManifest } from "./IHumanSourceSampleManifest.ts";
import type { IHumanSourceSampleState } from "./IHumanSourceSampleState.ts";
import type { IHumanSourceSampleWeights } from "./IHumanSourceSampleWeights.ts";

/**
 * One sampling run loaded in memory, still in Blender coordinates. Arrays are
 * flat: `neutral` is XYZ per skin vertex, `landmarksNeutral` XYZ per landmark,
 * `loopUv` UV per loop, `flattenOperator` row-major (interior x boundary).
 *
 * @author Samchon
 */
export interface IHumanSourceSample {
  directory: string;
  /** Exact content manifest bytes decoded by this load; host run clocks are separate. */
  manifestBytes: Buffer;
  manifest: IHumanSourceSampleManifest;
  neutral: Float64Array;
  landmarksNeutral: Float64Array;
  loopStart: Int32Array;
  loopTotal: Int32Array;
  loopVertex: Int32Array;
  loopUv: Float64Array;
  weights: IHumanSourceSampleWeights;
  flattenInterior: Int32Array;
  flattenBoundary: Int32Array;
  flattenOperator: Float64Array;
  /** Genital crease fill: region, its two surrounding rings, and the row-major operator. */
  genitalInterior: Int32Array;
  genitalBoundary: Int32Array;
  genitalOperator: Float64Array;
  rowsVertex: Int32Array;
  rowsDelta: Float64Array;
  landmarkDelta: Float64Array;
  states: Map<string, IHumanSourceSampleState>;
  /** Part id -> subdivision level -> refitted positions (states x vertices x 3). */
  partPositions: Map<string, Map<string, Float64Array>>;
}
