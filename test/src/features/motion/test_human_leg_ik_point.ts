import {
  AutoMovieHumanClinicalIk as ClinicalIk,
  AutoMovieHumanRigControls as Controls,
  type IAutoMovieHumanPose,
  AutoMovieHumanLegIk as LegIk,
  AutoMovieHumanSkeleton as Skeleton,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { HumanPeople } from "../internal/HumanPeople";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Current posed foot descendants produce compatible anatomical ankle seeds.
 *
 * Scenarios:
 * 1. A Foot-centre target exactly preserves the existing seed API's result.
 * 2. Both sides use actual rotated Subtalar and toe witnesses, not a rest offset.
 * 3. FK ownership, nonchronological sampling and selected-foot admission remain explicit.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real prepared Human evaluator and public seed APIs. A rest-foot offset, wrong-side subtree, missing local-point rotation or caller mutation changes these observations. This verifies a translation seed, not final skin contact, support or exact descendant reach.
 * @evidence contracts/testing.md#independent-expectations The posed quaternion's expanded rotation matrix maps each independent local witness. Translating its measured evaluator-frame point by a chosen ankle displacement must agree with the existing ankle-centre API. The neutral-offset alternative is deliberately distinguished on articulated feet; actual resulting FK retains rigid segment lengths.
 * @evidence contracts/testing.md#distinguishing-cases Exercises left/right Foot centres, Subtalar and HalluxProximal points under nonzero pelvis/hip/knee/ankle/toe controls, large unreachable goals, other-foot and arm points, sparse/nonfinite coordinates and invalid evaluator/side inputs. Numeric coordinates cannot identify a foreign scene actor, so scene world/root provenance remains the consumer's responsibility.
 * @evidence contracts/testing.md#execution-ownership One synchronous CPU scenario borrows HumanPeople's once-prepared m1 anatomy and samples independent public FK snapshots. It creates no renderer, browser, calibration cache, scene actor or global motion state; canonical root discovery owns execution.
 */
export function test_human_leg_ik_point(): void {
  const evaluate: Skeleton.PoseEvaluator = HumanPeople.rigged("m1").evaluate;
  const neutral: Skeleton.IOutput = evaluate({});
  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1;
    const pose: IAutoMovieHumanPose = {
      pelvis: { rotation: 23, obliquity: 4 },
      arms: {
        left: { elbow: { flexion: 44 } },
        right: { elbow: { flexion: 51 } },
      },
      legs: {
        left: {
          hip: { flexion: 19, abduction: 7, rotation: 9 },
          knee: { flexion: 42 },
          ankle: { dorsiflexion: 11 },
          foot: { hallux: { mtpFlexion: -18 } },
        },
        right: {
          hip: { flexion: 17, abduction: 6, rotation: -8 },
          knee: { flexion: 38 },
          ankle: { dorsiflexion: -9 },
          foot: { hallux: { mtpFlexion: -16 } },
        },
      },
    };
    const before: string = JSON.stringify(pose);
    const current: Skeleton.IOutput = evaluate(pose);
    const ankle: Controls.MetrePoint = point(
      current,
      Controls.joint(`${side}Foot`),
    );
    const displacement: Controls.MetrePoint = [0.035, 0.018, sign * 0.012];
    const ankleGoal: Controls.MetrePoint = add(ankle, displacement);
    const expected: IAutoMovieHumanPose = LegIk.seed(
      pose,
      side,
      ankleGoal,
      current,
      neutral,
      true,
    );
    const direct: IAutoMovieHumanPose = LegIk.seedPoint(
      evaluate,
      pose,
      side,
      { bone: Controls.joint(`${side}Foot`), position: ankleGoal },
      true,
    );
    TestValidator.equals(`${side} centre compatibility`, direct, expected);
    for (const suffix of ["Subtalar", "HalluxProximal"] as const) {
      const bone: Controls.Joint = Controls.joint(`${side}${suffix}`);
      const localPoint: Controls.MetrePoint = [0.017, -0.006, sign * 0.004];
      const actualPoint: Controls.MetrePoint = point(current, bone, localPoint);
      const goal: Controls.MetrePoint = add(actualPoint, displacement);
      const target: ClinicalIk.ITarget = { bone, localPoint, position: goal };
      const snapshot: string = JSON.stringify(target);
      const seeded: IAutoMovieHumanPose = LegIk.seedPoint(
        evaluate,
        pose,
        side,
        target,
        true,
      );
      TestValidator.predicate(
        `${side} ${suffix} posed-point conversion`,
        nclose(
          seeded.legs![side].hip!.flexion!,
          expected.legs![side].hip!.flexion!,
          1e-9,
        ) &&
          nclose(
            seeded.legs![side].hip!.abduction!,
            expected.legs![side].hip!.abduction!,
            1e-9,
          ) &&
          nclose(
            seeded.legs![side].hip!.rotation!,
            expected.legs![side].hip!.rotation!,
            1e-9,
          ) &&
          nclose(
            seeded.legs![side].knee!.flexion!,
            expected.legs![side].knee!.flexion!,
            1e-9,
          ),
      );
      TestValidator.equals(
        `${side} ${suffix} target ownership`,
        JSON.stringify(target),
        snapshot,
      );
      const wrongAnkle: Controls.MetrePoint = add(
        ankle,
        subtract(goal, point(neutral, bone, localPoint)),
      );
      const wrong: IAutoMovieHumanPose = LegIk.seed(
        pose,
        side,
        wrongAnkle,
        current,
        neutral,
        true,
      );
      TestValidator.predicate(
        `${side} ${suffix} distinguishes neutral offset`,
        JSON.stringify(wrong.legs?.[side]) !==
          JSON.stringify(seeded.legs?.[side]),
      );
      const output: Skeleton.IOutput = evaluate(seeded);
      const hip: Controls.MetrePoint = point(
        output,
        Controls.joint(`${side}UpperLeg`),
      );
      const knee: Controls.MetrePoint = point(
        output,
        Controls.joint(`${side}LowerLeg`),
      );
      const foot: Controls.MetrePoint = point(
        output,
        Controls.joint(`${side}Foot`),
      );
      TestValidator.predicate(
        `${side} ${suffix} rigid thigh`,
        nclose(
          distance(hip, knee),
          distance(
            point(neutral, Controls.joint(`${side}UpperLeg`)),
            point(neutral, Controls.joint(`${side}LowerLeg`)),
          ),
          1e-9,
        ),
      );
      TestValidator.predicate(
        `${side} ${suffix} rigid shin`,
        nclose(
          distance(knee, foot),
          distance(
            point(neutral, Controls.joint(`${side}LowerLeg`)),
            point(neutral, Controls.joint(`${side}Foot`)),
          ),
          1e-9,
        ),
      );
      TestValidator.predicate(
        `${side} ${suffix} finite independent endpoint residual`,
        Number.isFinite(distance(point(output, bone, localPoint), goal)),
      );
      evaluate({});
      TestValidator.equals(
        `${side} ${suffix} seek-order independence`,
        LegIk.seedPoint(evaluate, pose, side, target, true),
        seeded,
      );
      TestValidator.equals(
        `${side} ${suffix} retains authored arms`,
        seeded.arms,
        pose.arms,
      );
    }
    TestValidator.equals(
      `${side} pose ownership`,
      JSON.stringify(pose),
      before,
    );
    const far: IAutoMovieHumanPose = LegIk.seedPoint(evaluate, pose, side, {
      bone: Controls.joint(`${side}Foot`),
      position: [10, 10, 10],
    });
    TestValidator.predicate(
      `${side} unreachable target stays unresolved`,
      distance(
        point(evaluate(far), Controls.joint(`${side}Foot`)),
        [10, 10, 10],
      ) > 10,
    );
    const other: Controls.Joint = Controls.joint(
      `${side === "left" ? "right" : "left"}HalluxProximal`,
    );
    TestValidator.predicate(
      `${side} refuses other foot`,
      throwsError((): void => {
        LegIk.seedPoint(evaluate, pose, side, {
          bone: other,
          position: ankleGoal,
        });
      }),
    );
    TestValidator.predicate(
      `${side} refuses arm witness`,
      throwsError((): void => {
        LegIk.seedPoint(evaluate, pose, side, {
          bone: "leftHand",
          position: ankleGoal,
        });
      }),
    );
  }
  for (const malformed of [
    [NaN, 0, 0],
    [0, Infinity, 0],
    new Array<number>(3),
  ]) {
    TestValidator.predicate(
      "refuses malformed target",
      throwsError((): void => {
        LegIk.seedPoint(evaluate, {}, "left", {
          bone: "leftFoot",
          position: malformed as Controls.MetrePoint,
        });
      }),
    );
    TestValidator.predicate(
      "refuses malformed witness",
      throwsError((): void => {
        LegIk.seedPoint(evaluate, {}, "left", {
          bone: "leftFoot",
          position: [0, 0, 0],
          localPoint: malformed as Controls.MetrePoint,
        });
      }),
    );
  }
  TestValidator.predicate(
    "refuses invalid side",
    throwsError((): void => {
      LegIk.seedPoint(evaluate, {}, "front" as Controls.Side, {
        bone: "leftFoot",
        position: [0, 0, 0],
      });
    }),
  );
  TestValidator.predicate(
    "refuses invalid orientation flag",
    throwsError((): void => {
      LegIk.seedPoint(
        evaluate,
        {},
        "left",
        { bone: "leftFoot", position: [0, 0, 0] },
        1 as unknown as boolean,
      );
    }),
  );
  TestValidator.predicate(
    "refuses snapshot in evaluator slot",
    throwsError((): void => {
      LegIk.seedPoint(
        neutral as unknown as Skeleton.PoseEvaluator,
        {},
        "left",
        { bone: "leftFoot", position: [0, 0, 0] },
      );
    }),
  );
}

