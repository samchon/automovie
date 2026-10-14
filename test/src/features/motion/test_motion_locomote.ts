import { Quaternion, locomoteMotion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";

const throws: (task: () => void) => boolean = (task: () => void): boolean => {
  try {
    task();
    return false;
  } catch {
    return true;
  }
};

/**
 * Observe gait-cycle sizing, exact-arrival travel and optional heading in the locomoteMotion producer using a two-keyframe authored cycle.
 *
 * Scenarios:
 *
 * 1. A 1 s gait at 1 m/s over 6 m bakes 6 cycles of travel in the +Z direction;
 *    the final keyframe's root has advanced ≈ 6 m.
 * 2. The direction is normalised before scaling by speed.
 * 3. A distance shorter than HALF a stride compresses the single cycle so the
 *    effective speed floors at ½×nominal (#1065): a 0.2 m ask at 1 m/s on a 1 s
 *    gait plays one 0.4 s cycle (0.5 m/s, the same worst case whole-cycle
 *    quantization allows everywhere else) and still arrives at exactly 0.2 m;
 *    the old full-length cycle skated at 0.2 m/s. The gait-cycle meta scales
 *    with it. A distance past the half-stride point (0.6 m) keeps the
 *    uncompressed cycle.
 * 4. `faceTravel` turns the root so the model's +Z faces the travel heading (a
 *    walk sent along +X ends up facing +X), while the default keeps the root
 *    rotation identity (a strafe).
 * 5. Invalid distance/speed/gait-duration/direction inputs reject before cycle
 *    sizing.
 * 6. A fractional ask arrives exactly: 3.49 m at 1 m/s on a 1 s gait rounds to 3
 *    cycles but ends at 3.49 m along the heading (the old bake of the requested
 *    speed stopped at 3.0 m).
 *
 * @evidence contracts/testing.md#behavioral-verification Calls locomoteMotion and observes duration, terminal displacement, compressed cycle metadata and rotated model-forward direction, then asserts malformed distance/speed/duration/vector refusals and fractional exact arrival.
 * @evidence contracts/testing.md#independent-expectations Authored distance divided by speed supplies nominal time, whole-cycle sizing supplies the preserved cycle counts, and the existing half-speed policy gives 0.4 seconds for a 0.2-metre trip. Literal destinations and +Z-to-+X facing independently bound the output; Quaternion.rotateVector observes orientation rather than proving that shared math independently. Existing tolerances and any-throw refusal semantics remain unchanged.
 * @evidence contracts/testing.md#distinguishing-cases Preserves six-cycle travel, unnormalized heading, sub-half-stride compression and its 0.6-metre twin, default strafe versus faceTravel, malformed scalars/directions including overflowed vector length, and the 3.49-metre fractional destination. Contact, arbitrary path corners and gait articulation laws belong to their owners.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns direct engine calls and its unchanged fixture-created gait. The local refusal helper and named facts register no cases; no process, viewer, GPU or native artifact is started.
 */
export function test_motion_locomote(): void {
  const gait: ReturnType<typeof makeMotion> = makeMotion(
    [
      keyframe(0, makePose([joint("leftUpperLeg", { flexion: -20 })])),
      keyframe(1, makePose([joint("leftUpperLeg", { flexion: 20 })])),
    ],
    1,
    true,
  );

  // 1. 6 m at 1 m/s on a 1 s gait → 6 cycles, ~6 m of +Z travel
  const stroll: ReturnType<typeof locomoteMotion> = locomoteMotion(
    "stroll",
    gait,
    6,
    1,
    { x: 0, y: 0, z: 1 },
  );
  TestValidator.predicate(
    "duration = 6 cycles × 1 s",
    nclose(stroll.duration, 6),
  );
  const lastZ: number =
    stroll.keyframes[stroll.keyframes.length - 1]!.pose.root!.translation.z;
  TestValidator.predicate("travelled ≈ 6 m forward", nclose(lastZ, 6, 0.001));

  // 2. unnormalised direction is normalised (a (0,0,5) dir still travels at speed)
  const diag: ReturnType<typeof locomoteMotion> = locomoteMotion(
    "d",
    gait,
    4,
    2,
    { x: 0, y: 0, z: 5 },
  );
  const dz: number =
    diag.keyframes[diag.keyframes.length - 1]!.pose.root!.translation.z;
  // 4 m at 2 m/s on a 1 s gait → round(2) = 2 cycles → 2 s → 2 × 2 = 4 m
  TestValidator.predicate("normalised: ≈ 4 m at 2 m/s", nclose(dz, 4, 0.001));

  // 3. sub-half-stride distance compresses the cycle to floor the speed (#1065)
  const tiny: ReturnType<typeof locomoteMotion> = locomoteMotion(
    "t",
    gait,
    0.2,
    1,
    { x: 0, y: 0, z: 1 },
  );
  TestValidator.predicate(
    "one compressed cycle spans 2·distance/speed = 0.4 s",
    nclose(tiny.duration, 0.4),
  );
  const tinyZ: number =
    tiny.keyframes[tiny.keyframes.length - 1]!.pose.root!.translation.z;
  TestValidator.predicate(
    "a 0.2 m ask still ends at 0.2 m, not a full stride",
    nclose(tinyZ, 0.2, 0.001),
  );
  TestValidator.predicate(
    "the effective speed floors at half the nominal speed",
    nclose(0.2 / tiny.duration, 0.5),
  );
  TestValidator.equals(
    "the gait-cycle meta scales with the compression",
    namedFacts([
      ["tinyGaitCycle", (): boolean => tiny.gaitCycle !== null],
      [
        "tinyGaitCycle2",
        (): boolean => tiny.gaitCycle !== null && tiny.gaitCycle !== undefined,
      ],
      [
        "ncloseTinyGaitCycle",
        (): boolean =>
          tiny.gaitCycle !== null &&
          tiny.gaitCycle !== undefined &&
          nclose(tiny.gaitCycle.period, 0.4),
      ],
    ]),
    { tinyGaitCycle: true, tinyGaitCycle2: true, ncloseTinyGaitCycle: true },
  );
  // negative twin: past the half-stride point the cycle stays uncompressed
  const halfStride: ReturnType<typeof locomoteMotion> = locomoteMotion(
    "h",
    gait,
    0.6,
    1,
    { x: 0, y: 0, z: 1 },
  );
  TestValidator.predicate(
    "a 0.6 m ask keeps the full 1 s cycle",
    nclose(halfStride.duration, 1),
  );
  const halfZ: number =
    halfStride.keyframes[halfStride.keyframes.length - 1]!.pose.root!
      .translation.z;
  TestValidator.predicate(
    "a 0.6 m ask still arrives exactly",
    nclose(halfZ, 0.6, 0.001),
  );

  // 4. faceTravel turns the body toward the heading
  const strafe: ReturnType<typeof locomoteMotion> = locomoteMotion(
    "s",
    gait,
    4,
    1,
    { x: 1, y: 0, z: 0 },
  );
  TestValidator.predicate(
    "default keeps rest facing (identity root rotation)",
    nclose(strafe.keyframes[1]!.pose.root!.rotation.w, 1),
  );
  const turned: ReturnType<typeof locomoteMotion> = locomoteMotion(
    "f",
    gait,
    4,
    1,
    { x: 1, y: 0, z: 0 },
    true,
  );
  const rot: IAutoMovieQuaternion =
    turned.keyframes[turned.keyframes.length - 1]!.pose.root!.rotation;
  TestValidator.predicate(
    "faceTravel: model +Z now points +X (the travel heading)",
    vclose(Quaternion.rotateVector(rot, { x: 0, y: 0, z: 1 }), {
      x: 1,
      y: 0,
      z: 0,
    }),
  );
  // 5. invalid locomotion inputs reject before travel cycle sizing
  for (const distance of [Number.NaN, 0, -1])
    TestValidator.predicate(
      `rejects invalid distance ${distance}`,
      throws((): void => {
        locomoteMotion("badDistance", gait, distance, 1, { x: 0, y: 0, z: 1 });
      }),
    );

  for (const speed of [Number.NaN, 0, -1])
    TestValidator.predicate(
      `rejects invalid speed ${speed}`,
      throws((): void => {
        locomoteMotion("badSpeed", gait, 1, speed, { x: 0, y: 0, z: 1 });
      }),
    );

  for (const duration of [Number.NaN, 0, -1])
    TestValidator.predicate(
      `rejects invalid gait duration ${duration}`,
      throws((): void => {
        locomoteMotion("badGait", { ...gait, duration }, 1, 1, {
          x: 0,
          y: 0,
          z: 1,
        });
      }),
    );

  const invalidDirections: IAutoMovieVector3[] = [
    { x: Number.NaN, y: 0, z: 1 },
    { x: 0, y: Infinity, z: 1 },
    { x: 0, y: 0, z: -Infinity },
    { x: 0, y: 0, z: 0 },
    { x: Number.MAX_VALUE, y: Number.MAX_VALUE, z: 0 },
  ];
  for (const direction of invalidDirections)
    TestValidator.predicate(
      "rejects invalid direction",
      throws((): void => {
        locomoteMotion("badDirection", gait, 1, 1, direction);
      }),
    );

  // 6. a fractional ask arrives exactly
  const fractional: ReturnType<typeof locomoteMotion> = locomoteMotion(
    "fr",
    gait,
    3.49,
    1,
    { x: 0, y: 0, z: 1 },
  );
  TestValidator.predicate(
    "3.49 m rounds to 3 cycles",
    nclose(fractional.duration, 3),
  );
  const fractionalZ: number =
    fractional.keyframes[fractional.keyframes.length - 1]!.pose.root!
      .translation.z;
  TestValidator.predicate(
    "3.49 m ask ends at 3.49 m along the heading",
    nclose(fractionalZ, 3.49, 0.001),
  );
}
