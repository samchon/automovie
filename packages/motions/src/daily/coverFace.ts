import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanHandToBody,
} from "@automovie/interface";

import { HumanActionRow } from "../law/HumanActionRow";
import { HUMAN_HAND_TO_BODY_COVER_FACE } from "../next/presets/HUMAN_HAND_TO_BODY_COVER_FACE";
import { handToFace } from "./handToFace";

/**
 * Cover the face with both bare hands. The open palms settle on the cheeks
 * with the fingers upward toward the eyes. The head bows into the cover as
 * both hands arrive at `atFace`. The `seconds` parameter sets the additional
 * hold after `taskEnd` before applying the action's manner and time scale.
 *
 * [Wróbel, Zickfeld and Ciesielski (2025)](https://doi.org/10.3758/s13428-025-02766-4)
 * describes face hiding as part of crying behavior. The bilateral pose, 15
 * degrees of head flexion and the default 1.2 s additional hold are authored choices.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bilateral pose, head action, event and open inputs.
 * @evidence contracts/development/design.md#principled-representation A hand-to-face hold on two distinct facial regions, with the owner's synchronized arm planning and head pulse.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Fixes the gesture and exposes only hold duration and manner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing planner and canonical cheek regions with fixed bare-hand contact.
 */
export const coverFace: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHandToBody.ICoverFace> =
  HumanActionRow.of("coverFace", handToFace, HUMAN_HAND_TO_BODY_COVER_FACE);
