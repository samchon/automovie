import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { PitchStage } from "../PitchStage";

/**
 * Scene 7, 43–60 s: on one broom Carina levels them out; Harry looks up at
 * the Snitch hanging high in the sun, then at her, and names what she gave
 * up ("You had it."); Carina turns it aside ("Don't make a habit of it.");
 * Harry lets her ("No promises."); facing front, she touches her forehead
 * with her free left hand for a second; then she banks them round toward
 * the pitch and lets the broom run home toward the east hoops, G-K falling
 * in on their far side as they pass him. Three-quarter front medium
 * two-shot for the words, with a close insert that follows the Snitch from
 * the moment Harry looks up, through its hang, until it darts away (a held
 * framing would lose it while it is still flying in), then a cut to a view from just
 * behind and above the pair, the east hoops ahead and growing, held to the
 * end.
 *
 * Concretization: Carina flies the tandem broom and Harry rides the rear
 * seat the library places behind her; her levelling-out is a slow climb to
 * the pitch's `tandem.level`, the U-turn through `tandem.turn` and
 * `tandem.back` stays at 5 m/s inside the tandem's bank limit, and the run
 * home at 7.5 m/s through `tandem.home` to `keeper.runoff` closes to about
 * forty metres of the east goals and is still flying at the last frame, so
 * no route end falls inside the film; the final view from behind stands 3 m
 * above the pair so Carina's head shows beyond Harry's; G-K's waiting and escort
 * are in `practiceTeams`, the Snitch's hang in `theSnitch`.
 *
 * @param stage The pitch stage.
 * @returns The scene, filling 43–60 s.
 * @evidence docs/body/screenplay/snitch-before-you.md#s07 The scene.
 * @evidence docs/body/screenplay/snitch-before-you.md#s07-b01 The Snitch insert, then the three lines in order.
 * @evidence docs/body/screenplay/snitch-before-you.md#s07-b02 Her forehead touch, nobody facing her.
 * @evidence docs/body/screenplay/snitch-before-you.md#s07-b03 The turn home; the view from behind with the east hoops ahead to the end.
 * @evidence contracts/development/composition.md#screenplay-realization Realizes the lines, the habit and the ride home.
 * @evidence contracts/development/composition.md#composition-only Chains library capabilities; every place is the pitch's.
 * @evidence contracts/development/composition.md#living-scene Both riders fly to the end; the camera rides with them.
 */
export function home(stage: PitchStage): AutoMovieComposition {
  const { carina, harry, camera } = stage;
  return StageTime.scene(
    "s07",
    43,
    60,
    harry
      .lookAt(stage.snitch)
      .lookAt(carina, { start: 44.6 })
      .say("You had it.", { start: 45 })
      .say("No promises.", { start: 47.6 }),
    carina
      .fly("tandem.level", { speed: 2.5 })
      .say("Don't make a habit of it.", { start: 46.2 })
      .fly("tandem.out", { speed: 3 })
      .touchForehead({ hand: "left" })
      .fly(["tandem.turn", "tandem.back"], { speed: 5 })
      .fly(["tandem.home", "keeper.runoff"], { speed: 7.5 }),
    camera.alongside([carina, harry], { start: 43, side: "left", view: "front", distance: 4, size: "medium" }),
    camera.shot([stage.snitch], { start: 43.4, size: "close", motion: "follow" }),
    camera.alongside([carina, harry], { start: 44.5, side: "left", view: "front", distance: 4, size: "medium" }),
    camera.alongside([carina, harry], { start: 53, view: "behind", distance: 4.5 }),
  );
}
