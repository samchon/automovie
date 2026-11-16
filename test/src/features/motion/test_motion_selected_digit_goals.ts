import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieJointPose, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanDigitFit,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../internal/joint";
import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * Digit observation omits only independent unobserved world goals while
 * retaining every requested distal fit and conservative attached-goal fallback.
 *
 * Scenarios:
 * 1. A canonical right index tip asks for the reachable point produced by
 *    clinical angles30/30/20. Requesting its distal bone retains actual
 *    fitting within the original0.5mm digit bound; observing just the hand
 *    keeps the same hand frame as full fitting.
 * 2. Attaching that goal to the actual hand frame requires complete fallback
 *    even for hand-only observation. Its fitted fingertip still reaches the
 *    original world point; a changed later goal receives its own solve.
 * 3. Ordered source admission remains mandatory when the digit fit is omitted:
 *    an overwritten NaN head record refuses, then valid source recovers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States canonical Human provenance, clinical degree/world and hand-local frames, observed descendant dependency, attached fallback, original contact precision and three admission/geometry scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public HumanDigitFit.fitted with full, distal-only and hand-only requests; measures displayed canonical tip contact and unchanged hand frames, converts one actual world goal to hand-local attachment, changes the target and tests ordered malformed source admission under omission.
 * @evidence contracts/development/testing.md#independent-expectations Known in-range finger angles provide reachable world targets through ordinary canonical FK, independently of the fitting under test, as in the existing digit specification. The required contact bound remains5e-4m. R inverse times(p-P) independently expresses the same point in the observed hand frame, and a digit cannot change its ancestor hand's world transform.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers full versus observed distal versus ancestor hand, world independence versus attached fallback, two actual targets in A/B/A order, an overwritten invalid unrelated joint under an omitted fit and valid recovery. General digit continuation, opposition and radial-softening bounds remain separately owned.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable numerical unit borrows an unchanged canonical Human fixture and owns all source/goal records. It invokes only public fitting, canonical FK and surface APIs, starts no viewer/compiler/host and introduces no internal export or foreign replacement.
 */
export function test_motion_selected_digit_goals(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const raw: IHumanPosture = { root: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, roll: 0, joints: {}, limbs: {} };
  const source: IAutoMoviePose = resolveHumanPosture(body, raw);
  const original: IAutoMoviePose = structuredClone(source);
  const region: resolveAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions.indexTipRight;
  const hand: IAutoMovieResolvedBone = poseBones(body, source).get("rightHand")!;
  const first: IAutoMovieVector3 = at(resolveHumanPosture(body, { ...raw, joints: {
    rightIndexProximal: [30, 0, 0], rightIndexIntermediate: [30, 0, 0], rightIndexDistal: [20, 0, 0],
  } }));
  const second: IAutoMovieVector3 = at(resolveHumanPosture(body, { ...raw, joints: {
    rightIndexProximal: [35, 0, 0], rightIndexIntermediate: [36, 0, 0], rightIndexDistal: [24, 0, 0],
  } }));
  for (const point of [first, second, first]) {
    const digits: NonNullable<IHumanPosture["digits"]> = { rightIndex: { point: { ...point }, surface: "tip" } };
    const full: IAutoMoviePose = HumanDigitFit.fitted(body, source, digits);
    const distal: IAutoMoviePose = HumanDigitFit.fitted(body, source, digits, undefined, new Set(["rightIndexDistal"]));
    contact(at(full), point);
    contact(at(distal), point);
    const ancestor: IAutoMoviePose = HumanDigitFit.fitted(body, source, digits, undefined, new Set(["rightHand"]));
    const observed: IAutoMovieResolvedBone = poseBones(body, ancestor).get("rightHand")!;
    const complete: IAutoMovieResolvedBone = poseBones(body, full).get("rightHand")!;
    TestValidator.predicate("unobserved digit omission cannot alter its observed ancestor frame",
      vclose(observed.worldPosition, hand.worldPosition, 1e-12) &&
      qclose(observed.worldRotation, hand.worldRotation, 1e-12) &&
      vclose(observed.worldPosition, complete.worldPosition, 1e-12) &&
      qclose(observed.worldRotation, complete.worldRotation, 1e-12),
    );
    const local: IAutoMovieVector3 = Quaternion.rotateVector(Quaternion.inverse(hand.worldRotation),
      Vector3.subtract(point, hand.worldPosition));
    const attached: IAutoMoviePose = HumanDigitFit.fitted(body, source, {
      rightIndex: { point: local, surface: "tip", on: "rightHand" },
    }, undefined, new Set(["rightHand"]));
    contact(at(attached), point);
  }
  const invalid: IAutoMoviePose = { ...source, joints: [...source.joints,
    joint("head", { flexion: NaN }), joint("head", { flexion: 0 })] };
  TestValidator.predicate("omitting a digit never hides ordered invalid authored source",
    throwsError((): IAutoMoviePose => HumanDigitFit.fitted(body, invalid, {
      rightIndex: { point: first, surface: "tip" },
    }, undefined, new Set(["rightHand"]))),
  );
  const recovered: IAutoMoviePose = HumanDigitFit.fitted(body, source, {
    rightIndex: { point: first, surface: "tip" },
  }, undefined, new Set(["rightIndexDistal"]));
  contact(at(recovered), first);
  TestValidator.predicate("observational fitting leaves its caller's source clinical record owned",
    source.joints.length === original.joints.length &&
    source.joints.every((value: IAutoMovieJointPose, i: number): boolean => {
      const before: IAutoMovieJointPose = original.joints[i]!;
      return value.bone === before.bone && same(value.flexion, before.flexion) &&
        same(value.abduction, before.abduction) && same(value.twist, before.twist);
    }),
  );

  /** Observe the actual canonical distal region rather than a solver-reported point. */
  function at(pose: IAutoMoviePose): IAutoMovieVector3 {
    return resolveAutoMovieHumanoidSurfaces.place(region, poseBones(body, pose).get(region.bone)!).point;
  }
}

/** Numeric source ownership retains exact finite values and distinct null rest. */
function same(actual: number | null, expected: number | null): boolean {
  return actual === null || expected === null ? actual === expected : nclose(actual, expected, 0);
}

/** Keep the original digit feature's Euclidean half-millimetre bound. */
function contact(actual: IAutoMovieVector3, target: IAutoMovieVector3): void {
  TestValidator.predicate("retained or conservative-fallback digit meets its actual target",
    Math.hypot(actual.x - target.x, actual.y - target.y, actual.z - target.z) <= 5e-4,
  );
}
