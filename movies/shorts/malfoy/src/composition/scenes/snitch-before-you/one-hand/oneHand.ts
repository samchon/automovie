import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { PitchStage } from "../PitchStage";

/**
 * Scene 4, 24–32 s: deep in the runoff both Seekers slow to the Snitch's
 * dance. Harry snatches at it left-handed and misses, pushes his glasses up,
 * reaches again past his seat and at 30.000 drops off the broom's left side,
 * hanging by his right hand while the broom flies on and sinks; he pushes
 * his glasses up again and swings his free arm up, short of the shaft.
 * Carina, behind his left shoulder, holds her open right hand beside the
 * Snitch while her eyes stay on him, then takes the hand back to her broom.
 * A medium alongside Harry for the first reach, then from 29 s one unbroken
 * three-quarter rear two-shot on Carina's side through the slip, the hang and
 * her open hand: Carina near, Harry ahead and beyond.
 *
 * Concretization: each reach aims at the point where the Snitch track
 * hovers then; Carina's eyes on Harry are a `lookAt` right after her hand
 * opens; her hand going back to the shaft is `withdraw`. From the rear
 * quarter of her side, her place behind his left shoulder puts the two
 * nearly in line with the lens instead of spread across the narrow frame.
 *
 * @param stage The pitch stage.
 * @returns The scene, filling 24–32 s.
 * @evidence docs/body/screenplay/snitch-before-you.md#s04 The scene.
 * @evidence docs/body/screenplay/snitch-before-you.md#s04-b01 The first reach misses; the glasses push.
 * @evidence docs/body/screenplay/snitch-before-you.md#s04-b02 The overreach and the slip at 30.000.
 * @evidence docs/body/screenplay/snitch-before-you.md#s04-b03 The glasses push while hanging; the free arm falls short.
 * @evidence docs/body/screenplay/snitch-before-you.md#s04-b04 Carina's open hand, her eyes on Harry, the hand back to her broom.
 * @evidence contracts/development/composition.md#screenplay-realization Realizes every beat's riders; the Snitch's dance is its own track.
 * @evidence contracts/development/composition.md#composition-only Chains library capabilities; the slip is pinned at its screenplay anchor; every place is the pitch's.
 * @evidence contracts/development/composition.md#living-scene Both riders act through the whole scene; the camera rides with them.
 */
export function oneHand(stage: PitchStage): AutoMovieComposition {
  const { carina, harry, camera } = stage;
  return StageTime.scene(
    "s04",
    24,
    32,
    harry
      .fly("dance.south", { speed: 2 })
      .reach("snitch.first", { hand: "left", close: true })
      .pushGlasses({ hand: "left" })
      .reach("snitch.beyond", { hand: "left", close: false, start: 29.1 })
      .slip({ hang: "right", contact: 30, anchor: "s04-b02/slip" })
      .pushGlasses({ hand: "left" })
      .swingArm({ hand: "left" }),
    carina
      .fly(["dance.north", "dance.northAhead"], { speed: 2 })
      .reach("snitch.atNorthRider", { hand: "right", close: false, start: 29.6 })
      .lookAt(harry)
      .withdraw({ hand: "right", start: 31.2 }),
    camera.alongside([harry], { start: 24, side: "left", view: "front", distance: 3.5, size: "medium" }),
    camera.alongside([carina, harry], { start: 29, side: "left", view: "rear", distance: 4.5 }),
  );
}
