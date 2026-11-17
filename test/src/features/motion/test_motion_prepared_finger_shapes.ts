import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanHand as Hand,
  HumanHand,
  HumanPrehension,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Prepared digit interpolation retains each current scalar input and the
 * original opening/closing phase's own ordered joint population.
 *
 * Scenarios:
 * 1. On both hands a straight shape plus curl bends the twelve finger
 *    segments while the three thumb segments retain their straight shape.
 *    Interior weights are affine combinations of the public named endpoints;
 *    varying curl/weight and repeated A/B/A reads cannot reuse old answers.
 * 2. The actual hand primitive reads the current weight, curl and named shape
 *    on every write, clamps weight, preserves an unrelated head joint and
 *    returns independent maps/triples after an earlier result is edited.
 * 3. Explicit sparse entry/open/closed degree triples specify both prehension
 *    phases. The inclusive peak retains the opening keys, the closing phase
 *    drops an entry-only thumb and introduces a closed-only ring finger.
 *    Quarter-progress minimum jerk is 53/512 and half-progress is 1/2.
 * 4. Closing-first, reverse and repeated shares, finite outside shares and
 *    previous output edits retain literal angle values and ordered key sets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines clinical degrees, straight-versus-thumb curl behavior, current scalar/configuration inputs, sparse phase ownership and four interpolation/ownership scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises public prepareFingers, the actual shape primitive and both prepared/one-shot prehension shape readers; current scalar/shape changes and literal phase outputs detect discarded required interpolation, stale results or shared mutable tuples.
 * @evidence contracts/development/testing.md#independent-expectations A straight hand has zero target flexion; curl applies to the twelve non-thumb segments. Interior flexion is the affine combination (1-w)rest+w(target+curl) of public named endpoint geometry, whose calibration this unit does not assert. Authored sparse triples and independent quintic weights 53/512 and 1/2 determine every prehension component, absent-zero endpoint and phase key order; 1e-12 degrees allows only binary64 arithmetic roundoff.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both sides, thumb/finger distinction, zero/interior/full/clamped weight, positive/negative curl, changed named shape, empty initial joint data, sparse missing endpoints, inclusive peak, both phases, reverse/repeated seeks and output mutation. Whole-body digit IK and contact feasibility retain their existing canonical-body units.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns clinical posture/shape records and its weight callback, calls only public source and adds no body imitation, foreign replacement, internal export, host, renderer, process or compiler.
 */
