import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanCoupled,
  HumanForceExchange,
  HumanPerformance,
  HumanSignature,
  type IHumanBody,
  clinch,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Every grip of a throw holds until the release (#3439's acceptance: "every
 * grip slips under the grip bound in the partner's frame until release"):
 * through the o-goshi record (`HumanCoupled.throwing`), the thrower's
 * collar-and-sleeve hands (`clinch`) stay on the thrown body's regions while
 * the pull draws it off its base and the throw turns it.
 *
 * The bound is 10 mm (#3349's contact bound, the grip bound the campaign
 * holds), read as the hand's travel in the frame of the gripped region's
 * bone, so a body that moves carries the grip with it.
 *
 * Scenarios, the small woman throwing the large man, the pull his own
 * weight on his collar and sleeve from 0.3 s:
 * 1. Each hand's palm moves less than 10 mm in its gripped region's bone
 *    frame through its grip window, as the clinch declares it, until the
 *    release.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the throw record through the public chain with the force input and reads both displayed bodies; a hand that slides off its grip before the release fails with its slip.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the campaign's; the hands and the regions are read from the displayed bones, never from the clinch's goals.
 * @evidence contracts/development/testing.md#distinguishing-cases Both hands of one grip on the pair of opposite builds the throw is hardest for.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one performance; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the bound with its source and the 1 scenario.
 */
export function test_human_motion_force_exchange_grips(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const START: number = 0.3;
  const SITES: readonly AutoMovieHumanoidRegion[] = ["chestLeft", "elbowRight"];
  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const bodies: Record<"a" | "b", IHumanBody> = {
    a: motionHumanBody("f-small"),
    b: motionHumanBody("m-large"),
  };
  const model: resolveAutoMovieCenterOfMass.IModel =
    resolveAutoMovieCenterOfMass(bodies.b.skeleton, bodies.b.profile);
  const grips = clinch.regions("collarSleeve", "right");
  let gripped: HumanPerformance | null = null;
  try {
    gripped = new HumanPerformance({
      seed: "exchange",
      performers: (["a", "b"] as const).map((subject) => ({
        subject,
        body: bodies[subject],
        at: {
          x: 0,
          y: 0,
          z: subject === "a" ? bodies.b.measure.footLength : 0,
        },
        yaw: 0,
        proficiency: { level: "trained" as const },
      })),
      composition: HumanChain.mutual(
        HumanCoupled.throwing,
        {
          thrower: HumanChain.subject("a").stand({ seconds: START }),
          thrown: HumanChain.subject("b").stand({ seconds: START }),
        },
        { kind: "oGoshi", outcome: "thrown" },
      ).node,
      forces: HumanForceExchange.pull({
        subject: "b",
        sites: SITES,
        direction: forward,
        force: model.mass * AutoMovieGravity.STANDARD,
        from: START,
        to: START + 2,
      }),
    });
    gripped.segments("b");
  } catch (error) {
    all.check(
      `the o-goshi record: planned expected, refused with ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
    gripped = null;
  }
  if (gripped !== null) {
    const segments = gripped.segments("b");
    const response = segments[segments.length - 1]!;
    const release: number | undefined = response.plan.events.find(
      (e) => e.name === "release",
    )?.share;
    const until: number =
      release === undefined
        ? response.start + response.plan.duration
        : response.start + release * response.plan.duration;
    const thrower: HumanSignature.IReader = HumanSignature.of(
      gripped,
      "a",
      bodies.a,
      0,
    );
    const partner: HumanSignature.IReader = HumanSignature.of(
      gripped,
      "b",
      bodies.b,
      0,
    );
    // Each hand's grip window on the thrown body, as the thrower's clinch
    // declares it: the grip holds from its closing, not while the hand
    // still reaches.
    const clinched = gripped.segments("a")[gripped.segments("a").length - 1]!;
    for (const side of ["left", "right"] as const) {
      const region: AutoMovieHumanoidRegion = grips[side].region;
      const boneName = bodies.b.surfaces.regions[region].bone;
      const window = clinched.plan.contacts.find(
        (w) =>
          w.part === `${side}Hand` &&
          w.kind === "grip" &&
          w.support.kind === "person" &&
          w.support.subject === "b",
      );
      if (window === undefined) {
        all.check(
          `the o-goshi thrower's ${side} hand declares a grip on the thrown body`,
          false,
        );
        continue;
      }
      const from: number =
        clinched.start + window.from * clinched.plan.duration;
      const to: number = Math.min(
        until,
        clinched.start + window.to * clinched.plan.duration,
      );
      let first: IAutoMovieVector3 | null = null;
      let slip: number = 0;
      for (const t of HumanSignature.times(from, to, 60)) {
        const bone = HumanSignature.bones(partner, t).get(boneName)!;
        const hand: IAutoMovieVector3 = HumanSignature.region(
          thrower,
          side === "left" ? "palmLeft" : "palmRight",
          t,
        );
        const local: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(bone.worldRotation),
          Vector3.subtract(hand, bone.worldPosition),
        );
        first ??= local;
        slip = Math.max(slip, Vector3.length(Vector3.subtract(local, first)));
      }
      all.check(
        `the o-goshi thrower's ${side} hand slips ${(slip * 1000).toFixed(1)} mm on the thrown ${region} until release, 10 mm at most expected`,
        slip <= 0.01,
      );
    }
  }
  all.assert("every grip of a throw holds until the release");
}
