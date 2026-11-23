import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanHandToBody,
} from "@automovie/interface";

import { HumanActionRow } from "../law/HumanActionRow";
import { HUMAN_HAND_TO_BODY_WIPE_TEARS } from "../next/presets/HUMAN_HAND_TO_BODY_WIPE_TEARS";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where each hand wipes, which points mark the gesture and which inputs remain open.
 * @evidence contracts/development/design.md#principled-representation A single-hand surface rub in the existing hand-to-face phase model.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Fixes the task and excludes a second hand while inheriting the timing, one-hand controls and cuts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The cheek and timing are row data, and the planner handles mirroring, contact and return.
 */
export const wipeTears: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHandToBody.IWipeTears> =
  HumanActionRow.of("wipeTears", handToFace, HUMAN_HAND_TO_BODY_WIPE_TEARS);
