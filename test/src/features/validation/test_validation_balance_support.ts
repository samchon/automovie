import { assertBalanceSupportInputRefusals } from "../internal/assertBalanceSupportInputRefusals";
import { validateBalanceSupport } from "@automovie/engine";
import {
  IAutoMovieKeyframe,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeMotion } from "../internal/fixtures";
import {
  namedFacts,
  nclose,
  validationHasNoWarnings,
  validationHasWarning,
} from "../internal/predicates";

const restAt = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const skeleton = (centerX: number, centerZ: number): IAutoMovieSkeleton => ({
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

const root = (): IAutoMovieTransform => ({
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const pose = (target: IAutoMovieSkeleton): IAutoMoviePose => ({
  skeleton: target.id,
  root: root(),
  joints: [],
});

const key = (target: IAutoMovieSkeleton, time: number): IAutoMovieKeyframe => ({
  time,
  pose: pose(target),
  expression: null,
  easing: "linear",
  bezier: null,
});

const motion = (target: IAutoMovieSkeleton) =>
  makeMotion([key(target, 0), key(target, 1)], 1);

/**
 * `validateBalanceSupport` pins the balance heuristic: callers declare a
 * support window, the validator projects the center of mass and support
 * contacts to XZ, then rejects samples whose COM falls outside the support hull
 * margin. With an explicit `centerBone` the COM is that single bone; omitted,
 * it is the segment-mass-weighted whole-body COM (#1184).
 *
 * Scenarios:
 *
 * 1. A single-bone (`spine`) COM beyond a two-foot support segment reports a
 *    physics violation on
 *    `$input.supports[i].samples[j].centerOfMass.supportDistance`.
 * 2. Widening the margin accepts the same segment case, proving the distance
 *    threshold is the gate.
 * 3. One-foot support and the whole-body COM pass when the COM is on the support
 *    point or segment.
 * 4. A convex four-point foot/toe hull accepts an inside COM and rejects an
 *    outside COM.
 * 5. The mass-weighted whole-body COM (#1184) warns on a forward-leaning trunk
 *    that a single-hips proxy misses: the pelvis stays over the feet while the
 *    body's real COM has pitched past them.
 * 6. Invalid support annotations and invalid sample rates report deterministic
 *    non-physics failures before sampling.
 */
export const test_validation_balance_support = (): void => {
  const outsideLine = skeleton(0.5, 0);
  const rejected = validateBalanceSupport({
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
  const first =
    rejected.success === true
      ? (rejected.warnings ?? []).find((v) => v.path.includes("samples[0]"))
      : null;
  TestValidator.equals(
    "balance support overshoot",
    namedFacts([
      ["firstKindPhysics", () => first?.kind === "physics"],
      [
        "ncloseFirstOvershoot",
        () => first?.kind === "physics" && nclose(first.overshoot ?? -1, 0.25),
      ],
    ]),
    { firstKindPhysics: true, ncloseFirstOvershoot: true },
  );

  // physicsIntent (wire-fu / a deliberately off-balance pose) suppresses it.
  const acknowledged = validateBalanceSupport({
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

  const oneFoot = skeleton(-0.2, 0);
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

  const defaultCenter = skeleton(0, 0);
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
  const leanDefault = validateBalanceSupport({
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
  const leanHips = validateBalanceSupport({
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

  const insidePolygon = skeleton(0, 0.2);
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

  const edgePolygon = skeleton(0, 0);
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

  const outsidePolygon = skeleton(0.5, 0.2);
  const polygonRejected = validateBalanceSupport({
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
};
