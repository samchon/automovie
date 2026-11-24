import { createDoor } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropDynamics,
} from "@automovie/interface";
import { HumanObject, HumanPerformance } from "@automovie/motions";
import { HumanPropDynamics } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../../features/internal/nclose";

/**
 * A door's own hinge track takes its travel from the applied torque (#3433).
 *
 * Scenarios:
 * 1. A cue starts a one-second torque on a hinged door in an empty performance. Travel follows constant angular acceleration from rest and holds at the end.
 * 2. A missing hinge and a torque that would turn the leaf beyond its range are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the cue-relative interval, from-rest motion, held endpoint and refused inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public performance state across the door's own track, catching an uninstalled track, a wrong start, linear interpolation from the endpoints and a lost final angle. A real door supplies the legal hinge range.
 * @evidence contracts/development/testing.md#independent-expectations Constant angular acceleration from rest gives torque times elapsed seconds squared divided by twice the inertia. Conversion to degrees is geometric. The tolerance allows numerical rounding and the assertion compares travel rather than measuring the depicted leaf.
 * @evidence contracts/development/testing.md#distinguishing-cases Seeks after, before and inside a cue-started drive, checks exact start and end, and refuses a missing hinge and excessive travel. The door-drive test owns performer-driven articulation.
 * @evidence contracts/development/testing.md#execution-ownership This discoverable unit test constructs the archetype and performance in memory and needs no performer, renderer or external host.
 */
export function test_motion_mechanism_force_driven_hinge(): void {
  const subject: string = "door";
  const prop: IAutoMovieMotionHumanProp = HumanObject.prop(
    subject,
    createDoor({ hinge: "right", hardware: "lever" }),
    { at: { x: 0, y: 0, z: 0 }, yaw: 0, fixed: true },
  );
  const from: number = 2;
  const duration: number = 1;
  const inertia: number = 4;
  const torque: number = 2;
  const drive: IAutoMovieMotionHumanPropDynamics.IHingeDrive = {
    articulation: "hinge",
    start: { of: "closer", event: "released" },
    duration,
    inertia,
    torque: (): number => torque,
  };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "force-driven-hinge",
    performers: [],
    composition: { kind: "parallel", parts: [] },
    cues: { closer: [{ name: "released", seconds: from }] },
    props: [HumanPropDynamics.hingeProp(prop, drive)],
  });
  const held: number | undefined = performance.state(subject, from + 2).hinge;
  TestValidator.predicate(
    "the track has not started before the cue",
    performance.state(subject, from - 0.25).hinge === undefined,
  );
  const degreesPerSecondSquared: number = (torque / inertia) * (180 / Math.PI);
  for (const elapsed of [0.37, 0, duration]) {
    const expected: number = (degreesPerSecondSquared * elapsed ** 2) / 2;
    const travel: number | undefined = performance.state(
      subject,
      from + elapsed,
    ).hinge;
    TestValidator.predicate(
      `hinge travel at ${elapsed} seconds after the cue`,
      travel !== undefined && nclose(travel, expected, 1e-9),
    );
  }

  TestValidator.predicate(
    "travel holds after the drive",
    held !== undefined &&
      nclose(held, (degreesPerSecondSquared * duration ** 2) / 2, 1e-9),
  );

  TestValidator.error("a missing hinge is refused", (): void => {
    HumanPropDynamics.hingeProp(prop, { ...drive, articulation: "missing" });
  });
  TestValidator.error("travel beyond the hinge range is refused", (): void => {
    HumanPropDynamics.hingeProp(prop, { ...drive, torque: (): number => 100 });
  });
}
