import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanHandToBody,
} from "@automovie/interface";

import { armPhrase } from "../everyday/armPhrase";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_HAND_TO_BODY_TUCK_HAIR } from "../next/presets/HUMAN_HAND_TO_BODY_TUCK_HAIR";

/**
 * The relaxed index fingertip sweeps from in front of the same-side ear to
 * behind it and retracts. Register the row with `HumanPerformance` and author
 * it by name, optionally selecting `side` or `manner`.
 *
 * The grooming action is described in
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC6137092/. The start and end offsets
 * are provisional shares of arm length. A slightly outward offset clears the
 * head as the fingertip passes the ear landmark.
 */
export const tuckHair: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHandToBody.ITuckHair> =
  AutoMovieMotionHumanActionRow.of(
    "tuckHair",
    armPhrase,
    HUMAN_HAND_TO_BODY_TUCK_HAIR,
  );
