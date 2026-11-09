import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { PitchStage } from "../PitchStage";

/**
 * Scene 1, 0–8 s: high over the practice match the two Seekers drift apart
 * from the game, Carina on Harry's left; Carina sights the Snitch waiting
 * low beside the east south post and sprints east, and Harry, whose eyes
 * find her moving first, goes after her a beat later and closes from behind
 * her right shoulder. The wide from above the west goal front holds the game
 * and the Seekers, then pushes onto the two Seekers as they go.
 *
 * Concretization: the scanning drift is a slow glide toward the east;
 * Harry's later start stands for his roaming eyes, because a rider's gaze
 * is not drawn yet. The supporting players' play is the parallel
 * `practiceTeams` track and the Snitch's flight the `theSnitch` track.
 *
 * @param stage The pitch stage.
 * @returns The scene, filling 0–8 s.
 * @evidence docs/body/screenplay/snitch-before-you.md#s01 The scene.
 * @evidence docs/body/screenplay/snitch-before-you.md#s01-b01 The Seekers above the game, Carina on Harry's left; the high wide.
 * @evidence docs/body/screenplay/snitch-before-you.md#s01-b02 Carina sprints first, Harry after her; the camera pushes onto them.
 * @evidence contracts/development/composition.md#screenplay-realization Realizes both beats' Seekers and camera; the game and the Snitch are parallel tracks.
 * @evidence contracts/development/composition.md#composition-only Chains library capabilities; every place is the pitch's.
 * @evidence contracts/development/composition.md#living-scene Both Seekers fly the whole scene and the camera follows them.
 */
export function theGame(stage: PitchStage): AutoMovieComposition {
  const { carina, harry, camera, players } = stage;
  return StageTime.scene(
    "s01",
    0,
    8,
    carina
      .enter("seekers.north.start", { facing: "eastGoalFront", riding: "broom-carina" })
      .fly("seekers.north.scan", { speed: 1.1 })
      .fly("seekers.north.race", { speed: 13, lean: 1 }),
    harry
      .enter("seekers.south.start", { facing: "eastGoalFront", riding: "broom-harry" })
      .fly("seekers.south.scan", { speed: 1.1 })
      .fly("seekers.south.race", { speed: 16, lean: 1, start: 6.2 }),
    camera.wide([carina, harry, players["G-C2"]!], { start: 0, from: "aboveWestGoalFront", motion: "follow" }),
    camera.shot([carina, harry], { start: 5.5, size: "full", motion: "push", cut: false, seconds: 2.4 }),
  );
}