export function test_motion_prepared_finger_shapes(): void {
  for (const side of ["left", "right"] as const) {
    const relaxed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(side, "relaxed");
    const flat: ReturnType<typeof Hand.prepareFingers> = Hand.prepareFingers(side, "flat");
    const thumbs: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
      `${side}ThumbMetacarpal`, `${side}ThumbProximal`, `${side}ThumbDistal`,
    ]);
    const names: AutoMovieHumanoidBone[] = Object.keys(relaxed) as AutoMovieHumanoidBone[];
    const earlier: IAutoMovieMotionHumanPosture["joints"] = flat(12, 1);
    for (const [curl, weight] of [[12, 1], [-8, 0.25], [12, 0.5], [0, 0], [12, 1]] as const) {
      const output: IAutoMovieMotionHumanPosture["joints"] = flat(curl, weight);
      TestValidator.predicate(`${side} flat current curl=${curl}, weight=${weight}`,
        names.length === 15 && names.every((bone: AutoMovieHumanoidBone): boolean => {
          const expected: number = (1 - weight) * relaxed[bone]![0] +
            weight * (thumbs.has(bone) ? 0 : curl);
          return triple(output[bone], [expected, 0, 0]);
        }),
      );
      TestValidator.equals(`${side} prepared fingers keep all named joints in order`, Object.keys(output), names);
    }
    const oldFinger: [number, number, number] = earlier[`${side}IndexProximal`]! as [number, number, number];
    oldFinger[0] = 999;
    const raw: IAutoMovieMotionHumanPosture = { root: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, roll: 0,
      joints: { head: [7, 0, 0] }, limbs: {} };
    let multiplier: number = 1;
    const props: IAutoMovieMotionHumanHand.IShape ={ side, shape: "flat", curl: 12, from: 0, to: 2,
      weight: (seconds: number): number => multiplier * seconds };
    const primitive: IAutoMovieMotionHumanPrimitive = Hand.shape(props);
    const first: IAutoMovieMotionHumanPosture = primitive.write(raw, 0.5);
    const firstIndex: readonly [number, number, number] = first.joints[`${side}IndexProximal`]!;
    props.curl = -8;
    multiplier = 4;
    const changed: IAutoMovieMotionHumanPosture = primitive.write(raw, 0.5);
    TestValidator.predicate(`${side} same-time primitive reads new curl and clamped current weight`,
      names.every((bone: AutoMovieHumanoidBone): boolean =>
        triple(changed.joints[bone], [thumbs.has(bone) ? 0 : -8, 0, 0])) &&
      nclose(changed.joints.head![0], 7, 0),
    );
    props.shape = "fist";
    props.curl = 0;
    const fist: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(side, "fist");
    const renamed: IAutoMovieMotionHumanPosture = primitive.write(raw, 0.5);
    TestValidator.predicate(`${side} changed shape invalidates fixed named endpoints`,
      names.every((bone: AutoMovieHumanoidBone): boolean => triple(renamed.joints[bone], fist[bone]!)),
    );
    multiplier = -1;
    const released: IAutoMovieMotionHumanPosture = primitive.write(raw, 0.5);
    TestValidator.predicate(`${side} negative current weight returns the relaxed endpoint`,
      names.every((bone: AutoMovieHumanoidBone): boolean => triple(released.joints[bone], relaxed[bone]!)),
    );
    props.shape = "flat";
    props.curl = 12;
    multiplier = 1;
    first.joints[`${side}IndexProximal`] = [123, 456, 789];
    const replay: IAutoMovieMotionHumanPosture = primitive.write(raw, 0.5);
    TestValidator.predicate(`${side} repeated original inputs return fresh unpoisoned fingers`,
      replay !== first && replay.joints !== first.joints && replay.joints[`${side}IndexProximal`] !== firstIndex &&
      triple(replay.joints[`${side}IndexProximal`], [0.5 * relaxed[`${side}IndexProximal`]![0] + 6, 0, 0]) &&
      triple(flat(12, 1)[`${side}IndexProximal`], [12, 0, 0]) &&
      nclose(raw.joints.head![0], 7, 0) && Object.keys(raw.joints).length === 1 &&
      nclose(first.joints[`${side}IndexProximal`]![0], 123, 0) && nclose(oldFinger[0], 999, 0),
    );
  }

  const shapes: Parameters<typeof HumanPrehension.prepareShape>[0] = {
    entry: { leftThumbProximal: [4, 8, 12], leftIndexProximal: [8, 16, 24] },
    open: { leftIndexProximal: [24, 32, 40], leftMiddleProximal: [-8, 4, 16] },
    closed: { leftMiddleProximal: [16, -4, 8], leftRingProximal: [32, 48, 64] },
  };
  const read: ReturnType<typeof HumanPrehension.prepareShape> = HumanPrehension.prepareShape(shapes, 0.5);
  const opening: readonly AutoMovieHumanoidBone[] = ["leftThumbProximal", "leftIndexProximal", "leftMiddleProximal"];
  const closing: readonly AutoMovieHumanoidBone[] = ["leftIndexProximal", "leftMiddleProximal", "leftRingProximal"];
  const phases: readonly { u: number; keys: readonly AutoMovieHumanoidBone[]; expected: IAutoMovieMotionHumanPosture["joints"] }[] = [
    { u: 0.75, keys: closing, expected: { leftIndexProximal: [12, 16, 20], leftMiddleProximal: [4, 0, 12], leftRingProximal: [16, 24, 32] } },
    { u: 0.5, keys: opening, expected: { leftThumbProximal: [0, 0, 0], leftIndexProximal: [24, 32, 40], leftMiddleProximal: [-8, 4, 16] } },
    { u: 0.125, keys: opening, expected: { leftThumbProximal: [459 / 128, 459 / 64, 1377 / 128], leftIndexProximal: [309 / 32, 565 / 32, 821 / 32], leftMiddleProximal: [-53 / 64, 53 / 128, 53 / 32] } },
    { u: 0.25, keys: opening, expected: { leftThumbProximal: [2, 4, 6], leftIndexProximal: [16, 24, 32], leftMiddleProximal: [-4, 2, 8] } },
    { u: 2, keys: closing, expected: { leftIndexProximal: [0, 0, 0], leftMiddleProximal: [16, -4, 8], leftRingProximal: [32, 48, 64] } },
    { u: -1, keys: opening, expected: { leftThumbProximal: [4, 8, 12], leftIndexProximal: [8, 16, 24], leftMiddleProximal: [0, 0, 0] } },
    { u: 0.75, keys: closing, expected: { leftIndexProximal: [12, 16, 20], leftMiddleProximal: [4, 0, 12], leftRingProximal: [16, 24, 32] } },
  ];
  for (const { u, keys, expected } of phases) {
    const prepared: IAutoMovieMotionHumanPosture["joints"] = read(u);
    const once: IAutoMovieMotionHumanPosture["joints"] = HumanPrehension.shape(shapes, 0.5, u);
    TestValidator.equals(`prehension phase key order at ${u}`, Object.keys(prepared), [...keys]);
    TestValidator.predicate(`literal sparse prehension degrees at ${u}`,
      keys.every((bone: AutoMovieHumanoidBone): boolean =>
        triple(prepared[bone], expected[bone]!) && triple(once[bone], expected[bone]!)),
    );
    const old: [number, number, number] = prepared[keys[0]!]! as [number, number, number];
    old[0] = 987;
    old[1] = 654;
    old[2] = 321;
    const fresh: IAutoMovieMotionHumanPosture["joints"] = read(u);
    TestValidator.predicate(`prehension output edits cannot poison phase at ${u}`,
      fresh !== prepared && nclose(old[0], 987, 0) && keys.every((bone: AutoMovieHumanoidBone): boolean =>
        fresh[bone] !== prepared[bone] && triple(fresh[bone], expected[bone]!)),
    );
  }
  TestValidator.predicate("all authored phase endpoints retain their original tuple values",
    triple(shapes.entry.leftThumbProximal, [4, 8, 12]) &&
    triple(shapes.open.leftIndexProximal, [24, 32, 40]) &&
    triple(shapes.closed.leftRingProximal, [32, 48, 64]),
  );
}

/** Compare one present clinical F/A/T triple with an independent degree expectation. */
function triple(
  actual: readonly [number, number, number] | undefined,
  expected: readonly [number, number, number],
): boolean {
  return actual !== undefined && actual.every((angle: number, axis: number): boolean => nclose(angle, expected[axis]!, 1e-12));
}
