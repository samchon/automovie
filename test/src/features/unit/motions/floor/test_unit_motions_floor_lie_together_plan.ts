import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanLieTogether,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanColliders,
  HumanRefusal,
  lieDown,
  lieTogether,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";

/** How near the resting region stays to the partner's, metres. */
const NEAR: number = 0.015;

/** How far under the floor a bone may lie, metres. */
const FLOOR: number = 0.01;

/** How long the two lie together, seconds. */
const HOLD: number = 3;

/** How far from its settled place the performer lies down, metres. */
const NEARBY: number = 0.6;

/** How far a performer lying apart lies down, metres: out of reach. */
const APART: number = 1.2;

/** One way of lying together and the regions it brings together. */
interface IWay {
  way: IAutoMovieMotionHumanLieTogether.Way;
  partner: IAutoMovieMotionHumanLieDown.Position;
  own: IAutoMovieMotionHumanLieDown.Position;
  mine: AutoMovieHumanoidRegion;
  theirs: AutoMovieHumanoidRegion;
}

/**
 * `lieTogether`'s plan brings a lying body's resting region onto a lying
 * partner: the chest onto the partner's back (spooning), or the cheek onto the
 * partner's chest.
 *
 * The law reads most of the body record: its rig, pose resolution, chains,
 * projection, rest joints, measure, surfaces and profile, so the test builds
 * the stored body (humanFixtureBody).
 *
 * Scenarios, the average man with the small woman for each way:
 *
 * 1. Through the hold the resting region stays on the partner's region (or, on the
 *    chest, its surface) within 15 mm.
 * 2. No bone of the performer passes under the floor.
 * 3. A window rests the region on the partner.
 * 4. A performer lying out of reach is refused on `partner`.
 */
export async function test_unit_motions_floor_lie_together_plan(): Promise<void> {
  const a: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const b: IAutoMovieMotionHumanBody = await humanFixtureBody("f-small");
  const lying = (
    body: IAutoMovieMotionHumanBody,
    kind: IAutoMovieMotionHumanLieDown.Position,
    options: motionActionContext.IOptions = {},
    hold: number = 0.5,
  ): IAutoMovieMotionHumanActionPlan =>
    lieDown.plan(motionActionContext(body, { kind, hold }, options));
  const place = (
    body: IAutoMovieMotionHumanBody,
    plan: IAutoMovieMotionHumanActionPlan,
    name: AutoMovieHumanoidRegion,
    t: number,
  ): ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =>
    resolveAutoMovieHumanoidSurfaces.place(
      body.surfaces.regions[name],
      R.bones(body, plan, t).get(body.surfaces.regions[name].bone)!,
    );
  const flatten = (v: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.normalize({ x: v.x, y: 0, z: v.z });
  const scene = (
    w: IWay,
    apart: number,
  ): [
    IAutoMovieMotionHumanActionPlan,
    IAutoMovieMotionHumanActionPlan,
    number,
  ] => {
    const partner: IAutoMovieMotionHumanActionPlan = lying(
      b,
      w.partner,
      {},
      HOLD + 30,
    );
    const theirs: ReturnType<typeof place> = place(
      b,
      partner,
      w.theirs,
      partner.duration,
    );
    const out: IAutoMovieVector3 =
      w.way === "chest"
        ? ((): IAutoMovieVector3 => {
            const left: IAutoMovieVector3 = place(
              b,
              partner,
              "shoulderLeft",
              partner.duration,
            ).point;
            const right: IAutoMovieVector3 = place(
              b,
              partner,
              "shoulderRight",
              partner.duration,
            ).point;
            const leftward: IAutoMovieVector3 = flatten(
              Vector3.subtract(left, right),
            );
            return w.theirs === "chestLeft"
              ? leftward
              : Vector3.scale(leftward, -1);
          })()
        : flatten(theirs.normal);
    const yaw: number =
      w.way === "chest" ? (Math.atan2(out.x, out.z) * 180) / Math.PI : 0;
    const alone: IAutoMovieMotionHumanActionPlan = lying(a, w.own, { yaw });
    const mine: IAutoMovieVector3 = place(
      a,
      alone,
      w.mine,
      alone.duration,
    ).point;
    const at: IAutoMovieVector3 = {
      x: theirs.point.x + out.x * apart - mine.x,
      y: 0,
      z: theirs.point.z + out.z * apart - mine.z,
    };
    const down: IAutoMovieMotionHumanActionPlan = lying(a, w.own, {
      at,
      yaw,
      start: 3,
    });
    const start: number = 3 + down.duration;
    const together: IAutoMovieMotionHumanActionPlan = lieTogether.plan(
      motionActionContext.after(
        a,
        down,
        { partner: "b", way: w.way, hold: HOLD },
        { start, partners: [{ subject: "b", body: b, plan: partner }] },
      ),
    );
    return [together, partner, start];
  };
  const ways: readonly IWay[] = [
    {
      way: "spoon",
      partner: "lateralLeft",
      own: "lateralLeft",
      mine: "sternum",
      theirs: "upperBack",
    },
    {
      way: "chest",
      partner: "supine",
      own: "lateralRight",
      mine: "cheekRight",
      theirs: "chestLeft",
    },
  ];
  for (const w of ways) {
    const [plan, partner, start] = scene(w, NEARBY);
    const from: number = R.event(plan, "settled")!;
    const raised: number =
      w.way === "spoon"
        ? place(a, lying(a, w.own), w.mine, lying(a, w.own).duration).point.y -
          place(b, lying(b, w.partner), w.theirs, lying(b, w.partner).duration)
            .point.y
        : 0;
    const misses: number[] = [0, 0.5, 1].map((k: number): number => {
      const t: number = from + k * (plan.duration - from);
      const mine: IAutoMovieVector3 = place(a, plan, w.mine, t).point;
      if (w.way === "chest")
        return Math.abs(
          HumanColliders.distance(b, R.bones(b, partner, start + t), mine)
            .distance,
        );
      const theirs: IAutoMovieVector3 = place(
        b,
        partner,
        w.theirs,
        start + t,
      ).point;
      return Vector3.distance(mine, { ...theirs, y: theirs.y + raised });
    });
    TestValidator.predicate(
      `${w.way}: rests on the partner (${misses.join(", ")} m)`,
      misses.every((m: number): boolean => m <= NEAR),
    );
    TestValidator.predicate(
      `${w.way}: on the floor`,
      [from, plan.duration].every((t: number): boolean =>
        [...R.bones(a, plan, t).values()].every(
          (bone: IAutoMovieResolvedBone): boolean =>
            bone.worldPosition.y >= -FLOOR,
        ),
      ),
    );
    TestValidator.predicate(
      `${w.way}: bears on the partner`,
      plan.contacts.some(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.support.kind === "person" && c.support.subject === "b",
      ),
    );
  }
  let refused: unknown;
  try {
    scene(ways[0]!, APART);
  } catch (error: unknown) {
    refused = error;
  }
  TestValidator.predicate(
    "lying out of reach is refused",
    refused instanceof HumanRefusal && refused.axis === "partner",
  );
}
