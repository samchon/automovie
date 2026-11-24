import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropDynamics,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";
import { HumanPropDynamics } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../../features/internal/qclose";
import { vclose } from "../../../../features/internal/vclose";

/**
 * Read a force-driven prop through the placed performance (#3433).
 *
 * Scenarios:
 * 1. Two identical rigid bodies receive constant horizontal forces on
 *    opposite sides of their authored static friction threshold. The one
 *    below threshold stays at its rest frame, and the one above it moves
 *    by `(F/m - μk g) t²/2` along a non-unit direction expressed in world axes.
 * 2. The prop retains its quarter-turn orientation and height, and its
 *    placement holds before and after the authored interval. Seeks read it
 *    in reverse order to exercise the same film clock as forward playback.
 * 3. Missing kinetic friction or a negative sampled force refuses at construction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists both force regimes, the frame and clock behavior and the admission cases.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the actual prop placement through HumanPerformance and rejects invalid authoring through slideProp.
 * @evidence contracts/development/testing.md#independent-expectations Static Coulomb friction and constant-acceleration Newtonian displacement give the expected world position independently of the trajectory, with an absolute micrometre comparison for this analytic case.
 * @evidence contracts/development/testing.md#distinguishing-cases Seeks backwards across the moving interval and checks the subthreshold crate during the drive and after it.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous test uses two short plan-time slides and zero body pose or arm plan reads, owning no host resources.
 */
export function test_motion_mechanism_force_driven_prop(): void {
  /** Conventional standard gravity in metres per second squared. */
  const gravity: number = 9.80665;
  const mass: number = 40;
  const friction: number = 0.5;
  const kineticFriction: number = 0.25;
  const start: IAutoMovieRigidTransform = {
    position: { x: 4, y: 0.3, z: -2 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  };
  const crate: IAutoMovieMotionHumanProp = {
    subject: "sliding-crate",
    frame: start,
    points: {},
    body: { mass, friction, kineticFriction, centerOfMass: null },
  };
  const threshold: number = friction * mass * gravity;
  const push: number = 1.1 * threshold;
  const drive: IAutoMovieMotionHumanPropDynamics.ISlideDrive = {
    from: 1,
    to: 2,
    direction: { x: 3, y: 0, z: 4 },
    force: (): number => push,
  };
  const moving: IAutoMovieMotionHumanProp = HumanPropDynamics.slideProp(
    crate,
    drive,
  );
  const stationary: IAutoMovieMotionHumanProp = HumanPropDynamics.slideProp(
    { ...crate, subject: "stationary-crate" },
    { ...drive, force: (): number => 0.9 * threshold },
  );
  const performance: HumanPerformance = new HumanPerformance({
    seed: "force-driven-prop",
    performers: [],
    props: [moving, stationary],
    composition: { kind: "sequence", parts: [] },
  });
  const acceleration: number = push / mass - kineticFriction * gravity;
  for (const seconds of [3, 2, 1.5, 1, 0.5]) {
    const elapsed: number = Math.min(1, Math.max(0, seconds - 1));
    const distance: number = (acceleration * elapsed * elapsed) / 2;
    const at: IAutoMovieRigidTransform = performance.prop(
      crate.subject,
      seconds,
    );
    TestValidator.predicate(
      `world slide at ${seconds}s`,
      vclose(at.position, {
        x: start.position.x + (3 / 5) * distance,
        y: 0.3,
        z: start.position.z + (4 / 5) * distance,
      }) && qclose(at.rotation, start.rotation),
    );
  }
  for (const seconds of [3, 1.5])
    TestValidator.predicate(
      `rest under static friction at ${seconds} s`,
      vclose(
        performance.prop(stationary.subject, seconds).position,
        start.position,
      ),
    );
  TestValidator.error("unknown kinetic friction", (): void => {
    HumanPropDynamics.slideProp(
      { ...crate, body: { mass, friction, centerOfMass: null } },
      drive,
    );
  });
  TestValidator.error(
    "negative force opposes the stated slide direction",
    (): void => {
      HumanPropDynamics.slideProp(crate, { ...drive, force: (): number => -1 });
    },
  );
}
