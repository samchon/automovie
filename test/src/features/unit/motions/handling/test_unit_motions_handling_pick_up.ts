import { Quaternion, createAutoMovieRandom } from "@automovie/engine";
import type { IAutoMovieAffordance, IAutoMovieMotionHumanGrasp, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanPrehension, IAutoMovieVector3 } from "@automovie/interface";
import { HumanGraspRoll, HumanGrip, HumanPrehension, HumanRefusal, pickUpAlong, pickUpStepReach } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few products, metres, seconds and degrees. */
const ROUNDING: number = 1e-9;

/** A grasp target's point and axis. */
type Target = Pick<IAutoMovieMotionHumanGrasp.ITarget, "point" | "axis">;

/**
 * The `pickUp` law's own logic, each piece without the arm planner:
 *
 * - `HumanPrehension` is reach to grasp as transport and grasp (Jeannerod 1981):
 *   the peak aperture 0.8 of the object's width plus 25 mm (Smeets and Brenner
 *   1999); a loaded carry at least the time that keeps the minimum-jerk peak
 *   speed, 1.875 times the mean, at 1 m/s; the peak at a seeded share in
 *   Jeannerod's 60 to 70 % band; a transport at rest on the grasp, turned by
 *   the approach's start; the fingers open to the pre-shape by the peak and
 *   closed onto the grasp by the end.
 * - `HumanGraspRoll` rolls a grasp about a handle's axis so the wrist's offset
 *   points the way a point lies from it.
 * - `HumanGrip.bones` names a digit's three bones, proximal to distal.
 * - `pickUpAlong` slides a grasp target along its handle's band to the share
 *   asked, refusing a share outside [0, 1] on `along`.
 * - `pickUpStepReach` is the shortest step toward a direction that brings the
 *   body's middle, half the step along, within every place's reach.
 *
 * Scenarios:
 *
 * 1. Prehension: a 50 mm object peaks at 65 mm of aperture; a 1 m carry takes
 *    1.875 s, a 0.1 m carry the unloaded reach time; a seeded peak lies in
 *    [0.6, 0.7]; a 1 s transport to (0.4, 0, 0) is half way at 0.5 s and on the
 *    grasp at its end, turned 90 degrees about Y, one set back 0.1 m too, and
 *    one of no time is refused; a finger at 0 entering, -10 open and 60 closed
 *    reads -5, -10, 25 and 60 at 0.3, 0.6, 0.8 and 1.
 * 2. Roll, a handle at (0, 1, 0) along +Z, the wrist 0.05 m to its +X: toward +Y
 *    the wrist comes to (0, 1.05, 0) turned a quarter; toward a point on the
 *    axis nothing turns.
 * 3. Grip bones: the left index's and the right thumb's.
 * 4. Along, a 0.4 m band with the target at (0, 1, 0.3) along +X: no share keeps
 *    it; 0.75 moves it 0.1 m and 0 moves it 0.2 m back; 1.5 is refused.
 * 5. Step reach along +Z: a place 1 m ahead within 0.5 m asks a 1 m step with the
 *    longest 2 m, none with the longest 0.8 m; a place 0.6 m aside none; a
 *    place within reach no step.
 */
