import {
  ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRefusal,
  type ArchetypeRide,
  createBicycle,
  createCar,
  driveCar,
  rideBicycle,
} from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/predicates";

/** A car's ride sample. */
type Sample = ArchetypeRide.ISample<createCar.Affordance, createCar.Dimension>;

/**
 * A reversed leg drives its support backward along the leg with its facing kept: a car backing out keeps facing the way it faced, and steers the other way for the same bend of its path.
 *
 * Scenarios:
 * 1. A car reversing 6 m from facing `+Z` ends 6 m behind its start, still facing `+Z`, at every sample on the way; its state says it is reversing and its speed is never negative.
 * 2. A car backing round a quarter turn of 8 m radius to the left keeps the leg's curvature sign, positive, and turns its steering wheel opposite to a forward turn of the same curvature, by the same amount; its facing turns by the leg's angle.
 * 3. A reversed leg's lean for a single-track vehicle is on the other side of the vehicle from a forward leg's at the same state.
 * 4. A bicycle on a reversed leg is refused at that leg's `reverse`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives a produced car backward and reads its root, its axes and its steering wheel; a support that turns round to reverse, a facing that drifts, a negative speed, a curvature whose sign flips, a steering wheel turned the forward way, or a bicycle allowed backward is caught.
 * @evidence contracts/development/testing.md#independent-expectations Reversing keeps the heading and moves along its opposite, so a straight back from the origin facing `+Z` ends at z = -6; a car's heading rate is v over L times the tangent of the road wheels' angle with v signed, so the same path curvature backward needs the opposite angle; the centripetal side of a path is fixed by its curvature, which a reversed vehicle has on its other hand.
 * @evidence contracts/development/testing.md#distinguishing-cases A straight and a turning reversed leg, a forward twin of the turn, and the bicycle that may not reverse; grades while reversing belong to `test_archetype_ride_course_grade`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models and plans, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_ride_course_reverse(): void {
  const findings: string[] = [];
  const car: ReturnType<typeof createCar> = createCar({ kind: "sedan" }, 5);
  const base: Omit<ArchetypeCourse.ICourse, "legs"> = {
    start: { x: 0, z: 0, heading: 0 },
    cruise: 2,
    acceleration: 1,
    deceleration: 1,
  };

  // 1. Straight back.
  const back: ReturnType<typeof driveCar> = driveCar(car, {
    ...base,
    legs: [{ kind: "straight", length: 6, reverse: true }],
  });
  for (let k: number = 0; k <= 20; k++) {
    const sample: Sample = back.at((back.duration * k) / 20);
    const forward: IAutoMovieVector3 = ArchetypeFrame.axis(sample.placement, "z");
    if (!vclose(forward, { x: 0, y: 0, z: 1 }, 1e-9))
      findings.push(`the reversing car faces ${JSON.stringify(forward)} at sample ${k}`);
    if (sample.course.speed < 0 || (k > 0 && !sample.course.reverse))
      findings.push(`sample ${k} is not reversing at a positive speed`);
  }
  if (!vclose(back.at(back.duration).placement.translation, { x: 0, y: 0, z: -6 }, 1e-9))
    findings.push("the car does not end 6 m behind its start");

  // 2. Backing round a turn steers the other way.
  const turn = (reverse: boolean): ReturnType<typeof driveCar> =>
    driveCar(car, {
      ...base,
      legs: [{ kind: "turn", radius: 8, angle: 90, reverse }],
    });
  const forward: ReturnType<typeof driveCar> = turn(false);
  const backward: ReturnType<typeof driveCar> = turn(true);
  const middle = (ride: ReturnType<typeof driveCar>): Sample =>
    ride.at(ride.duration / 2);
  if (!(middle(backward).course.curvature > 0))
    findings.push("the reversed turn's curvature is not positive");
  const ahead: number = middle(forward).archetype.travel("wheel");
  const astern: number = middle(backward).archetype.travel("wheel");
  if (!(ahead > 0) || Math.abs(astern + ahead) > 1e-9)
    findings.push(`steering ${ahead} forward and ${astern} reversing`);
  const facing: IAutoMovieVector3 = ArchetypeFrame.axis(
    backward.at(backward.duration).placement,
    "z",
  );
  if (!vclose(facing, { x: 1, y: 0, z: 0 }, 1e-9))
    findings.push(`after backing round the turn the car faces ${JSON.stringify(facing)}`);

  // 3. The lean of a reversed state is on the vehicle's other side.
  const state: ArchetypeCourse.IState = middle(backward).course;
  if (
    !(ArchetypeCourse.lean(state) < 0) ||
    Math.abs(
      ArchetypeCourse.lean(state) + ArchetypeCourse.lean({ ...state, reverse: false }),
    ) > 1e-12
  )
    findings.push("a reversed lean is on the forward side");

  // 4. A bicycle does not reverse.
  let thrown: unknown = null;
  try {
    rideBicycle(createBicycle({}, 1), {
      ...base,
      legs: [
        { kind: "straight", length: 4 },
        { kind: "straight", length: 4, reverse: true },
      ],
    });
  } catch (error) {
    thrown = error;
  }
  if (!(thrown instanceof ArchetypeRefusal) || thrown.axis !== "course.legs[1].reverse")
    findings.push(`a reversing bicycle: ${String(thrown)}`);
  TestValidator.equals("a reversed leg keeps its facing", findings, []);
}
