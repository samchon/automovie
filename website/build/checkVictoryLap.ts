import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanFoot,
  touchEffectors,
} from "@automovie/motions";
import { strict as assert } from "node:assert";

import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import { SCENES } from "../src/scenes/SCENES";
import { SceneTake } from "../src/scenes/SceneTake";
import type { IScene } from "../src/scenes/structures/IScene";

/**
 * Verify that the actual staged low five meets and the next two celebration
 * beats remain reachable on the two published body combinations.
 *
 * Scenarios:
 * 1. Both palms arrive together at no more than the existing 10-mm site bound.
 * 2. The runner-up begins the thumbs-up after the meeting and its raised hand
 *    stays over two planted feet. The third athlete reaches the firm press.
 */
export function checkVictoryLap(): void {
  const scene: IScene = SCENES.find(
    (item) => item.id === "victory-lap-low-five",
  )!;
  for (const take of [scene.takes[0]!, scene.takes[2]!]) {
    const { performance }: { performance: IAutoMovieMotionHumanPerformance } =
      PlaygroundPerformance.build(SceneTake.apply(scene.composition!, take));
    const cue = (segment: IAutoMovieMotionHumanSegment, name: string): number =>
      segment.start +
      segment.plan.duration *
        segment.plan.events.find((event) => event.name === name)!.share;
    const arrival = (
      subject: string,
    ): { time: number; point: IAutoMovieVector3 } => {
      const lowFive: IAutoMovieMotionHumanSegment = performance
        .segments(subject)
        .find((segment) => segment.name === "lowFive")!;
      const time: number = cue(lowFive, "meet");
      return {
        time,
        point: AutoMovieMotionHumanTouchEffector.point(
          lowFive.context.body,
          performance.bones(subject, time),
          "right",
          touchEffectors.TABLE.palm,
        ),
      };
    };
    const winner = arrival("w1");
    const runnerUp = arrival("w2");
    assert(Math.abs(winner.time - runnerUp.time) <= 1e-7, take.label);
    assert(Vector3.distance(winner.point, runnerUp.point) <= 0.01, take.label);

    const thumbs: IAutoMovieMotionHumanSegment = performance
      .segments("w2")
      .find((segment) => segment.name === "thumbsUp")!;
    assert(thumbs.start > runnerUp.time, take.label);
    const pose = performance.bones(
      "w2",
      (cue(thumbs, "strokeStart") + cue(thumbs, "strokeEnd")) / 2,
    );
    const home = performance.bones("w2", performance.duration);
    assert(
      pose.get("rightHand")!.worldPosition.y >
        home.get("rightHand")!.worldPosition.y + 0.15,
      take.label,
    );
    for (const side of ["left", "right"] as const)
      assert(
        HumanFoot.sockets(thumbs.context.body, pose, side).some(
          (socket) => Math.abs(socket.point.y) <= 0.005,
        ),
        take.label,
      );
    assert.equal(performance.segments("w3").at(-1)!.name, "firmPress");
    performance.bones("w3", performance.duration);
  }
  const impossible = SceneTake.apply(scene.composition!, scene.takes[0]!);
  impossible.performers.find(({ subject }) => subject === "w2")!.x += 1.2;
  assert.throws(() => PlaygroundPerformance.build(impossible), /lowFive/);
}
