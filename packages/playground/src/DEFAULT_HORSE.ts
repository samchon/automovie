import type { IHorseParams } from "./IHorseParams";
/**
 * 8 authored metre dimensions borrowed by the existing horse page and GLB builder. backHeight is 1.0 metres, not a measured shoulder/withers height. Neck/head offsets remain fixed at (0,0.34,0.26) and (0,0.12,0.2) metres; the spine attachment is consumed as the saddle by the existing rider pages. One module-owned mutable record is retained; consumers must not mutate it, and the producer does not validate positivity or proportions.
 *
 * @author Samchon
 */
export const DEFAULT_HORSE: IHorseParams = {
  backHeight: 1.0,
  trunkLength: 0.92,
  legHalf: 0.17,
  upperLeg: 0.46,
  lowerLeg: 0.46,
  headRadius: 0.15,
  rodRadius: 0.06,
  trunkRadius: 0.13,
};
