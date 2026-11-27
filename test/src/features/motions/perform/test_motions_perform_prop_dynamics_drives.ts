import type {
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanObject } from "@automovie/motions";
import { HumanPropDynamics } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { testAffordance } from "../../internal/fixtures/testAffordance";

/**
 * How far an integrated angle or distance may stand from its closed form: a
 * constant drive integrates a quadratic, which the integrator's fourth-order
 * steps carry within their rounding.
 */
const QUADRATIC: number = 1e-9;

/** The standard gravity, m/s². */
const G: number = 9.80665;

/**
 * `HumanPropDynamics.hingeProp` gives a poseable hinge a track under an
 * authored torque, and `slideProp` a rigid prop a ground slide under a push,
 * each refusing what it cannot drive.
 *
 * Scenarios:
 *
 * 1. A torque of 2 N m on 4 kg m² turns a door `t² / 4` radians: at 1 s 0.25 rad,
 *    14.32 degrees; the track starts at its instant, lasts its duration and is
 *    appended to the door's tracks.
 * 2. A hinge driven past its 30-degree travel within the drive is refused at plan
 *    time, as are a driven point that is no hinge, a prop that does not pose,
 *    and a duration or an inertia that is not positive.
 * 3. A 10 kg crate pushed with 60 N along (3, 0, 4) from 1 to 2 s, with static
 *    friction 0.5 and kinetic 0.3, slides `(60 − 0.3 m g) / m · t² / 2` along
 *    (0.6, 0, 0.8), keeps its turn, rests at its start before the push and
 *    holds its last place after it.
 * 4. Refused slides: a prop that moves by itself, one without both frictions, a
 *    push with a vertical part or none, and a negative force.
 */
export function test_motions_perform_prop_dynamics_drives(): void {
  // 1. A hinge.
  const model: IAutoMovieMotionHumanObject.IModel = {
    affordances: [
      testAffordance("hinge", "hinge", { x: 0, y: 1, z: 0 }, undefined, {
        travel: 30,
      }),
      testAffordance("pull", "handle", { x: 0.8, y: 1, z: 0 }),
    ],
  };
  const door: IAutoMovieMotionHumanProp = {
    ...AutoMovieMotionHumanObject.prop("door", model, { at: { x: 0, y: 0, z: 0 }, yaw: 0 }),
    articulate: () => ({ affordances: model.affordances ?? [] }),
    tracks: [
      {
        articulation: "pull",
        start: 0,
        travel: (): number => 0,
      },
    ],
  };
  const swung: IAutoMovieMotionHumanProp = HumanPropDynamics.hingeProp(door, {
    articulation: "hinge",
    start: { of: "push", event: "contact" },
    duration: 1,
    inertia: 4,
    torque: (): number => 2,
  });
  const track = swung.tracks![1]!;
  TestValidator.predicate(
    "a hinge under a constant torque",
    swung.tracks!.length === 2 &&
      swung.tracks![0] === door.tracks![0] &&
      track.articulation === "hinge" &&
      track.duration === 1 &&
      JSON.stringify(track.start) ===
        JSON.stringify({ of: "push", event: "contact" }) &&
      Math.abs(track.travel(1) - (0.25 * 180) / Math.PI) <= QUADRATIC &&
      Math.abs(track.travel(0.5) - (0.0625 * 180) / Math.PI) <= QUADRATIC,
  );

  // 2. Refused hinges.
  const drive = {
    articulation: "hinge",
    start: 0,
    duration: 1,
    inertia: 4,
    torque: (): number => 2,
  };
  const still: IAutoMovieMotionHumanProp = { ...door };
  delete still.articulate;
  TestValidator.predicate(
    "refused hinges",
    throws(() =>
      HumanPropDynamics.hingeProp(door, { ...drive, duration: 2 }),
    ) &&
      throws(() =>
        HumanPropDynamics.hingeProp(door, { ...drive, articulation: "pull" }),
      ) &&
      throws(() => HumanPropDynamics.hingeProp(still, drive)) &&
      throws(() =>
        HumanPropDynamics.hingeProp(door, { ...drive, duration: 0 }),
      ) &&
      throws(() => HumanPropDynamics.hingeProp(door, { ...drive, inertia: 0 })),
  );

  // 3. A slide.
  const crate: IAutoMovieMotionHumanProp = {
    ...AutoMovieMotionHumanObject.prop(
      "crate",
      { affordances: [] },
      { at: { x: 1, y: 0, z: 2 }, yaw: 0 },
    ),
    body: {
      mass: 10,
      centerOfMass: null,
      friction: 0.5,
      kineticFriction: 0.3,
    },
  };
  const push = {
    direction: { x: 3, y: 0, z: 4 },
    force: (): number => 60,
    from: 1,
    to: 2,
  };
  const slid: IAutoMovieMotionHumanProp = HumanPropDynamics.slideProp(
    crate,
    push,
  );
  const a: number = (60 - 0.3 * 10 * G) / 10;
  const along = (seconds: number): IAutoMovieVector3 => {
    const d: number = (a * seconds * seconds) / 2;
    return { x: 1 + 0.6 * d, y: 0, z: 2 + 0.8 * d };
  };
  TestValidator.predicate(
    "a pushed slide",
    near(slid.motion!(1.5).position, along(0.5)) &&
      near(slid.motion!(2).position, along(1)) &&
      near(slid.motion!(0.5).position, along(0)) &&
      near(slid.motion!(3).position, along(1)) &&
      slid.motion!(1.5).rotation.w === crate.frame.rotation.w,
  );

  // 4. Refused slides.
  TestValidator.predicate(
    "refused slides",
    throws(() => HumanPropDynamics.slideProp(slid, push)) &&
      throws(() =>
        HumanPropDynamics.slideProp(
          { ...crate, body: { mass: 10, centerOfMass: null, friction: 0.5 } },
          push,
        ),
      ) &&
      throws(() =>
        HumanPropDynamics.slideProp(crate, {
          ...push,
          direction: { x: 1, y: 1, z: 0 },
        }),
      ) &&
      throws(() =>
        HumanPropDynamics.slideProp(crate, {
          ...push,
          direction: { x: 0, y: 0, z: 0 },
        }),
      ) &&
      throws(() =>
        HumanPropDynamics.slideProp(crate, { ...push, force: (): number => -1 }),
      ),
  );
}

/** Whether two points agree within the integration bound. */
function near(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return (
    Math.abs(a.x - b.x) <= QUADRATIC &&
    Math.abs(a.y - b.y) <= QUADRATIC &&
    Math.abs(a.z - b.z) <= QUADRATIC
  );
}

/** Whether a task throws. */
function throws(task: () => unknown): boolean {
  try {
    task();
    return false;
  } catch {
    return true;
  }
}
