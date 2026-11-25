import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanLeg,
  AutoMovieMotionHumanLegPhrase,
  HumanFoot,
  HumanFrame,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * How near a written foot lands on its goal, metres: five millimetres, the leg
 * fit's reach through its range-projected chain on a resolved stance.
 */
const REACH: number = 0.005;

/** A 2 s phrase clock: ready, stroke start, stroke, stroke end, relax. */
const CLOCK: IAutoMovieMotionClock = AutoMovieMotionClock(2, [
  { name: "ready", seconds: 0.25 },
  { name: "strokeStart", seconds: 0.5 },
  { name: "stroke", seconds: 1 },
  { name: "strokeEnd", seconds: 1.25 },
  { name: "relax", seconds: 1.5 },
]);

/**
 * The leg primitives keep a foot where its contact puts it: `plant` holds the
 * foot's world place while the body moves over it; `place` puts it on a world
 * target; `step` departs its stance, clears the floor by its height at
 * mid-swing and lands on its target; the leg phrases lift a foot by its
 * excursion and return it while the other foot bears, pivot it about its ball
 * so the ball stays and the heel sweeps the chord `2 r sin(θ / 2)`, and tap a
 * target between two clear arcs.
 *
 * The body is built whole (`humanFixtureBody`): every foot is read through the
 * body's own fit and forward kinematics. The average man stands at (1, 0, 2)
 * heading 90 degrees, his left foot's stance where it stands.
 *
 * Scenarios:
 *
 * 1. Planted, the left ankle stays on its stance at 0, 1 and 2 s while the pelvis
 *    lowers 2 cm a second.
 * 2. Placed on a target 5 cm ahead in the body's frame, it lies there.
 * 3. Stepping 5 cm along +X with a 4 cm clearance: it departs and lands on its
 *    marks, and mid-swing it is 4 cm over the chord's middle, advancing.
 * 4. Lifted 5 cm, it peaks 5 cm up and returns; the right foot stays at its goal.
 * 5. Pivoted 15 degrees about its ball, the ball stays and the heel moves by the
 *    chord, then returns.
 * 6. Tapping 5 cm along +X with a 4 cm clearance: it touches the target at the
 *    stroke, and is clear of it on the way out and back.
 */
export async function test_unit_motions_compose_human_leg(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const base: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 1, y: 0, z: 2 }, 90);
  const stance: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: base.limbs.leftLeg!.point,
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  };
  const along = (
    dx: number,
    dy: number,
  ): IAutoMovieMotionHumanFoot.IPlacement => ({
    ...stance,
    ankle: { ...stance.ankle, x: stance.ankle.x + dx, y: stance.ankle.y + dy },
  });
  const foot = (
    primitive: IAutoMovieMotionHumanPrimitive,
    t: number,
    posture: IAutoMovieMotionHumanPosture = base,
  ): IAutoMovieMotionHumanFoot.IPlacement => {
    const bone: IAutoMovieResolvedBone = poseBones(
      body,
      resolveHumanPosture(body, primitive.write(posture, t)),
    ).get("leftFoot")!;
    return { ankle: bone.worldPosition, rotation: bone.worldRotation };
  };

  // 1. A plant.
  const plant: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLeg.plant(
    body,
    CLOCK,
    "left",
    ["start", "end"],
    stance,
  );
  TestValidator.predicate(
    "the planted foot holds its place",
    [0, 1, 2].every((t: number): boolean =>
      vclose(
        foot(plant, t, {
          ...base,
          root: { ...base.root, y: base.root.y - 0.02 * t },
        }).ankle,
        stance.ankle,
        REACH,
      ),
    ),
  );

  // 2. A placement.
  const target: IAutoMovieMotionHumanFoot.IPlacement = {
    ...stance,
    ankle: HumanFrame.point(
      { origin: stance.ankle, yaw: base.yaw },
      { x: 0, y: 0, z: 0.05 },
    ),
  };
  const place: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLeg.place({
    body,
    side: "left",
    from: 0,
    to: 2,
    placement: (): IAutoMovieMotionHumanFoot.IPlacement => target,
    planted: (): boolean => false,
  });
  TestValidator.predicate(
    "the placed foot on its target",
    vclose(foot(place, 1).ankle, along(0.05, 0).ankle, REACH),
  );

  // 3. A step.
  const step: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLeg.step(
    body,
    CLOCK,
    "left",
    ["start", "end"],
    stance,
    along(0.05, 0),
    0.04,
  );
  const start: IAutoMovieVector3 = foot(step, 0).ankle;
  const mid: IAutoMovieVector3 = foot(step, 1).ankle;
  const end: IAutoMovieVector3 = foot(step, 2).ankle;
  TestValidator.predicate(
    "the step departs, clears and lands",
    vclose(start, stance.ankle, REACH) &&
      vclose(end, along(0.05, 0).ankle, REACH) &&
      nclose(mid.y, (start.y + end.y) / 2 + 0.04, REACH) &&
      start.x < mid.x &&
      mid.x < end.x,
  );

  // 4. A lift.
  const lift: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanLegPhrase.lift({
      body,
      side: "left",
      clock: CLOCK,
      stance,
      raised: (): IAutoMovieMotionHumanFoot.IPlacement => along(0, 0.05),
    });
  TestValidator.predicate(
    "the lift rises and returns over the other foot",
    nclose(foot(lift, 1).ankle.y - stance.ankle.y, 0.05, REACH) &&
      vclose(foot(lift, 2).ankle, stance.ankle, REACH) &&
      vclose(
        poseBones(body, resolveHumanPosture(body, lift.write(base, 1))).get(
          "rightFoot",
        )!.worldPosition,
        base.limbs.rightLeg!.point,
        REACH,
      ),
  );

  // 5. A pivot.
  const pivot: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanLegPhrase.pivot({
      body,
      side: "left",
      clock: CLOCK,
      stance,
      about: "ball",
      turn: 15,
      pitch: 0,
    });
  const sole = (t: number, socket: "ball" | "heel"): IAutoMovieVector3 =>
    HumanFoot.point(body, "left", socket, foot(pivot, t));
  const flat = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.z - b.z);
  const ball: IAutoMovieVector3 = sole(0, "ball");
  const heel: IAutoMovieVector3 = sole(0, "heel");
  TestValidator.predicate(
    "the ball stays and the heel sweeps its chord",
    vclose(sole(1, "ball"), ball, REACH) &&
      nclose(
        flat(sole(1, "heel"), heel),
        2 * flat(ball, heel) * Math.sin((15 * Math.PI) / 360),
        REACH,
      ) &&
      vclose(sole(2, "heel"), heel, REACH),
  );

  // 6. A tap.
  const tap: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLegPhrase.tap(
    {
      body,
      side: "left",
      clock: CLOCK,
      stance,
      target: (): IAutoMovieMotionHumanFoot.IPlacement => along(0.05, 0),
      clearance: 0.04,
      contact: { kind: "plant", support: { kind: "ground" } },
    },
  );
  TestValidator.predicate(
    "the tap touches between clear arcs",
    vclose(foot(tap, 1).ankle, along(0.05, 0).ankle, REACH) &&
      foot(tap, 0.5).ankle.y > stance.ankle.y + REACH &&
      foot(tap, 1.75).ankle.y > stance.ankle.y + REACH,
  );
}