/** Independent expanded quaternion matrix maps a real local witness into FK metres. */
function point(
  output: Skeleton.IOutput,
  bone: Controls.Joint,
  offset: Controls.MetrePoint = [0, 0, 0],
): Controls.MetrePoint {
  const placement: Skeleton.IPlacement | undefined = output.posed.find(
    (row: Skeleton.IPlacement): boolean => row.bone === bone,
  );
  if (!placement) throw new Error(`Missing actual FK witness: ${bone}`);
  const [x, y, z, w]: [number, number, number, number] = placement.rotation;
  const [a, b, c]: Controls.MetrePoint = offset;
  return [
    placement.position[0] +
      (1 - 2 * (y * y + z * z)) * a +
      2 * (x * y - z * w) * b +
      2 * (x * z + y * w) * c,
    placement.position[1] +
      2 * (x * y + z * w) * a +
      (1 - 2 * (x * x + z * z)) * b +
      2 * (y * z - x * w) * c,
    placement.position[2] +
      2 * (x * z - y * w) * a +
      2 * (y * z + x * w) * b +
      (1 - 2 * (x * x + y * y)) * c,
  ];
}

/** Add a chosen evaluator-frame displacement without scene/root transforms. */
function add(
  a: Controls.MetrePoint,
  b: Controls.MetrePoint,
): Controls.MetrePoint {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
/** Difference of independently measured evaluator-frame points. */
function subtract(
  a: Controls.MetrePoint,
  b: Controls.MetrePoint,
): Controls.MetrePoint {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
/** Euclidean metre distance for a rigid-length or honest-residual observation. */
function distance(a: Controls.MetrePoint, b: Controls.MetrePoint): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
