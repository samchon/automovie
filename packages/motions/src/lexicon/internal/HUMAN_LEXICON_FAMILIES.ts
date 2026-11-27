import type { IAutoMovieMotionHumanLexiconFamilies } from "@automovie/interface";

import { HUMAN_LEXICON_ARMS_LAWS } from "./HUMAN_LEXICON_ARMS_LAWS";
import { HUMAN_LEXICON_BODY_LAWS } from "./HUMAN_LEXICON_BODY_LAWS";
import { HUMAN_LEXICON_HAND_LAWS } from "./HUMAN_LEXICON_HAND_LAWS";

/*
 * Every lexicon family's laws, by export key: each family's record names its
 * laws one by one, so the registry (`HUMAN_LEXICON`) reads them without probing
 * what a namespace exports; a namespace's other members (a gait's `MARCH`, its
 * `MOODS`) are no law and stay out. The records are kept by group
 * (`HUMAN_LEXICON_BODY_LAWS`, `HUMAN_LEXICON_HAND_LAWS`,
 * `HUMAN_LEXICON_ARMS_LAWS`).
 */
export const HUMAN_LEXICON_FAMILIES: IAutoMovieMotionHumanLexiconFamilies = {
  ...HUMAN_LEXICON_BODY_LAWS,
  ...HUMAN_LEXICON_HAND_LAWS,
  ...HUMAN_LEXICON_ARMS_LAWS,
};
