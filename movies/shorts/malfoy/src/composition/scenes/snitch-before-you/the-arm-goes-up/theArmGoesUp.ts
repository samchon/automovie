import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { PitchStage } from "../PitchStage";

/**
 * Scene 5, 32–35 s: the cut back over the game. G-B1 drives the eastern
 * Bludger away, his head comes round onto Harry far out over the runoff
 * and his raised arm stops play; behind him the game stops and turns east.
 * Off screen, G-K leaves for the runoff and Carina dives down toward
 * Harry's left side while he hangs. One shot rides beside G-B1,
 * three-quarter front, from the swing to the raised arm.
 *
 * Concretization: the twelve's strike, stop and turn are performed by the
 * parallel `practiceTeams` track, which owns their whole presence; this
 * scene holds the cut and Carina's off-screen approach.
 *
 * @param stage The pitch stage.
 * @returns The scene, filling 32–35 s.
 * @evidence docs/body/screenplay/snitch-before-you.md#s05 The scene.
 * @evidence docs/body/screenplay/snitch-before-you.md#s05-b01 The cut to G-B1, riding beside him through the swing and the raised arm.
 * @evidence docs/body/screenplay/snitch-before-you.md#s05-b02 The same shot holds G-B1's raised arm with the stopped game behind him.
 * @evidence docs/body/screenplay/snitch-before-you.md#s04-b04 Carina's dive toward Harry's left side continues off screen.
 * @evidence contracts/development/composition.md#screenplay-realization Realizes the cut and the off-screen approach; the players' actions are in `practiceTeams`.
 * @evidence contracts/development/composition.md#composition-only Chains library capabilities; every place is the pitch's.
 * @evidence contracts/development/composition.md#living-scene Carina keeps flying and Harry keeps hanging off screen.
 */
export function theArmGoesUp(stage: PitchStage): AutoMovieComposition {
  const { carina, harry, camera, players } = stage;
  return StageTime.scene(
    "s05",
    32,
    35,
    carina.fly("under.north", { speed: 2.5 }),
    StageTime.until(35, harry),
    camera.alongside([players["G-B1"]!], { start: 32, side: "left", view: "front", distance: 6 }),
  );
}
