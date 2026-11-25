import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionWeaponContact,
} from "@automovie/interface";
import { StrikingStopRide } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** The posture a strike shows, before any ride. */
const SHOWN: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.9, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: {},
};

/**
 * `StrikingStopRide` keeps a strike's committed stop, the first contact its
 * weapon made, and solves the stopped limb's ride on it when the plan is
 * prepared.
 *
 * The ride solved here raises the root to the stop's second, so the posture it
 * carries names the contact it was solved on.
 *
 * Scenarios:
 *
 * 1. Before any stop the posture is shown as given, and the stop is none.
 * 2. Committing two contacts keeps the earlier: its second is returned.
 * 3. The ride is solved only when prepared, on that contact.
 * 4. A later commitment that met nothing clears the ride: a preparation then
 *    solves none.
 */
export function test_motions_striking_stop_ride(): void {
  const solved: IAutoMovieMotionWeaponContact[] = [];
  const stops: StrikingStopRide.IStop = StrikingStopRide(
    (
      met: IAutoMovieMotionWeaponContact,
    ): ReturnType<Parameters<typeof StrikingStopRide>[0]> => {
      solved.push(met);
      return {
        carry: (
          posture: IAutoMovieMotionHumanPosture,
          _limb: AutoMovieHumanLimb,
          _seconds: number,
        ): IAutoMovieMotionHumanPosture => ({
          ...posture,
          root: { ...posture.root, y: met.seconds },
        }),
      };
    },
  );

  // 1. No stop.
  TestValidator.predicate(
    "the posture as given, no stop",
    stops.carry(SHOWN, "rightArm", 1) === SHOWN && stops.met() === null,
  );

  // 2. The earlier contact.
  const fixed: number | null = stops.stop([
    { weapon: "fist", against: "b", seconds: 1.4 },
    { weapon: "fist", against: "b", seconds: 1.2 },
  ]);
  TestValidator.predicate(
    "the earlier contact is the stop",
    fixed === 1.2 &&
      stops.met()?.seconds === 1.2 &&
      stops.carry(SHOWN, "rightArm", 1) === SHOWN,
  );

  // 3. Prepared.
  stops.prepare();
  TestValidator.predicate(
    "the ride is solved on the stop when prepared",
    solved.length === 1 && stops.carry(SHOWN, "rightArm", 1).root.y === 1.2,
  );

  // 4. Nothing met.
  const cleared: number | null = stops.stop([]);
  const unprepared: boolean = stops.carry(SHOWN, "rightArm", 1) === SHOWN;
  stops.prepare();
  TestValidator.predicate(
    "a stop that met nothing clears the ride",
    cleared === null &&
      unprepared &&
      stops.carry(SHOWN, "rightArm", 1) === SHOWN &&
      solved.length === 1,
  );
}
