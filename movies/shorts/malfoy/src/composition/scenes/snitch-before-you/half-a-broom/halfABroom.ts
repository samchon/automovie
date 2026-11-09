import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { PitchStage } from "../PitchStage";

/**
 * Scene 2, 8–15 s: the race east above the game. Harry pulls level on
 * Carina's right while she challenges him ("Try to keep up, Potter."); he
 * draws level again and answers ("Already am."); both sprint on and start
 * down toward the east goals. The camera rides alongside on Carina's side,
 * three-quarter front, for the two lines, then cuts behind and above them
 * for the knee-to-knee run at the goals: from her side, a rider level with
 * her is in line with the lens and hidden, while from behind the two read
 * side by side with the hoops ahead.
 *
 * Concretization: Carina's half-broom lead is the line and speed she flies
 * until the library has her chest-down race habit and chin lift (R5); the
 * lines are silent `say` entries, each carried on at the speaker's speed.
 *
 * @param stage The pitch stage.
 * @returns The scene, filling 8–15 s.
 * @evidence docs/body/screenplay/snitch-before-you.md#s02 The scene.
 * @evidence docs/body/screenplay/snitch-before-you.md#s02-b01 Harry level on her right; her challenge.
 * @evidence docs/body/screenplay/snitch-before-you.md#s02-b02 Harry's answer; both reach the east goals.
 * @evidence contracts/development/composition.md#screenplay-realization Realizes the race, both lines and the alongside camera; the chest-down habit and chin lift wait for R5.
 * @evidence contracts/development/composition.md#composition-only Chains library capabilities; every place is the pitch's.
 * @evidence contracts/development/composition.md#living-scene Both Seekers fly the whole scene; the camera rides with them.
 */
export function halfABroom(stage: PitchStage): AutoMovieComposition {
  const { carina, harry, camera } = stage;
  return StageTime.scene(
    "s02",
    8,
    15,
    carina
      .say("Try to keep up, Potter.", { start: 8.3 })
      .fly(["seekers.north.approach", "seekers.north.dive"], { speed: 10.5, lean: 1 }),
    harry
      .fly("seekers.south.level", { speed: 12, lean: 1 })
      .say("Already am.", { start: 10.6 })
      .fly(["seekers.south.approach", "seekers.south.dive"], { speed: 10, lean: 1 }),
    camera.alongside([carina, harry], { start: 8, side: "left", view: "front", distance: 6 }),
    camera.alongside([carina, harry], { start: 11.5, view: "behind", distance: 6, above: 2 }),
  );
}
