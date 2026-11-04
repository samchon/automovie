import { Vector3, rigidTransformVelocity } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * Rigid-frame secants retain WORLD axes, quaternion sign equivalence and their declared finite-interval limits.
 *
 * Scenarios:
 * 1. A translated Z90 frame rotating about its local Y has WORLD omega -X.
 * 2. Either quaternion sign and reversed endpoints preserve the stated algebra.
 * 3. A rotating local point obeys v + omega cross r; backward h/h2 secants converge.
 * 4. Identity, tiny rotation/time and near-pi increments retain finite answers.
 * 5. Invalid time/components, ambiguous pi and overflowing arithmetic refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public Engine export and checks WORLD linear/angular vectors, endpoint reversal, independent sign choices, actual point-velocity composition, finite-difference convergence, input ownership and explicit refusals. Wrong quaternion multiplication order or a degree-valued angular answer fails.
 * @evidence contracts/testing.md#independent-expectations The closed Hamilton product Z90 times Y(1.25t) has WORLD axis -X and authored linear slope (.4,-.2,.1); no Engine constructor generates those endpoints. A unit lever rotating about Y has analytic derivative (-2sin(2t),0,-2cos(2t)); its backward chord error halves with h. These endpoint tests cannot exclude hidden full turns or certify constrained motion.
 * @evidence contracts/testing.md#distinguishing-cases Covers nonidentity initial frames, all independent quaternion signs, positive-interval endpoint reversal, zero and subnormal intervals/increments, near and exact pi, nonunit/nonfinite inputs, nonrepresentable arithmetic and detached outputs. Actual branch selection and post-fit trajectory sampling remain consumer tests.
 * @evidence contracts/testing.md#execution-ownership This named synchronous root unit owns all arithmetic fixtures and assertions, imports the public portable Engine seam and starts no process, browser, GPU, native build or installed consumer.
 */
