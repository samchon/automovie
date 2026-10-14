import type { ICatParams } from "./ICatParams";

/**
 * 9 authored metre dimensions borrowed by the existing cat page and GLB builder. backHeight is 0.34 metres, not a measured shoulder/withers height. neckLength is retained in the input shape but this builder ignores it: neck/head offsets remain fixed at (0,0.05,0.09) and (0,0.03,0.08) metres. One module-owned mutable record is retained; consumers must not mutate it, and the producer does not validate positivity or proportions.
 *
 * @author Samchon
 */
export const DEFAULT_CAT: ICatParams = {
  backHeight: 0.34,
  trunkLength: 0.28,
  legHalf: 0.055,
  upperLeg: 0.16,
  lowerLeg: 0.16,
  neckLength: 0.1,
  headRadius: 0.078,
  rodRadius: 0.03,
  trunkRadius: 0.05,
};
