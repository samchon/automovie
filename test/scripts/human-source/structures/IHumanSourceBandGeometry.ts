import type { IHumanSourceGenerationBand } from "./IHumanSourceGenerationBand.ts";

/**
 * The band record plus per-skin-vertex lookups used while extending rows:
 * `azimuth` (radians about `band.axis`, NaN where unused), the head and body
 * band weights (zero outside each band), the partition of each vertex (0 head
 * only, 1 body only, 2 cut sample) and the loop samples' azimuths in
 * `band.loopSamples` order.
 *
 * @author Samchon
 */
export interface IHumanSourceBandGeometry {
  band: IHumanSourceGenerationBand;
  azimuth: Float64Array;
  headWeight: Float64Array;
  bodyWeight: Float64Array;
  partition: Uint8Array;
  loopAzimuths: Float64Array;
  checks: Record<string, number | boolean | string>;
}
