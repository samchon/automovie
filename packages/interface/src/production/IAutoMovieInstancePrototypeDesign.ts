import type { IAutoMovieModelLod } from "./IAutoMovieModelLod";

/** One reusable weighted model prototype selectable by slots in a logical set. */
export interface IAutoMovieInstancePrototypeDesign {
  /** Stable non-blank id unique inside the set. */
  id: string;

  /** Existing model group id used by this prototype. */
  model: string;

  /**
   * Ordered distance tiers for this prototype's group, ordered `hero`, `near`,
   * `far` with increasing positive distances and an unbounded tier only at the
   * end; omitted or empty draws `model` as one unbounded `near` tier.
   */
  lod?: IAutoMovieModelLod[];

  /** Positive deterministic selection weight. */
  weight: number;
}
