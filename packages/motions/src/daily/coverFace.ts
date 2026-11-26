import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanHandToBody,
} from "@automovie/interface";

import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_HAND_TO_BODY_COVER_FACE } from "../next/presets/HUMAN_HAND_TO_BODY_COVER_FACE";
import { handToFace } from "./handToFace";

/**
 * Cover the face with both bare hands. The open palms settle on the cheeks with
 * the fingers upward toward the eyes. The head bows into the cover as both
 * hands arrive at `atFace`. The `seconds` parameter sets the additional hold
 * after `taskEnd` before applying the action's manner and time scale.
 *
 * [Wróbel, Zickfeld and Ciesielski
 * (2025)](https://doi.org/10.3758/s13428-025-02766-4) describes face hiding as
 * part of crying behavior. The bilateral pose, 15 degrees of head flexion and
 * the default 1.2 s additional hold are authored choices.
 */
export const coverFace: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHandToBody.ICoverFace> =
  AutoMovieMotionHumanActionRow.of(
    "coverFace",
    handToFace,
    HUMAN_HAND_TO_BODY_COVER_FACE,
  );
