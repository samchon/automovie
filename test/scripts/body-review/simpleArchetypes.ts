import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

import archetypes from "../../studies/human-body/connected-basis/archetypes.json";

/**
 * Bodies described the way a person would describe them, as simple-tier
 * values with an optional detailed override on top: the review population
 * of the simple tier, shared with the editor's presets through the study's
 * `archetypes.json`. They are verification samples of what the expansion
 * reaches and refuses, not targets; the editor's reach is what the numbers
 * of the basis give.
 */
export const SIMPLE_ARCHETYPES = archetypes as Record<
  string,
  { simple: IAutoMovieHumanBodySimpleShape; detail?: Record<string, number> }
>;
