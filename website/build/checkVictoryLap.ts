import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanTouch } from "@automovie/motions";
import { HumanFoot } from "../../packages/motions/src/posture/internal/HumanFoot";
import { strict as assert } from "node:assert";

import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../src/scenes/SCENES";
import { SceneTake } from "../src/scenes/SceneTake";
import type { IScene } from "../src/scenes/structures/IScene";

const { AutoMovieMotionHumanTouchEffector, touchEffectors } =
  AutoMovieMotionHumanTouch;

/** Where and when one athlete's displayed right palm arrives at the low five. */
interface IArrival {
  /** The `meet` event's film second. */
  time: number;

  /** The palm's world point at that second, metres. */
  point: IAutoMovieVector3;
}

/** The low five's shared contact bound in metres, the touch law's site bound. */
const MEET: number = 0.01;

/** How far above its final rest the thumbs-up hand rises, metres. */
const RAISED: number = 0.15;

/** A planted sole's height bound above the floor, metres. */
const PLANTED: number = 0.005;

/**
 * Verify that the staged low five meets and the next two celebration beats
 * remain reachable on the two published body combinations. Master's Victory
 * Lap celebrates with a fist bump; this scene keeps the original low five.
 *
 * Scenarios:
 * 1. Both palms arrive together at no more than the 10-mm site bound.
 * 2. The runner-up begins the thumbs-up after the meeting and its raised hand
 *    stays over two planted feet. The third athlete reaches the firm press.
 * 3. A runner-up moved 1.2 m away refuses the low five.
 */
export function checkVictoryLap(): void {
  const scene: IScene = SCENES.find(
    (item: IScene): boolean => item.id === "victory-lap-low-five",
  )!;
  for (const take of [scene.takes[0]!, scene.takes[2]!]) {
    const built: PlaygroundPerformance.IBuilt = PlaygroundPerformance.build(
      SceneTake.apply(scene.composition!, take),
    );
    const winner: IArrival = arrival(built, "w1");
    const runnerUp: IArrival = arrival(built, "w2");
    assert(Math.abs(winner.time - runnerUp.time) <= 1e-7, take.label);
    assert(AutoMovieEngineVector3.distance(winner.point, runnerUp.point) <= MEET, take.label);

    const thumbs: IAutoMovieMotionHumanSegment = built.performance
      .segments("w2")
      .find(
        (segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.name === "thumbsUp",
      )!;
    assert(thumbs.start > runnerUp.time, take.label);
    const pose: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      built.performance.bones(
        "w2",
        (cue(thumbs, "strokeStart") + cue(thumbs, "strokeEnd")) / 2,
      );
    const home: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      built.performance.bones("w2", built.performance.duration);
    assert(
      pose.get("rightHand")!.worldPosition.y >
        home.get("rightHand")!.worldPosition.y + RAISED,
      take.label,
    );
    for (const side of ["left", "right"] as const)
      assert(
        HumanFoot.sockets(thumbs.context.body, pose, side).some(
          (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            Math.abs(socket.point.y) <= PLANTED,
        ),
        take.label,
      );
    assert.equal(built.performance.segments("w3").at(-1)!.name, "firmPress");
    built.performance.bones("w3", built.performance.duration);
  }
  const impossible: IPlaygroundComposition = SceneTake.apply(
    scene.composition!,
    scene.takes[0]!,
  );
  impossible.performers.find(
    (person: IPlaygroundComposition.IPerformer): boolean =>
      person.subject === "w2",
  )!.x += 1.2;
  assert.throws(() => PlaygroundPerformance.build(impossible), /lowFive/);
}

/** The film second of a segment's named event. */
function cue(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === name,
      )!.share
  );
}

/** Read one athlete's displayed right palm at the low five's meeting. */
function arrival(
  built: PlaygroundPerformance.IBuilt,
  subject: string,
): IArrival {
  const lowFive: IAutoMovieMotionHumanSegment = built.performance
    .segments(subject)
    .find(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.name === "lowFive",
    )!;
  const time: number = cue(lowFive, "meet");
  return {
    time,
    point: AutoMovieMotionHumanTouchEffector.point(
      lowFive.context.body,
      built.performance.bones(subject, time),
      "right",
      touchEffectors.TABLE.palm,
    ),
  };
}
