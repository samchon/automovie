import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

/** Expand a simple-tier shape to detailed channels, keeping the residue of `over`. */
export interface IBodySimpleExpandMessage {
  /** Correlates the reply. */
  id: number;

  /** Request discriminant. */
  kind: "expand";

  /** The simple-tier values to expand. */
  simple: IAutoMovieHumanBodySimpleShape;

  /** The detailed shape to keep the residue of; absent for a fresh body. */
  over?: Record<string, number>;
}
