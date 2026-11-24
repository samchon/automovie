import { createStairs } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClimbStairs,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanFoot,
  HumanHand,
  HumanRefusal,
  climbStairs,
  poseBones,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";

/** The disc's turning rate, degrees per second: a roundabout turned slowly for boarding. */
const RATE: number = 8;

/** The disc's centre, world metres: the step's deck lies at its rim. */
const CENTRE: IAutoMovieVector3 = { x: 0, y: 0, z: 2 };

/** A grounded foot's largest travel over its plant, metres: the plant audit's 5 mm. */
const STILL: number = 0.005;

/** How far the grip socket may stand off the finite rail, metres. */
const RAIL: number = 0.018;

/** How far the grip slides along the rail at least, metres. */
const SLIDE: number = 0.25;

/** Samples of the rail grip. */
const SAMPLES: number = 30;

/**
 * `climbStairs`'s plan climbs a flight on its treads: a hand named on a rail
 * bears on it and slides along it, a rail beyond the hand's reach is refused,
 * and a flight on a moving prop carries the feet on its treads while the foot
 * on the floor stays in the world.
 *
 * The law reads most of the body record: its rig, pose resolution, chains,
 * projection, rest joints, measure, surfaces and profile, so the test builds
 * the stored body (`humanFixtureBody`).
 *
 * Scenarios, on both stored bodies, the climb starting where the standing toes
 * reach the first riser:
 *
 * 1. Four steps of 0.17 by 0.28 m with the left hand on the left rail: the left
 *    hand's window is a loaded grip on the stairs, its grip socket stays within
 *    18 mm of the finite rail and slides more than 25 cm along it, and it lets
 *    go before the climb ends.
 * 2. The right rail with the left hand is refused on `rail.point`, naming it.
 * 3. One step onto a disc's deck turning 8 degrees a second: each foot planted
 *    on the floor stays within 5 mm in the world, and each planted on the deck
 *    within 5 mm in the disc's frame.
 */
