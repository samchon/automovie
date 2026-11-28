import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanProp,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  HumanGraspTarget
} from "../../../../../packages/motions/src/handling/internal/HumanGraspTarget";
import { TestValidator } from "@nestia/e2e";

import { testAffordance } from "../../internal/fixtures/testAffordance";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** Rounding of composed unit quarter turns and decimetre translations. */
const ROUNDING: number = 1e-12;

/** No turn in the prop's collider frame. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** Local +X to +Y and local −Y to +X. */
const TURN: IAutoMovieQuaternion = {
  x: 0,
  y: 0,
  z: Math.SQRT1_2,
  w: Math.SQRT1_2,
};

/**
 * Pin the pickup owner's named target without planning an arm or a film.
 *
 * Scenarios:
 * 1. A body grip retains its authored aperture and opposite approach. After a
 *    prop's quarter turn about +Y, its local +X inward line becomes world −Z,
 *    and its wrapped axis remains +Y.
 * 2. A hook with no explicit aperture spans the nearest collider, whose local
 *    X half width is 4 mm. Removing the name or the colliders refuses the
 *    corresponding input and identifies a repair.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines placed named grip, inferred aperture, approach frame, and remedies for missing sites or collider geometry.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares a body grip through two prop poses, inspects one hook with no aperture and submits nonexistent site and collider-free models.
 * @evidence contracts/development/testing.md#independent-expectations A quarter turn carries the authored local inward +X into world −Z while retaining +Y as the wrapped axis. A 4 mm half-width determines the hook's collider-derived aperture.
 */
export function test_motions_handling_grasp_target(): void {
  const placed: IAutoMovieRigidTransform = {
    position: { x: 1, y: 2, z: 3 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  };
  const body: IAutoMovieAffordance = testAffordance(
    "body",
    "handle",
    { x: 0.1, y: 0.065, z: 0.04 },
    TURN,
    { grip: "power", aperture: 0.08 },
  );
  const hook: IAutoMovieAffordance = testAffordance(
    "handle",
    "handle",
    { x: 0.25, y: 0.04, z: 0.04 },
    { x: 0, y: 0, z: -Math.SQRT1_2, w: Math.SQRT1_2 },
    { grip: "hook" },
  );
  const shapes: IAutoMoviePhysicalShape[] = [
    {
      id: "body",
      kind: "box",
      material: "ceramic",
      transform: { position: body.frame.translation, rotation: IDENTITY },
      halfExtents: { x: 0.05, y: 0.065, z: 0.04 },
    },
    {
      id: "handle",
      kind: "box",
      material: "ceramic",
      transform: { position: hook.frame.translation, rotation: IDENTITY },
      halfExtents: { x: 0.004, y: 0.015, z: 0.006 },
    },
  ];
  const mug: IAutoMovieMotionHumanProp = {
    subject: "mug",
    frame: placed,
    points: {},
    affordances: [body, hook],
    shapes,
  };
  const read: ReturnType<typeof HumanGraspTarget> = HumanGraspTarget(mug, "body");
  const target: IAutoMovieMotionHumanGrasp.ITarget = read.at(placed);
  TestValidator.predicate(
    "the named body grip uses the whole placed target",
    target.grip === "power" &&
      nclose(target.width, 0.08, ROUNDING) &&
      vclose(target.point, { x: 1.04, y: 2.065, z: 2.9 }, ROUNDING) &&
      vclose(target.approach, { x: 0, y: 0, z: -1 }, ROUNDING) &&
      vclose(target.axis, { x: 0, y: 1, z: 0 }, ROUNDING) &&
      target.colliders.length === shapes.length &&
      target.colliders.every(
        (collider, index): boolean =>
          collider.shape.id === shapes[index]?.id &&
          vclose(collider.frame.position, placed.position, ROUNDING),
      ),
  );
  const after: IAutoMovieMotionHumanGrasp.ITarget = read.at({
    position: { x: 1, y: 2, z: 4 },
    rotation: placed.rotation,
  });
  TestValidator.predicate(
    "one prepared grip follows the changed prop frame",
    vclose(after.point, { x: 1.04, y: 2.065, z: 3.9 }, ROUNDING) &&
      nclose(after.width, 0.08, ROUNDING) &&
      vclose(read.point(placed), { x: 1.04, y: 2.065, z: 2.9 }, ROUNDING),
  );

  const hooked: IAutoMovieMotionHumanGrasp.ITarget =
    HumanGraspTarget(mug, "handle").at(placed);
  TestValidator.predicate(
    "a hook reads the nearest bar across its own inward line",
    hooked.grip === "hook" &&
      nclose(hooked.width, 0.008, ROUNDING) &&
      vclose(hooked.point, { x: 1.04, y: 2.04, z: 2.75 }, ROUNDING) &&
      vclose(hooked.approach, { x: 0, y: 0, z: 1 }, ROUNDING),
  );

  TestValidator.predicate(
    "a glass reports its body as the alternative to an absent handle",
    throwsError(
      (): unknown => HumanGraspTarget({ ...mug, subject: "glass", affordances: [body] }, "handle"),
      ["handle:", "glass has no affordance handle", "it has body", "fix:"],
    ),
  );
  TestValidator.predicate(
    "a declared grip needs a physical collider",
    throwsError(
      (): unknown => HumanGraspTarget({ ...mug, shapes: [] }, "body"),
      ["prop:", "declares no colliders", "fingers close on", "fix:"],
    ),
  );
}
