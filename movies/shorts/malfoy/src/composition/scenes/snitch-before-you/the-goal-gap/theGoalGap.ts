import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { PitchStage } from "../PitchStage";

/**
 * Scene 3, 15–24 s: both Seekers dive through the east goals' south gap,
 * Carina beside the middle post and Harry beside the south post; behind the
 * posts they turn hard right round the back of the south post, Harry on the
 * inside holding the tighter line and coming out ahead with Carina behind
 * his left shoulder; they climb east over the empty runoff. The alongside
 * camera on Carina's side stays on the outside of the turn, then cuts in
 * closer, still three-quarter front, as they straighten into the climb.
 *
 * Concretization: Harry's tighter line is his route's inside lane round the
 * post, banked by the library's turn law; per-rider bank limits wait for R5.
 * Out of the turn Carina flies within 0.1 m/s of Harry's speed, so the order
 * holds at about a body length and the two stay close enough for the closer
 * two-shot.
 *
 * @param stage The pitch stage.
 * @returns The scene, filling 15–24 s.
 * @evidence docs/body/screenplay/snitch-before-you.md#s03 The scene.
 * @evidence docs/body/screenplay/snitch-before-you.md#s03-b01 Through the south gap in two lanes.
 * @evidence docs/body/screenplay/snitch-before-you.md#s03-b02 The hook round the south post; Harry gains the inside.
 * @evidence docs/body/screenplay/snitch-before-you.md#s03-b03 East and up over the runoff, the order holding; the closer alongside.
 * @evidence contracts/development/composition.md#screenplay-realization Realizes the dive, the hook and the climb; the Snitch leads them on its own track.
 * @evidence contracts/development/composition.md#composition-only Chains library capabilities and the pitch's lanes.
 * @evidence contracts/development/composition.md#living-scene Both Seekers fly the whole scene; the camera rides with them.
 */
export function theGoalGap(stage: PitchStage): AutoMovieComposition {
  const { carina, harry, camera } = stage;
  return StageTime.scene(
    "s03",
    15,
    24,
    carina
      .fly(["eastSouthGap.north", "hook.north", "eastSouthPost.hookOutsideOut"], { speed: 6.8 })
      .fly(["runoff.north", "climb.north", "chase.north"], { speed: 7.1 }),
    harry.fly(
      ["eastSouthGap.south", "hook.south", "eastSouthPost.hookInsideOut", "runoff.south", "climb.south", "chase.south"],
      { speed: 7.2 },
    ),
    camera.alongside([carina, harry], { start: 15, side: "left", view: "front", distance: 6 }),
    camera.alongside([carina, harry], { start: 18.6, side: "left", view: "front", distance: 4.5 }),
  );
}
