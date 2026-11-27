import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanHandToBody,
} from "@automovie/interface";

import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_HAND_TO_BODY_WIPE_TEARS } from "../../next/presets/HUMAN_HAND_TO_BODY_WIPE_TEARS";
import { handToFace } from "./handToFace";

/**
 * Brush tears from one cheek. The chosen hand rises to its own cheek, wipes up
 * and down along the cheek and returns to its entry pose. `atCheek` marks
 * arrival and `taskEnd` marks the end of the wipe. The side, repetition count,
 * timing and manner are open. A held tissue can supply the contact point.
 *
 * [Wróbel, Zickfeld and Ciesielski
 * (2025)](https://doi.org/10.3758/s13428-025-02766-4) treats face touching as a
 * visible component of crying. The wipe's path, palm shape and default timing
 * are authored choices.
 */
export const wipeTears: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHandToBody.IWipeTears> =
  AutoMovieMotionHumanActionRow.of(
    "wipeTears",
    handToFace,
    HUMAN_HAND_TO_BODY_WIPE_TEARS,
  );
