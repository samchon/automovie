import type { AutoMovieHumanPersonHeadShapeField } from "./AutoMovieHumanPersonHeadShapeField";

/**
 * Source-neutral anatomical exterior differences on a shared head generation.
 *
 * Every present value requests the generation's corresponding source trait,
 * including zero. Omission preserves that source's neutral. The generation
 * registration supplies units, actual authored support, bounds and the one
 * body channel that carries both skin partitions and their attached parts.
 * Raw clinical observations remain in their separate anatomical record.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadShape extends Partial<
  Record<AutoMovieHumanPersonHeadShapeField, number>
> {}
