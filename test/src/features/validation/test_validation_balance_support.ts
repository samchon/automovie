import { validateBalanceSupport } from "@automovie/engine";
import {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { assertBalanceSupportInputRefusals } from "../internal/assertBalanceSupportInputRefusals";
import { makeMotion } from "../internal/fixtures";
import {
  namedFacts,
  nclose,
  validationHasNoWarnings,
  validationHasWarning,
} from "../internal/predicates";

const restAt: (x: number, y: number, z: number) => IAutoMovieTransform = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const skeleton: (centerX: number, centerZ: number) => IAutoMovieSkeleton = (centerX: number, centerZ: number): IAutoMovieSkeleton => ({
  id: `balance-${centerX}-${centerZ}`,
  bones: [
    { bone: "hips", parent: null, rest: restAt(0, 1, 0), constraint: null },
    {
      bone: "spine",
      parent: "hips",
      rest: restAt(centerX, 0.5, centerZ),
      constraint: null,
    },
    {
      bone: "leftFoot",
      parent: "hips",
      rest: restAt(-0.2, -1, 0),
      constraint: null,
    },
    {
      bone: "rightFoot",
      parent: "hips",
      rest: restAt(0.2, -1, 0),
      constraint: null,
    },
    {
      bone: "leftToes",
      parent: "leftFoot",
      rest: restAt(0, 0, 0.4),
      constraint: null,
    },
    {
      bone: "rightToes",
      parent: "rightFoot",
      rest: restAt(0, 0, 0.4),
      constraint: null,
    },
  ],
});

const root: () => IAutoMovieTransform = (): IAutoMovieTransform => ({
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const pose: (target: IAutoMovieSkeleton) => IAutoMoviePose = (target: IAutoMovieSkeleton): IAutoMoviePose => ({
  skeleton: target.id,
  root: root(),
  joints: [],
});

const key: (target: IAutoMovieSkeleton, time: number) => IAutoMovieKeyframe = (target: IAutoMovieSkeleton, time: number): IAutoMovieKeyframe => ({
  time,
  pose: pose(target),
  expression: null,
  easing: "linear",
  bezier: null,
});

const motion: (target: IAutoMovieSkeleton) => IAutoMovieMotion = (target: IAutoMovieSkeleton): IAutoMovieMotion =>
  makeMotion([key(target, 0), key(target, 1)], 1);

/**
 * `validateBalanceSupport` pins the balance heuristic: callers declare a
 * support window, the validator projects the center of mass and support
 * contacts to XZ, then warns when COM falls outside the support hull
 * margin. With an explicit `centerBone` the COM is that single bone; omitted,
 * it is the segment-mass-weighted whole-body COM (#1184).
 *
 * Scenarios:
 *
 * 1. A single-bone (`spine`) COM beyond a two-foot support segment reports a
 *    physics violation on
 *    `$input.supports[i].samples[j].centerOfMass.supportDistance`.
 * 2. Widening the margin leaves the same segment case successful; the marker suppresses warnings.
 * 3. One-foot support and the whole-body COM pass when the COM is on the support
 *    point or segment.
 * 4. A convex four-point foot/toe hull leaves interior and edge cases successful and warns for an outside COM.
 * 5. The mass-weighted whole-body COM (#1184) warns on a forward-leaning trunk
 *    that a single-hips proxy misses: the pelvis stays over the feet while the
 *    weighted joint-position estimate has pitched past them.
 * 6. Invalid support annotations and invalid sample rates report deterministic
 *    non-physics failures before sampling.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateBalanceSupport with point, segment and polygon supports, asserts located imbalance warnings and a 0.25 m overshoot, checks physicsIntent suppression and a weighted-center warning absent from a hips-only proxy, and delegates structural refusal assertions to assertBalanceSupportInputRefusals. Several accepting geometry cases assert success only, which permits advisory warnings.
 * @evidence contracts/testing.md#independent-expectations A center at x=0.5 lies 0.3 m beyond feet spanning [-0.2,0.2], leaving 0.25 m after margin 0.05; foot/toe coordinates define the support rectangle independently. A displaced heavy trunk must move the weighted center while hips remain over the feet. The refusal helper's explicit field paths and counts follow annotation domains; it does not use validator output to construct expectations.
 * @evidence contracts/testing.md#distinguishing-cases Six groups cover segment overshoot and margin, singleton/default center, polygon interior/edge/exterior, a fractional window, weighted versus hips center, intent suppression, and combined plus isolated malformed bone/support/window/margin/rate inputs. Acceptance checks that only inspect success do not prove warning absence; detached bones belong to the totality test.
 * @evidence contracts/testing.md#execution-ownership The named test_validation_balance_support entry owns the directly invoked refusal helper's cases as well as its in-memory rigs and motions; portable sampling/FK/hull validation starts no host and dynamically registers no cases.
 */
export function test_validation_balance_support(): void {
  const outsideLine: IAutoMovieSkeleton = skeleton(0.5, 0);
  const rejected: IAutoMovieValidation = validateBalanceSupport({
    motion: motion(outsideLine),
    skeleton: outsideLine,
    supports: [
      {
        centerBone: "spine",
        supportBones: ["leftFoot", "rightFoot"],
        start: 0,
        end: 1,
        margin: 0.05,
      },
    ],
    sampleRate: 1,
  });
  TestValidator.predicate(
    "balance support warns but succeeds",
    validationHasWarning(
      "balance support rejection",
      rejected,
      "physics",
      "$input.supports[0].samples[0].centerOfMass.supportDistance",
    ),
  );
  const first: IAutoMovieConstraintViolation | undefined | null =
    rejected.success === true
      ? (rejected.warnings ?? []).find((v: IAutoMovieConstraintViolation): boolean => v.path.includes("samples[0]"))
      : null;
  TestValidator.equals(
    "balance support overshoot",
    namedFacts([
      ["firstKindPhysics", (): boolean => first?.kind === "physics"],
      [
        "ncloseFirstOvershoot",
        (): boolean => first?.kind === "physics" && nclose(first.overshoot ?? -1, 0.25),
      ],
    ]),
    { firstKindPhysics: true, ncloseFirstOvershoot: true },
  );

  // physicsIntent (wire-fu / a deliberately off-balance pose) suppresses it.
  const acknowledged: IAutoMovieValidation = validateBalanceSupport({
    motion: motion(outsideLine),
    skeleton: outsideLine,
    supports: [
      {
        centerBone: "spine",
        supportBones: ["leftFoot", "rightFoot"],
        start: 0,
        end: 1,
        margin: 0.05,
      },
    ],
    sampleRate: 1,
    physicsIntent: "wire-fu",
  });
  TestValidator.predicate(
    "acknowledged imbalance is clean",
    validationHasNoWarnings("acknowledged imbalance", acknowledged),
  );

  TestValidator.equals(
    "margin accepts line support",
    validateBalanceSupport({
      motion: motion(outsideLine),
      skeleton: outsideLine,
      supports: [
        {
          centerBone: "spine",
          supportBones: ["leftFoot", "rightFoot"],
          start: 0,
          end: 1,
          margin: 0.3,
        },
      ],
      sampleRate: 1,
    }).success,
    true,
  );

  const oneFoot: IAutoMovieSkeleton = skeleton(-0.2, 0);
  TestValidator.equals(
    "one-foot support succeeds",
    validateBalanceSupport({
      motion: motion(oneFoot),
      skeleton: oneFoot,
      supports: [
        {
          centerBone: "spine",
          supportBones: ["leftFoot"],
          start: 0,
          end: 1,
          margin: 0,
        },
      ],
      sampleRate: 1,
    }).success,
    true,
  );

  const defaultCenter: IAutoMovieSkeleton = skeleton(0, 0);
  TestValidator.equals(
    "whole-body COM over an upright rig stays within the foot segment",
    validateBalanceSupport({
      motion: motion(defaultCenter),
      skeleton: defaultCenter,
      supports: [{ supportBones: ["leftFoot", "rightFoot"], start: 0, end: 1 }],
    }).success,
    true,
  );

  // #1184: a forward-leaning trunk pitches the whole-body COM past the feet,
  // which the mass-weighted default catches but a single-hips proxy misses:
  // the pelvis stays over the feet while the heavy trunk has tipped forward.
  const leaningTrunk: IAutoMovieSkeleton = {
    id: "leaning",
    bones: [
      { bone: "hips", parent: null, rest: restAt(0, 1, 0), constraint: null },
      {
        bone: "chest",
        parent: "hips",
        rest: restAt(0, 0.5, 1),
        constraint: null,
      },
      {
        bone: "leftFoot",
        parent: "hips",
        rest: restAt(-0.2, -1, 0),
        constraint: null,
      },
      {
        bone: "rightFoot",
        parent: "hips",
        rest: restAt(0.2, -1, 0),
        constraint: null,
      },
    ],
  };
  const leanDefault: IAutoMovieValidation = validateBalanceSupport({
    motion: motion(leaningTrunk),
    skeleton: leaningTrunk,
    supports: [
      {
        supportBones: ["leftFoot", "rightFoot"],
        start: 0,
        end: 1,
        margin: 0.05,
      },
    ],
    sampleRate: 1,
  });
  TestValidator.predicate(
    "mass-weighted COM warns on a forward-leaning trunk",
    validationHasWarning(
      "mass-weighted balance support",
      leanDefault,
      "physics",
      "$input.supports[0].samples[0].centerOfMass.supportDistance",
    ),
  );
  const leanHips: IAutoMovieValidation = validateBalanceSupport({
    motion: motion(leaningTrunk),
    skeleton: leaningTrunk,
    supports: [
      {
        centerBone: "hips",
        supportBones: ["leftFoot", "rightFoot"],
        start: 0,
        end: 1,
        margin: 0.05,
      },
    ],
    sampleRate: 1,
  });
  TestValidator.predicate(
    "the single-hips proxy misses the same lean (pelvis stays over the feet)",
    validationHasNoWarnings("single-hips balance proxy", leanHips),
  );

  const insidePolygon: IAutoMovieSkeleton = skeleton(0, 0.2);
  TestValidator.equals(
    "polygon support succeeds",
    validateBalanceSupport({
      motion: motion(insidePolygon),
      skeleton: insidePolygon,
      supports: [
        {
          centerBone: "spine",
          supportBones: ["leftFoot", "rightFoot", "rightToes", "leftToes"],
          start: 0,
          end: 1,
          margin: 0,
        },
      ],
      sampleRate: 1,
    }).success,
    true,
  );

  const edgePolygon: IAutoMovieSkeleton = skeleton(0, 0);
  TestValidator.equals(
    "polygon edge support succeeds",
    validateBalanceSupport({
      motion: motion(edgePolygon),
      skeleton: edgePolygon,
      supports: [
        {
          centerBone: "spine",
          supportBones: ["leftFoot", "rightFoot", "rightToes", "leftToes"],
          start: 0,
          end: 1,
          margin: 0,
        },
      ],
      sampleRate: 1,
    }).success,
    true,
  );

  TestValidator.equals(
    "fractional sample window succeeds",
    validateBalanceSupport({
      motion: motion(insidePolygon),
      skeleton: insidePolygon,
      supports: [
        {
          centerBone: "spine",
          supportBones: ["leftFoot", "rightFoot", "rightToes", "leftToes"],
          start: 0,
          end: 0.75,
          margin: 0,
        },
      ],
      sampleRate: 2,
    }).success,
    true,
  );

  const outsidePolygon: IAutoMovieSkeleton = skeleton(0.5, 0.2);
  const polygonRejected: IAutoMovieValidation = validateBalanceSupport({
    motion: motion(outsidePolygon),
    skeleton: outsidePolygon,
    supports: [
      {
        centerBone: "spine",
        supportBones: ["leftFoot", "rightFoot", "rightToes", "leftToes"],
        start: 0,
        end: 1,
        margin: 0.05,
      },
    ],
    sampleRate: 1,
    path: "$balance",
  });
  TestValidator.predicate(
    "polygon support warns but succeeds",
    validationHasWarning(
      "polygon balance support",
      polygonRejected,
      "physics",
      "$balance.supports[0].samples[0].centerOfMass.supportDistance",
    ),
  );

  assertBalanceSupportInputRefusals(defaultCenter, motion);
}