export function test_math_rigid_transform_velocity(): void {
  const previous: Pick<IAutoMovieTransform, "translation" | "rotation"> =
    analyticFrame(0.35);
  const current: Pick<IAutoMovieTransform, "translation" | "rotation"> =
    analyticFrame(0.55);
  const saved: string = JSON.stringify([previous, current]);
  const rate: ReturnType<typeof rigidTransformVelocity> =
    rigidTransformVelocity(previous, current, 0.2);
  TestValidator.predicate(
    "WORLD translation secant",
    vclose(rate.linear, { x: 0.4, y: -0.2, z: 0.1 }, 1e-12),
  );
  TestValidator.predicate(
    "local Y becomes WORLD -X",
    vclose(rate.angular, { x: -1.25, y: 0, z: 0 }, 1e-12),
  );

  for (const oldSign of [-1, 1]) {
    for (const newSign of [-1, 1]) {
      const oldFrame: typeof previous = structuredClone(previous);
      const newFrame: typeof current = structuredClone(current);
      for (const axis of ["x", "y", "z", "w"] as const) {
        oldFrame.rotation[axis] *= oldSign;
        newFrame.rotation[axis] *= newSign;
      }
      const signed: ReturnType<typeof rigidTransformVelocity> =
        rigidTransformVelocity(oldFrame, newFrame, 0.2);
      TestValidator.predicate(
        `independent signs ${oldSign}/${newSign}`,
        vclose(signed.angular, { x: -1.25, y: 0, z: 0 }, 1e-12),
      );
    }
  }
  const reversed: ReturnType<typeof rigidTransformVelocity> =
    rigidTransformVelocity(current, previous, 0.2);
  TestValidator.predicate(
    "positive interval with reversed endpoints reverses translation",
    vclose(reversed.linear, { x: -0.4, y: 0.2, z: -0.1 }, 1e-12),
  );
  TestValidator.predicate(
    "positive interval with reversed endpoints reverses WORLD omega",
    vclose(reversed.angular, { x: 1.25, y: 0, z: 0 }, 1e-12),
  );

  const time: number = 0.4;
  const angle: number = 2 * time;
  const rootBefore: typeof previous = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const rootNow: typeof previous = {
    translation: { x: 0.3 * time, y: 0, z: -0.1 * time },
    rotation: { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) },
  };
  const rotation: ReturnType<typeof rigidTransformVelocity> =
    rigidTransformVelocity(rootBefore, rootNow, time);
  const lever: IAutoMovieVector3 = {
    x: Math.cos(angle),
    y: 0,
    z: -Math.sin(angle),
  };
  const pointRate: IAutoMovieVector3 = Vector3.add(
    rotation.linear,
    Vector3.cross(rotation.angular, lever),
  );
  const analytic: IAutoMovieVector3 = {
    x: 0.3 - 2 * Math.sin(angle),
    y: 0,
    z: -0.1 - 2 * Math.cos(angle),
  };
  TestValidator.predicate(
    "WORLD omega cross rotated lever",
    vclose(pointRate, analytic, 1e-12),
  );

  const errors: number[] = [];
  for (const h of [0.01, 0.005]) {
    const oldTime: number = time - h;
    const oldPoint: typeof previous = {
      translation: {
        x: 0.3 * oldTime + Math.cos(2 * oldTime),
        y: 0,
        z: -0.1 * oldTime - Math.sin(2 * oldTime),
      },
      rotation: { x: 0, y: Math.sin(oldTime), z: 0, w: Math.cos(oldTime) },
    };
    const newPoint: typeof previous = {
      translation: {
        x: 0.3 * time + Math.cos(2 * time),
        y: 0,
        z: -0.1 * time - Math.sin(2 * time),
      },
      rotation: rootNow.rotation,
    };
    const chord: ReturnType<typeof rigidTransformVelocity> =
      rigidTransformVelocity(oldPoint, newPoint, h);
    TestValidator.predicate(
      `constant WORLD angular rate at h=${h}`,
      vclose(chord.angular, { x: 0, y: 2, z: 0 }, 1e-12),
    );
    errors.push(
      Math.hypot(chord.linear.x - analytic.x, chord.linear.z - analytic.z),
    );
  }
  TestValidator.predicate(
    "one-sided point h/h2 secants converge at first order",
    errors[0]! > 0.019 &&
      errors[1]! > 0.009 &&
      nclose(errors[1]! / errors[0]!, 0.5, 0.001),
  );

  const identity: typeof previous = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const still: ReturnType<typeof rigidTransformVelocity> =
    rigidTransformVelocity(identity, identity, Number.MIN_VALUE);
  TestValidator.predicate(
    "stationary subnormal interval",
    vclose(still.linear, { x: 0, y: 0, z: 0 }, 0) &&
      vclose(still.angular, { x: 0, y: 0, z: 0 }, 0),
  );
  const tiny: typeof previous = {
    ...identity,
    rotation: { x: 0, y: 1e-320, z: 0, w: 1 },
  };
  TestValidator.predicate(
    "subnormal rotation remains observable",
    nclose(rigidTransformVelocity(identity, tiny, 1e-320).angular.y, 2, 0.001),
  );
  const nearPi: typeof previous = {
    ...identity,
    rotation: { x: 1, y: 0, z: 0, w: 1e-12 },
  };
  TestValidator.predicate(
    "strictly smaller than pi has a branch",
    nclose(
      rigidTransformVelocity(identity, nearPi, 1).angular.x,
      Math.PI - 2e-12,
      1e-14,
    ),
  );

  for (const seconds of [0, -1, NaN, Infinity, -Infinity])
    TestValidator.predicate(
      `invalid interval ${seconds}`,
      throwsError(
        (): unknown => rigidTransformVelocity(previous, current, seconds),
        "positive finite seconds",
      ),
    );
  for (const sign of [-1, 1]) {
    const halfTurn: typeof previous = {
      ...identity,
      rotation: { x: sign, y: 0, z: 0, w: 0 },
    };
    TestValidator.predicate(
      `exact pi ambiguity ${sign}`,
      throwsError(
        (): unknown => rigidTransformVelocity(identity, halfTurn, 1),
        "half-turn",
      ),
    );
  }
  for (const quaternion of [
    { x: 0, y: 0, z: 0, w: 0 },
    { x: 0, y: 0, z: 0, w: 2 },
    { x: NaN, y: 0, z: 0, w: 1 },
    { x: 0, y: Infinity, z: 0, w: 1 },
  ])
    TestValidator.predicate(
      "invalid rotation refuses",
      throwsError((): unknown =>
        rigidTransformVelocity(
          identity,
          { ...identity, rotation: quaternion },
          1,
        ),
      ),
    );
  for (const coordinate of [NaN, Infinity, -Infinity])
    TestValidator.predicate(
      "invalid translation refuses",
      throwsError((): unknown =>
        rigidTransformVelocity(
          identity,
          { ...identity, translation: { x: coordinate, y: 0, z: 0 } },
          1,
        ),
      ),
    );
  TestValidator.predicate(
    "overflowing velocity refuses",
    throwsError(
      (): unknown =>
        rigidTransformVelocity(previous, current, Number.MIN_VALUE),
      "representable",
    ),
  );
  TestValidator.predicate(
    "overflowing displacement refuses",
    throwsError(
      (): unknown =>
        rigidTransformVelocity(
          { ...identity, translation: { x: -Number.MAX_VALUE, y: 0, z: 0 } },
          { ...identity, translation: { x: Number.MAX_VALUE, y: 0, z: 0 } },
          1,
        ),
      "representable",
    ),
  );
  TestValidator.equals(
    "all calls preserve input frames",
    JSON.stringify([previous, current]),
    saved,
  );
  rate.linear.x = 100;
  rate.angular.x = 100;
  TestValidator.equals(
    "returned vectors do not alias frame components",
    JSON.stringify([previous, current]),
    saved,
  );
}

/**
 * Closed Z90 times local Y(1.25t), independent of Engine quaternion helpers.
 *
 * The explicit Hamilton product is (-s sin(a/2),s sin(a/2),s cos(a/2),s cos(a/2)) for s=sqrt(.5), giving WORLD axis -X and slope 1.25 rad/s without the tested quaternion helpers.
 * This private fixture supplies only the smooth endpoint branch; the exported unit owns all assertions, sign choices, reversal and failure cases.
 */
function analyticFrame(
  time: number,
): Pick<IAutoMovieTransform, "translation" | "rotation"> {
  const sine: number = Math.sin((1.25 * time) / 2) * Math.SQRT1_2;
  const cosine: number = Math.cos((1.25 * time) / 2) * Math.SQRT1_2;
  return {
    translation: { x: 1 + 0.4 * time, y: -2 - 0.2 * time, z: 0.5 + 0.1 * time },
    rotation: { x: -sine, y: sine, z: cosine, w: cosine },
  };
}
