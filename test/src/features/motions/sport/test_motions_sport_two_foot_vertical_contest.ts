import {
  AutoMovieEngineGravity,
  AutoMovieEngineKinematics,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanJump,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
} from "@automovie/motions";
import assert from "node:assert/strict";

import { AutoMovieMotionHumanAuditTangle } from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditTangle";
import { HumanFoot } from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import { poseBones } from "../../../../../packages/motions/src/posture/internal/poseBones";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/**
 * A vertical contest drives from both real floor placements and lands on both.
 *
 * The test reads native whole-body pose, centre of mass, foot geometry and
 * collision measurements. It also observes the existing one-foot push and
 * preserves its refusal after an airborne approach cut.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bodily, ballistic and foot-contact outcomes and the existing airborne refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the shipped contest and jump through a stock body's normal typed chain. Reads actual foot poses, contact windows, hand heights, mass-centre samples and native tangle.
 * @evidence contracts/development/testing.md#independent-expectations Uses gravity and authored apex for flight. Fixed ground geometry and numerical acceleration of the displayed centre give the support and reaction checks.
 */
export async function test_motions_sport_two_foot_vertical_contest(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const verticalContest = AutoMovieMotionHumanJump.verticalContest;
  const Chain = AutoMovieMotionHumanChain.extend({ verticalContest });
  const at: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const ready = Chain.subject("a").stand({ hold: 0.3 }, "stance");
  const resolve = (chain: typeof ready): AutoMovieMotionHumanPerformance =>
    new AutoMovieMotionHumanPerformance({
      seed: "court-witness",
      performers: [
        { subject: "a", body, at, yaw: 0, proficiency: { level: "elite" } },
      ],
      composition: chain.node,
      laws: [verticalContest],
    });

  const apex = 0.17;
  const take = resolve(
    ready.verticalContest({ apex }, "vertical").stand({ hold: 0.15 }),
  );
  const jump = take.segments("a").find((each) => each.id === "vertical")!;
  const event = (name: string): number =>
    jump.start +
    jump.plan.duration *
      jump.plan.events.find((each) => each.name === name)!.share;
  const drive = event("drive");
  const off = event("takeoff");
  const peak = event("apex");
  const down = event("touchdown");
  const settled = event("settled");
  assert.ok(
    jump.start < drive &&
      drive < off &&
      off < peak &&
      peak < down &&
      down < settled,
  );
  const plant = jump.plan.contacts.filter((each) => each.kind === "plant");
  assert.deepEqual(
    plant.map((each) => each.part),
    ["leftFoot", "rightFoot", "leftFoot", "rightFoot"],
  );
  assert.ok(
    plant.every((each) => each.support.kind === "ground" && each.load === 0.5),
  );
  assert.deepEqual(
    plant.slice(0, 2).map((each) => jump.start + each.to * jump.plan.duration),
    [off, off],
  );
  assert.deepEqual(
    plant.slice(2).map((each) => jump.start + each.from * jump.plan.duration),
    [down, down],
  );

  const sample = (seconds: number) => {
    const bones = poseBones(body, take.pose("a", seconds));
    const contact = (side: "left" | "right", part: "heel" | "mtp") => {
      const foot = bones.get(`${side}Foot`)!;
      return HumanFoot.point(body, side, part, {
        ankle: foot.worldPosition,
        rotation: foot.worldRotation,
      });
    };
    return {
      centre: AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
        body.massModel,
        bones,
      ),
      left: contact("left", "mtp"),
      right: contact("right", "mtp"),
      heel: Math.min(contact("left", "heel").z, contact("right", "heel").z),
      crown: bones.get("head")!.worldPosition.y,
      arms: [
        bones.get("leftHand")!.worldPosition.y,
        bones.get("rightHand")!.worldPosition.y,
      ],
    };
  };
  const standing = sample(jump.start);
  const step = 0.001;
  const g = AutoMovieEngineGravity.STANDARD;
  for (const [from, to] of [
    [jump.start, off],
    [down, settled],
  ] as const)
    for (let i = 1; i < 13; ++i) {
      const at = from + ((to - from) * i) / 13;
      const current = sample(at);
      const backward = sample(at - step).centre;
      const forward = sample(at + step).centre;
      const support =
        (g + (forward.y - 2 * current.centre.y + backward.y) / step ** 2) / 2;
      assert.ok(support > 0);
      assert.ok(nclose(current.centre.z, standing.centre.z, 1e-7));
      assert.ok(
        current.centre.z > current.heel &&
          current.centre.z < Math.max(current.left.z, current.right.z),
      );
      assert.ok(
        nclose(current.centre.x, (current.left.x + current.right.x) / 2, 1e-6),
      );
      assert.ok(
        AutoMovieEngineVector3.distance(current.left, standing.left) < 1e-5,
      );
      assert.ok(
        AutoMovieEngineVector3.distance(current.right, standing.right) < 1e-5,
      );
    }

  const leaving = sample(off);
  const top = sample(peak);
  const landing = sample(down);
  assert.ok(nclose(top.centre.y - leaving.centre.y, apex, 1e-10));
  assert.ok(nclose(landing.centre.y, leaving.centre.y, 1e-10));
  assert.ok(top.arms.every((height) => height > top.crown + 0.1));
  for (const seconds of [off, down]) {
    const centre = sample(seconds).centre;
    const a = sample(seconds - step).centre;
    const b = sample(seconds + step).centre;
    assert.ok(nclose((b.y - centre.y) / step, (centre.y - a.y) / step, 0.01));
    assert.ok(nclose(a.z, b.z, 1e-7));
  }
  const interval = 0.05;
  assert.ok(
    nclose(
      (sample(peak - interval).centre.y +
        sample(peak + interval).centre.y -
        2 * top.centre.y) /
        interval ** 2,
      -g,
      1e-9,
    ),
  );
  assert.equal(
    AutoMovieMotionHumanAuditTangle.measure(take, "a", body, 42).worst.value,
    0,
  );

  const legacy = resolve(
    ready.jump({ to: { x: 0, y: 0, z: 0.04 }, apex }, "oneFoot"),
  );
  const ordinary = legacy.segments("a").find((each) => each.id === "oneFoot")!;
  assert.equal(
    ordinary.plan.contacts.filter(
      (each) => each.kind === "plant" && each.from === 0,
    ).length,
    1,
  );

  const incoming = ready.run(
    { to: { x: 0, y: 0, z: 3.5 }, pace: "jog", manner: { pace: 0.7 } },
    "approach",
  );
  const approach = resolve(incoming).segments("a").at(-1)!;
  const ground = approach.plan.contacts.filter(
    (each) => each.kind === "plant" && each.part.endsWith("Foot"),
  );
  const gap = Array.from({ length: 100 }, (_, i) => (i + 1) / 101).find(
    (share) =>
      share > 0.3 &&
      share < 0.7 &&
      !ground.some((each) => each.from <= share && share < each.to),
  );
  assert.ok(gap !== undefined);
  const cut = incoming.until({ type: "share", share: gap });
  assert.throws(
    () => resolve(cut.jump({ to: { x: 0, y: 0, z: 2 }, apex })),
    (error) => {
      assert.ok(error instanceof AutoMovieMotionHumanRefusal);
      assert.equal(error.kind, "base");
      assert.ok(error.reason.includes("run"));
      assert.ok(
        error.reason.includes("left foot") ||
          error.reason.includes("right foot"),
      );
      assert.ok(typeof error.value === "number");
      const from =
        error.feasible?.kind === "range" ? error.feasible.minimum : null;
      const to =
        error.feasible?.kind === "range" ? error.feasible.maximum : null;
      assert.ok(from !== null && to !== null);
      const duration = approach.plan.duration;
      const requested = gap * duration;
      assert.ok(nclose(error.value, requested, 1e-10));
      const intervals = ground.map(
        (each) => [each.from * duration, each.to * duration] as const,
      );
      const distance = (start: number, finish: number): number =>
        Math.max(start - requested, requested - finish, 0);
      assert.ok(
        intervals.some(
          ([start, finish]) =>
            nclose(start, from, 1e-10) && nclose(finish, to, 1e-10),
        ),
      );
      assert.ok(
        nclose(
          distance(from, to),
          Math.min(
            ...intervals.map(([start, finish]) => distance(start, finish)),
          ),
          1e-10,
        ),
      );
      return true;
    },
  );
  assert.throws(
    () => resolve(cut.verticalContest({ apex })),
    (error) =>
      error instanceof AutoMovieMotionHumanRefusal && error.kind === "base",
  );
}
