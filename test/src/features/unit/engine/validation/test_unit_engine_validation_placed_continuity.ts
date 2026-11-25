import { measureAutoMoviePlacedContinuity } from "@automovie/engine";
import type { IAutoMoviePlacedContinuity } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IDENTITY_TRANSFORM } from "../../../internal/fixtures";
import { nclose } from "../../../internal/predicates";

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
 * @evidence contracts/development/common.md#meaningful-documentation Names the stable inputs and the difference between a required but missing fact, an unavailable provider and an intentional boundary.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public check to cover raw TRS refusal, translational and angular changes, excluded cuts and handoff-specific custody without resampling.
 * @evidence contracts/development/testing.md#independent-expectations Uses exact presentation times, an analytic half-metre step and quarter turn, finite-aware numeric comparisons, and known field paths.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts missing and unobserved facts, continuous and excluded pairs, coincident and unordered times, and known free versus unknown custody. Playback boundary selection belongs to the timeline owner.
 * @evidence contracts/development/testing.md#execution-ownership This named portable Engine unit checks explicit pairs and revisits a handoff in reverse request order without a renderer, clock or external producer.
 */
export const test_unit_engine_validation_placed_continuity = (): void => {
  const transform: ITransformCheck = {
    kind: "transform",
    path: "props.lantern.world",
  };
  const raw = measureAutoMoviePlacedContinuity({
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
  const missing = measureAutoMoviePlacedContinuity({
    ...transform,
    observation: { kind: "missing" },
  });
  TestValidator.predicate(
    "confirmed missing transform fails and unavailable evidence does not claim coverage",
    () =>
      measureAutoMoviePlacedContinuity(transform).status === "unsupported" &&
      missing.status === "checked" &&
      missing.violations.length === 1 &&
      missing.violations[0]?.path === "props.lantern.world",
  );

  const edge: IStepCheck = {
    kind: "step",
    path: "actors.rook.root",
    boundary: "continuous",
    before: { seconds: 1.25, transform: IDENTITY_TRANSFORM },
    after: {
      seconds: 1.5,
      transform: {
        ...IDENTITY_TRANSFORM,
        translation: { x: 0.5, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: -1 },
      },
    },
  };
  const jump = measureAutoMoviePlacedContinuity({
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
  const unbounded = measureAutoMoviePlacedContinuity(edge);
  TestValidator.predicate(
    "declared pair without a limit exposes its measurements",
    () =>
      unbounded.status === "checked" &&
      unbounded.motion !== undefined &&
      nclose(unbounded.motion.distance, 0.5) &&
      nclose(unbounded.motion.angle, 0) &&
      unbounded.violations.length === 0,
  );

  const seam = measureAutoMoviePlacedContinuity({
    ...edge,
    after: {
      seconds: edge.before.seconds,
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

  const reverse = measureAutoMoviePlacedContinuity({
    ...edge,
    before: edge.after,
    after: edge.before,
  });
  TestValidator.predicate(
    "intentional boundaries exclude pairs while unavailable or unordered pairs remain explicit",
    () =>
      measureAutoMoviePlacedContinuity({ ...edge, boundary: "cut" }).status ===
        "excluded" &&
      measureAutoMoviePlacedContinuity({ ...edge, boundary: "discontinuity" })
        .status === "excluded" &&
      measureAutoMoviePlacedContinuity({ ...edge, boundary: "unavailable" })
        .status === "unsupported" &&
      measureAutoMoviePlacedContinuity({
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
  const after = measureAutoMoviePlacedContinuity({
    ...custody,
    allowed: ["receiver.hand"],
    holder: "receiver.hand",
  });
  const closure = measureAutoMoviePlacedContinuity({
    ...custody,
    allowed: ["giver.hand"],
    holder: "giver.hand",
  });
  const early = measureAutoMoviePlacedContinuity({
    ...custody,
    allowed: ["giver.hand"],
    holder: "receiver.hand",
  });
  const dropped = measureAutoMoviePlacedContinuity({
    ...custody,
    allowed: ["receiver.hand"],
    holder: null,
  });
  const released = measureAutoMoviePlacedContinuity({
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
      measureAutoMoviePlacedContinuity({
        ...custody,
        allowed: ["receiver.hand"],
      }).status === "unsupported",
  );
};