export async function test_unit_motions_terrain_climb_stairs_plan(): Promise<void> {
  for (const name of humanFixture.NAMES) {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody(name);
    const start = (at: IAutoMovieVector3): number => {
      const bones: ReturnType<typeof poseBones> = poseBones(
        body,
        motionActionContext(body, {}, { at }).entry.pose,
      );
      return -Math.max(
        HumanFoot.sockets(body, bones, "left")[2]!.point.z,
        HumanFoot.sockets(body, bones, "right")[2]!.point.z,
      );
    };

    // 1. The rail.
    const model = createStairs({
      steps: 4,
      riser: 0.17,
      tread: 0.28,
      occupancy: "under50",
      rail: "both",
    });
    const stairs: IAutoMovieMotionHumanProp = HumanObject.prop("stairs", model, {
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      fixed: true,
    });
    const rail: IAutoMovieAffordance = model.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === "leftRail",
    )!;
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(rail.frame.rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    const at: IAutoMovieVector3 = { x: 0.19, y: 0, z: -0.42 };
    const context = (point: string): IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanClimbStairs.IParams> =>
      motionActionContext(
        body,
        {
          count: 4,
          riser: 0.17,
          tread: 0.28,
          start: start(at),
          on: "stairs",
          rail: { point, hand: "left" as const },
        },
        { at, props: [stairs], seed: "stair-rail" },
      );
    const plan: IAutoMovieMotionHumanActionPlan = climbStairs.plan(context(rail.id));
    const hand: IAutoMovieMotionHumanContactWindow | undefined = plan.contacts.find(
      (c: IAutoMovieMotionHumanContactWindow): boolean => c.part === "leftHand",
    );
    TestValidator.predicate(
      `${name}: a loaded grip on the stairs`,
      hand?.kind === "grip" &&
        hand.support.kind === "prop" &&
        hand.support.subject === "stairs" &&
        (hand.load ?? 0) > 0,
    );
    if (hand !== undefined) {
      let worst: number = 0;
      const along: number[] = [];
      for (let i: number = 0; i <= SAMPLES; ++i) {
        const share: number = hand.from + ((hand.to - hand.from) * i) / SAMPLES;
        const socket: IAutoMovieVector3 = HumanHand.frame(
          body,
          R.bones(body, plan, share * plan.duration),
          "left",
          "grip",
        ).point;
        const out: IAutoMovieVector3 = Vector3.subtract(socket, rail.frame.translation);
        const d: number = Vector3.dot(out, axis);
        along.push(d);
        const clamped: number = Math.max(-rail.length! / 2, Math.min(rail.length! / 2, d));
        worst = Math.max(worst, Vector3.length(Vector3.subtract(out, Vector3.scale(axis, clamped))));
      }
      TestValidator.predicate(
        `${name}: the grip rides the rail (${worst} m off)`,
        worst <= RAIL && along[SAMPLES]! - along[0]! > SLIDE,
      );
      TestValidator.predicate(`${name}: lets go before the end`, hand.to < 1);
    }

    // 2. The far rail.
    const refusal: unknown = (() => {
      try {
        climbStairs.plan(context("rightRail"));
      } catch (error: unknown) {
        return error;
      }
      return undefined;
    })();
    TestValidator.predicate(
      `${name}: the far rail refused`,
      refusal instanceof HumanRefusal &&
        refusal.axis === "rail.point" &&
        refusal.value === "rightRail",
    );

    // 3. The turning disc.
    const placed = (seconds: number): IAutoMovieMotionHumanObject.Placement => {
      const a: number = (RATE * seconds * Math.PI) / 180;
      return {
        at: { x: CENTRE.x - Math.sin(a) * CENTRE.z, y: 0, z: CENTRE.z - Math.cos(a) * CENTRE.z },
        yaw: RATE * seconds,
      };
    };
    const deck: IAutoMovieMotionHumanProp = HumanObject.prop(
      "deck",
      createStairs({ steps: 2, riser: 0.17, tread: 0.3 }),
      placed(0),
      placed,
    );
    const from: IAutoMovieVector3 = { x: 0, y: 0, z: -0.45 };
    const step: IAutoMovieMotionHumanActionPlan = climbStairs.plan(
      motionActionContext(
        body,
        { count: 1, riser: 0.17, tread: 0.3, start: start(from), on: "deck" },
        { at: from, props: [deck], seed: "stair-disc" },
      ),
    );
    const local = (q: IAutoMovieVector3, seconds: number): IAutoMovieVector3 => {
      const r: number = (-RATE * seconds * Math.PI) / 180;
      const dx: number = q.x - CENTRE.x;
      const dz: number = q.z - CENTRE.z;
      return { x: dx * Math.cos(r) + dz * Math.sin(r), y: q.y, z: -dx * Math.sin(r) + dz * Math.cos(r) };
    };
    for (const w of step.contacts) {
      if ((w.part !== "leftFoot" && w.part !== "rightFoot") || w.kind !== "plant") continue;
      const a: number = w.from * step.duration;
      const b: number = Math.min(w.to, 1) * step.duration;
      if (!(b > a)) continue;
      const toes = (t: number): IAutoMovieVector3 =>
        R.bones(body, step, t).get(w.part === "leftFoot" ? "leftToes" : "rightToes")!.worldPosition;
      const grounded: boolean = w.support.kind === "ground";
      const p: IAutoMovieVector3 = grounded ? toes(a) : local(toes(a), a);
      const q: IAutoMovieVector3 = grounded ? toes(b) : local(toes(b), b);
      const moved: number = Math.hypot(q.x - p.x, q.z - p.z);
      TestValidator.predicate(
        `${name}: the ${w.part} ${grounded ? "on the floor" : "on the deck"} holds (${moved} m)`,
        moved <= STILL,
      );
    }
  }
}
