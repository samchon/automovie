import { AutoMovieEngineValidation } from "@automovie/engine";
import type { IAutoMoviePlacedContinuity } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IDENTITY_TRANSFORM } from "../../internal/fixtures";
import { nclose } from "../../internal/predicates";

/** A check of one placed transform. */
type ITransformCheck = Extract<
  IAutoMoviePlacedContinuity.IProps,
  { kind: "transform" }
>;

/** A check of one step between two placed endpoints. */
type IStepCheck = Extract<IAutoMoviePlacedContinuity.IProps, { kind: "step" }>;

/** A check of who holds a prop across a handoff. */
type ICustodyCheck = Extract<
  IAutoMoviePlacedContinuity.IProps,
  { kind: "custody" }
>;

/**
 * Check malformed placed facts and authored transform and custody boundaries
 * independently of seeking or review order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers placed TRS admission, intentional or unavailable boundaries, continuous steps and declared custody changes.
 * @evidence contracts/development/testing.md#behavioral-verification Calls measurePlacedContinuity with raw transforms and independent endpoint and holder facts. It checks measured distance and angle, exact finding paths and unsupported states.
 * @evidence contracts/development/testing.md#independent-expectations The half-metre move exceeds its quarter-metre limit and opposite quaternion signs have zero angle. A same-time quarter turn gives pi/2. Explicit allowed holders distinguish early receipt, drop and an authorized null release.
 */
export const test_engine_validation_placed_continuity = (): void => {
  const transform: ITransformCheck = {
    kind: "transform",
    path: "props.lantern.world",
  };
  const raw = AutoMovieEngineValidation.measurePlacedContinuity({
    ...transform,
    observation: {
      kind: "present",
      transform: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 2 },
        scale: { x: 1, y: 0, z: 1 },
      },
    },
  });
  TestValidator.predicate(
    "raw TRS checks independent fields before evaluating motion",
    () =>
      raw.status === "checked" &&
      raw.motion === undefined &&
      raw.violations.length === 2 &&
      raw.violations.some(
        ({ path }) => path === "props.lantern.world.rotation",
      ) &&
      raw.violations.some(({ path }) => path === "props.lantern.world.scale.y"),
  );
  const missing = AutoMovieEngineValidation.measurePlacedContinuity({
    ...transform,
    observation: { kind: "missing" },
  });
  TestValidator.predicate(
    "confirmed missing transform fails and unavailable evidence does not claim coverage",
    () =>
      AutoMovieEngineValidation.measurePlacedContinuity(transform).status === "unsupported" &&
      missing.status === "checked" &&
      missing.violations.length === 1 &&
      missing.violations[0]?.path === "props.lantern.world",
  );

  const before: IAutoMoviePlacedContinuity.IEndpoint = {
    seconds: 1.25,
    transform: IDENTITY_TRANSFORM,
  };
  const edge: IStepCheck = {
    kind: "step",
    path: "actors.rook.root",
    boundary: "continuous",
    before,
    after: {
      seconds: 1.5,
      transform: {
        ...IDENTITY_TRANSFORM,
        translation: { x: 0.5, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: -1 },
      },
    },
  };
  const jump = AutoMovieEngineValidation.measurePlacedContinuity({
    ...edge,
    maxDistance: 0.25,
    maxAngle: 0.01,
  });
  TestValidator.predicate(
    "continuous pair detects movement and accepts antipodal representation",
    () =>
      jump.status === "checked" &&
      jump.motion !== undefined &&
      nclose(jump.motion.distance, 0.5) &&
      nclose(jump.motion.angle, 0) &&
      jump.violations.length === 1 &&
      jump.violations[0]?.path === "actors.rook.root.distance",
  );
  const unbounded = AutoMovieEngineValidation.measurePlacedContinuity(edge);
  TestValidator.predicate(
    "declared pair without a limit exposes its measurements",
    () =>
      unbounded.status === "checked" &&
      unbounded.motion !== undefined &&
      nclose(unbounded.motion.distance, 0.5) &&
      nclose(unbounded.motion.angle, 0) &&
      unbounded.violations.length === 0,
  );

  const seam = AutoMovieEngineValidation.measurePlacedContinuity({
    ...edge,
    after: {
      seconds: before.seconds,
      transform: {
        ...IDENTITY_TRANSFORM,
        rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
      },
    },
    maxAngle: 0.1,
  });
  TestValidator.predicate(
    "same-time required seam can expose angular discontinuity",
    () =>
      seam.status === "checked" &&
      seam.motion !== undefined &&
      nclose(seam.motion.distance, 0) &&
      nclose(seam.motion.angle, Math.PI / 2) &&
      seam.violations.length === 1 &&
      seam.violations[0]?.path === "actors.rook.root.angle",
  );

  const reverse = AutoMovieEngineValidation.measurePlacedContinuity({
    ...edge,
    before: edge.after,
    after: edge.before,
  });
  TestValidator.predicate(
    "intentional boundaries exclude pairs while unavailable or unordered pairs remain explicit",
    () =>
      AutoMovieEngineValidation.measurePlacedContinuity({ ...edge, boundary: "cut" }).status ===
        "excluded" &&
      AutoMovieEngineValidation.measurePlacedContinuity({ ...edge, boundary: "discontinuity" })
        .status === "excluded" &&
      AutoMovieEngineValidation.measurePlacedContinuity({ ...edge, boundary: "unavailable" })
        .status === "unsupported" &&
      AutoMovieEngineValidation.measurePlacedContinuity({
        kind: "step",
        path: edge.path,
        boundary: "continuous",
        before: edge.before,
      }).status === "unsupported" &&
      reverse.status === "checked" &&
      reverse.motion === undefined &&
      reverse.violations.length === 1 &&
      reverse.violations[0]?.path === "actors.rook.root.after.seconds",
  );

  const custody: Pick<ICustodyCheck, "kind" | "path"> = {
    kind: "custody",
    path: "props.lantern.custody",
  };
  const after = AutoMovieEngineValidation.measurePlacedContinuity({
    ...custody,
    allowed: ["receiver.hand"],
    holder: "receiver.hand",
  });
  const closure = AutoMovieEngineValidation.measurePlacedContinuity({
    ...custody,
    allowed: ["giver.hand"],
    holder: "giver.hand",
  });
  const early = AutoMovieEngineValidation.measurePlacedContinuity({
    ...custody,
    allowed: ["giver.hand"],
    holder: "receiver.hand",
  });
  const dropped = AutoMovieEngineValidation.measurePlacedContinuity({
    ...custody,
    allowed: ["receiver.hand"],
    holder: null,
  });
  const released = AutoMovieEngineValidation.measurePlacedContinuity({
    ...custody,
    allowed: [null],
    holder: null,
  });
  TestValidator.predicate(
    "declared handoff and release remain independent of observation order",
    () =>
      [after, closure, released].every(
        (result) =>
          result.status === "checked" && result.violations.length === 0,
      ) &&
      [early, dropped].every(
        (result) =>
          result.status === "checked" &&
          result.violations.length === 1 &&
          result.violations[0]?.path === "props.lantern.custody.holder",
      ) &&
      AutoMovieEngineValidation.measurePlacedContinuity({
        ...custody,
        allowed: ["receiver.hand"],
      }).status === "unsupported",
  );
};
