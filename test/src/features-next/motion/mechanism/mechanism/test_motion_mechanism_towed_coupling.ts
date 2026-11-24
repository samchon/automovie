import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRide,
  AutoMovieArchetypeUnits,
} from "@automovie/archetypes";
import { Vector3, integrateMotionTrajectory } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** The coupling's reach ahead of the trailer's axle, metres. */
const REACH: number = 2;

/**
 * A fixture: a box on the floor with one hook.
 *
 * @param id The hook's id.
 * @param z Where the hook stands along `Z`, metres.
 * @returns The fixture.
 */
function hooked<Id extends string>(
  id: Id,
  z: number,
): AutoMovieArchetype<Id, never> {
  return new AutoMovieArchetypeBuilder<Id, never>({
    material: "steel",
    name: id,
    draw: new AutoMovieArchetypeDrawSession<never>("fixture", {}, undefined),
  })
    .box("body", Vector3.create(1, 0.5, 1), Vector3.create(0, 0.25, 0))
    .affordance({
      id,
      kind: "hook",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0.5, z)),
      extent: null,
    })
    .build(100);
}

/**
 * A trailer towed through a turn keeps its coupling on the hitch, cuts inside the hitch's path, and straightens behind the leader after it.
 *
 * Scenarios, for a trailer whose coupling stands 2 m ahead of its axle, hitched 1.5 m behind a leader driven 20 m straight, a quarter turn to the left of 10 m radius and 30 m straight:
 * 1. At 400 seconds of the ride the trailer's coupling is on the leader's hitch within 1e-6 m.
 * 2. Through the second half of the turn the trailer's axle runs nearer the turn's centre than the hitch does, off-tracking inward.
 * 3. Once the hitch is three coupling lengths into the last straight, the trailer's heading is the leader's within 1 degree, and before the integration step that holds the turn's start it is the leader's exactly (the fixed step reads across the kink within that step).
 * 4. Reading the ride at 24 and at 60 frames a second gives the same placement at shared instants.
 * 5. A coupling behind the axle is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Tows a trailer behind a leader's ride and reads both placements; a trailer that drifts off its hitch, swings outward, never straightens, or depends on the reading grid, or a pushed trailer admitted, is caught.
 * @evidence contracts/development/testing.md#independent-expectations The kinematic single-axle trailer: its axle runs inside its hitch's path in a steady turn (off-tracking) and its heading error decays by e to the minus distance over the coupling's reach on a straight, three reaches bringing a quarter-turn error under a degree; the hitch's place is the leader ride's own frame.
 * @evidence contracts/development/testing.md#distinguishing-cases A straight, a turn and the straight after, two frame rates and a refused coupling; wagons and drawn carts belong to their producers' tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_motion_mechanism_towed_coupling(): void {
  const findings: string[] = [];
  const course: AutoMovieArchetypeCourse.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 20 },
      { kind: "turn", radius: 10, angle: 90 },
      { kind: "straight", length: 30 },
    ],
    cruise: 3,
    acceleration: 1,
    deceleration: 1,
  };
  const leader: AutoMovieArchetypeRide.IRide<"hitch", never> =
    AutoMovieArchetypeRide.along(hooked("hitch", -1.5), course);
  const trailer: AutoMovieArchetype<"coupling", never> = hooked(
    "coupling",
    REACH,
  );
  const towed: AutoMovieArchetypeRide.IRide<"coupling", never> =
    AutoMovieArchetypeRide.towed(leader, "hitch", trailer, "coupling");
  const headingOf = (
    frame: Parameters<typeof AutoMovieArchetypeFrame.axis>[0],
  ): number => {
    const z: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(frame, "z");
    return Math.atan2(z.x, z.z) / AutoMovieArchetypeUnits.DEGREE;
  };
  const turnStart: number = leader.plan.when(20);
  const turnEnd: number = leader.plan.when(20 + 5 * Math.PI);
  const centre: IAutoMovieVector3 = { x: 10, y: 0, z: 20 };
  const phaseTimes = [
    0,
    turnStart / 2,
    turnStart,
    (turnStart + turnEnd) / 2,
    turnStart + ((turnEnd - turnStart) * 3) / 4,
    turnEnd,
    towed.duration,
  ];
  for (const t of phaseTimes) {
    const hitch: IAutoMovieVector3 = leader.frame("hitch", t).translation;
    const coupling: IAutoMovieVector3 = towed.frame("coupling", t).translation;

    // 1. On the hitch.
    if (Vector3.length(Vector3.subtract(hitch, coupling)) > 1e-6)
      findings.push(`off the hitch at ${t} s`);

    // 2. Off-tracking inward through the turn's second half.
    const axle: IAutoMovieVector3 = towed.at(t).placement.translation;
    const flat = (p: IAutoMovieVector3): number =>
      Math.hypot(p.x - centre.x, p.z - centre.z);
    if (
      t > (turnStart + turnEnd) / 2 &&
      t < turnEnd &&
      !(flat(axle) < flat(hitch))
    )
      findings.push(`the axle swings outside the hitch at ${t} s`);

    // 3. Aligned before the turn, straightened after it.
    const lead: number = headingOf(leader.at(t).placement);
    const trail: number = headingOf(towed.at(t).placement);
    if (
      t < turnStart - integrateMotionTrajectory.STEP &&
      Math.abs(trail - lead) > 1e-6
    )
      findings.push(`misaligned before the turn at ${t} s`);
    if (
      leader.at(t).course.distance > 20 + 5 * Math.PI + 1.5 + 3 * REACH &&
      Math.abs(trail - lead) > 1
    )
      findings.push(
        `still ${trail - lead} degrees off after the turn at ${t} s`,
      );
  }

  // 4. Frame-rate invariance.
  for (let k: number = 0; k * 5 <= towed.duration * 60; k++) {
    const a: string = JSON.stringify(towed.at((k * 2) / 24).placement);
    const b: string = JSON.stringify(towed.at((k * 5) / 60).placement);
    if (a !== b) findings.push(`frame grids disagree at ${k / 12} s`);
  }

  // 5. A pushed trailer.
  let thrown: unknown = null;
  try {
    AutoMovieArchetypeRide.towed(
      leader,
      "hitch",
      hooked("coupling", -1),
      "coupling",
    );
  } catch (error) {
    thrown = error;
  }
  if (
    !(thrown instanceof AutoMovieArchetypeRefusal) ||
    thrown.axis !== "coupling"
  )
    findings.push(`a coupling behind the axle: ${String(thrown)}`);
  TestValidator.equals("a towed trailer tracks its hitch", findings, []);
}