export function test_unit_motions_handling_pick_up(): void {
  // 1. Prehension.
  TestValidator.predicate(
    "the aperture and the carry",
    nclose(HumanPrehension.aperture(0.05), 0.065, ROUNDING) &&
      nclose(HumanPrehension.carry(1), 1.875, ROUNDING) &&
      nclose(
        HumanPrehension.carry(0.1),
        HumanPrehension.nominal(0.1, 0),
        ROUNDING,
      ) &&
      HumanPrehension.nominal(0.1, 0) > 0.1875,
  );
  const peak: number = HumanPrehension.peak(createAutoMovieRandom("peak"));
  TestValidator.predicate("the peak", peak >= 0.6 && peak <= 0.7);
  const rotation: IAutoMovieMotionHumanPrehension.ITransportRotation = {
    from: Quaternion.identity(),
    to: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
  const transport = (setback: number, time: number) =>
    HumanPrehension.transport(
      { x: 0, y: 0, z: 0 },
      { x: 0.4, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      setback,
      rotation,
      time,
    );
  const direct: IAutoMovieMotionHumanPrehension.ITransport = transport(0, 1);
  const approached: IAutoMovieMotionHumanPrehension.ITransport = transport(
    0.1,
    1,
  );
  TestValidator.predicate(
    "the transport",
    vclose(direct.wrist(0.5), { x: 0.2, y: 0, z: 0 }, ROUNDING) &&
      vclose(direct.wrist(1), { x: 0.4, y: 0, z: 0 }, ROUNDING) &&
      qclose(direct.turn(1), rotation.to, ROUNDING) &&
      vclose(approached.wrist(1), { x: 0.4, y: 0, z: 0 }, ROUNDING) &&
      qclose(
        approached.turn(HumanPrehension.APPROACH.start),
        rotation.to,
        ROUNDING,
      ),
  );
  TestValidator.error("no time", (): void => {
    transport(0, 0);
  });
  const shapes: Parameters<typeof HumanPrehension.shape>[0] = {
    entry: { rightIndexProximal: [0, 0, 0] },
    open: { rightIndexProximal: [-10, 0, 0] },
    closed: { rightIndexProximal: [60, 0, 0] },
  };
  const prepared: ReturnType<typeof HumanPrehension.prepareShape> =
    HumanPrehension.prepareShape(shapes, 0.6);
  TestValidator.predicate(
    "the fingers",
    [
      [0.3, -5],
      [0.6, -10],
      [0.8, 25],
      [1, 60],
    ].every(
      ([u, angle]: number[]): boolean =>
        nclose(
          HumanPrehension.shape(shapes, 0.6, u!).rightIndexProximal![0],
          angle!,
          ROUNDING,
        ) && nclose(prepared(u!).rightIndexProximal![0], angle!, ROUNDING),
    ),
  );

  // 2. Roll.
  const point: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const axis: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const grasp: IAutoMovieMotionHumanHand.IWrist = {
    point: { x: 0.05, y: 1, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const rolled: IAutoMovieMotionHumanHand.IWrist = HumanGraspRoll(
    grasp,
    point,
    axis,
    { x: 0, y: 2, z: 0.3 },
  );
  TestValidator.predicate(
    "the roll",
    vclose(rolled.point, { x: 0, y: 1.05, z: 0 }, ROUNDING) &&
      vclose(
        Quaternion.rotateVector(rolled.rotation, { x: 1, y: 0, z: 0 }),
        { x: 0, y: 1, z: 0 },
        ROUNDING,
      ) &&
      HumanGraspRoll(grasp, point, axis, { x: 0, y: 1, z: 0.5 }) === grasp,
  );

  // 3. Grip bones.
  TestValidator.equals(
    "the digits",
    [HumanGrip.bones("left", "Index"), HumanGrip.bones("right", "Thumb")],
    [
      ["leftIndexProximal", "leftIndexIntermediate", "leftIndexDistal"],
      ["rightThumbMetacarpal", "rightThumbProximal", "rightThumbDistal"],
    ],
  );

  // 4. Along.
  const grip: IAutoMovieAffordance = {
    id: "grip",
    kind: "handle",
    frame: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
    length: 0.4,
  };
  const context = (along?: number): pickUpAlong.IContext => ({
    params: {
      prop: "cane",
      handle: "grip",
      ...(along === undefined ? {} : { along }),
    },
    prop: () => ({ prop: { affordances: [grip] } }),
  });
  const target: Target = {
    point: { x: 0, y: 1, z: 0.3 },
    axis: { x: 1, y: 0, z: 0 },
  };
  let outside: boolean = false;
  try {
    pickUpAlong(context(1.5), target);
  } catch (error: unknown) {
    outside = error instanceof HumanRefusal && error.axis === "along";
  }
  TestValidator.predicate(
    "along the band",
    pickUpAlong(context(), target) === target &&
      vclose(
        pickUpAlong(context(0.75), target).point,
        { x: 0.1, y: 1, z: 0.3 },
        ROUNDING,
      ) &&
      vclose(
        pickUpAlong(context(0), target).point,
        { x: -0.2, y: 1, z: 0.3 },
        ROUNDING,
      ) &&
      outside,
  );

  // 5. Step reach.
  const from: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const toward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const ahead: pickUpStepReach.IReach = [{ x: 0, y: 0, z: 1 }, 0.5];
  TestValidator.predicate(
    "a step ahead",
    nclose(pickUpStepReach(from, toward, [ahead], 2)!, 1, ROUNDING),
  );
  TestValidator.equals(
    "no step or none",
    [
      pickUpStepReach(from, toward, [ahead], 0.8),
      pickUpStepReach(from, toward, [[{ x: 0.6, y: 0, z: 1 }, 0.5]], 2),
      pickUpStepReach(from, toward, [[{ x: 0, y: 0, z: 0.2 }, 0.5]], 2),
    ],
    [null, null, 0],
  );
}
