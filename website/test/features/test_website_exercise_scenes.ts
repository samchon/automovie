import type {
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { PlaygroundBodies } from "../../src/playground/package/PlaygroundBodies";
import { PlaygroundPerformance } from "../../src/playground/package/PlaygroundPerformance";
import { SceneTake } from "../../src/scenes/SceneTake";
import { SCENES_FIELD } from "../../src/scenes/data/SCENES_FIELD";
import { SCENES_PARTNER } from "../../src/scenes/data/SCENES_PARTNER";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * Every published exercise take plays through the gallery's take overrides
 * and the composition adapter shared with the playground.
 *
 * Scenarios:
 * 1. One basketball leaves the passer and is secured on the receiver's side.
 * 2. Both judoka begin the exchange together and the receiver reaches the mat.
 * 3. The wrestling cast avoids joint intrusion beyond the 10 mm skin
 *    allowance at 30 Hz and at authored events, then returns upright.
 */
export function test_website_exercise_scenes(): void {
  const scenes: readonly IScene[] = [...SCENES_FIELD, ...SCENES_PARTNER];
  const findings: string[] = [];
  for (const [id, check] of [
    ["shoot-around", checkPass],
    ["judo-randori", checkThrow],
    ["wrestling-reset", checkReset],
  ] as const) {
    const scene: IScene | undefined = scenes.find(
      (entry: IScene): boolean => entry.id === id,
    );
    if (
      scene === undefined ||
      scene.composition === null ||
      scene.takes.length === 0
    ) {
      findings.push(`${id} has no published takes`);
      continue;
    }
    for (const take of scene.takes) {
      try {
        check(
          PlaygroundPerformance.build(SceneTake.apply(scene.composition, take)),
        );
      } catch (error) {
        findings.push(
          `${id}, ${take.label}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
  TestValidator.equals("all published exercise takes play", findings, []);
}

/** The staged pass reaches the receiver as one continuous prop flight. */
function checkPass({ performance: court }: PlaygroundPerformance.IBuilt): void {
  const flights: readonly IAutoMovieMotionHumanPropFlight.IFlight[] =
    court.flights("ball");
  TestValidator.equals("one flight for the staged pass", flights.length, 1);
  const flight: IAutoMovieMotionHumanPropFlight.IFlight = flights[0]!;
  TestValidator.predicate(
    "the receiver secures the pass after release",
    flight.capturedAt !== undefined && flight.capturedAt > flight.launch,
  );
  const position: IAutoMovieVector3 = court.prop(
    "ball",
    flight.capturedAt!,
  ).position;
  TestValidator.predicate(
    "the ball reaches the receiver's side of the court",
    position.z > 3 && position.z < 4,
  );
}

/** The paired throw starts together and lowers the receiver to the mat. */
function checkThrow({ performance: mat }: PlaygroundPerformance.IBuilt): void {
  const initiator: IAutoMovieMotionHumanSegment = mat
    .segments("tor")
    .find((segment) => segment.name === "grapple")!;
  const receiver: IAutoMovieMotionHumanSegment = mat
    .segments("uke")
    .find((segment) => segment.name === "grapple")!;
  TestValidator.predicate(
    "the roles start in sync",
    Math.abs(initiator.start - receiver.start) < 1e-6,
  );
  const standing: number = mat.bones("uke", 0).get("hips")!.worldPosition.y;
  const settled: number = mat.bones("uke", receiver.end).get("hips")!
    .worldPosition.y;
  TestValidator.predicate(
    "the receiver settles below half their standing hip height",
    settled < standing / 2,
  );
}

/** The wrestlers clear one another and return to their entry height. */
function checkReset({
  performance: reset,
  figures,
}: PlaygroundPerformance.IBuilt): void {
  const [red, blue]: IAutoMovieMotionHumanSignature.IReader[] = figures.map(
    (
      figure: PlaygroundPerformance.IFigure,
    ): IAutoMovieMotionHumanSignature.IReader =>
      HumanSignature.of(
        reset,
        figure.subject,
        PlaygroundBodies.get(figure.body).body,
        0,
      ),
  );
  const exchange: IAutoMovieMotionHumanSegment = reset.segments("red").at(-1)!;
  const seconds: Set<number> = new Set([
    ...HumanSignature.times(0, reset.duration, 30),
    ...exchange.plan.events.map(
      (event): number => exchange.start + event.share * exchange.plan.duration,
    ),
    reset.duration,
  ]);
  const clearance: number = Math.min(
    ...Array.from(seconds, (t: number): number =>
      HumanSignature.apart(red!, blue!, t),
    ),
  );
  TestValidator.predicate(
    `the wrestling pair has at most 10 mm joint intrusion (clearance ${clearance} m)`,
    clearance >= -0.01,
  );
  for (const actor of [red, blue]) {
    /** Height of the head above the hip joint, from a single sampled pose. */
    const height = (at: number): number => {
      const bones: ReturnType<typeof HumanSignature.bones> =
        HumanSignature.bones(actor!, at);
      return (
        bones.get("head")!.worldPosition.y - bones.get("hips")!.worldPosition.y
      );
    };
    TestValidator.predicate(
      "the wrestler recovers their upright head-to-hip height",
      Math.abs(height(reset.duration) - height(0)) <= 0.01,
    );
  }
}
