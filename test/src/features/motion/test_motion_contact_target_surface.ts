import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanSkill,
  IAutoMovieMotionHumanTouchSite,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSkill, touchSite } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A site belongs to the tangent plane of its region. The reach rule chooses the closest point of its closed disk.
 *
 * Scenarios:
 * 1. Project the shoulder at the centre, inside, on and outside a disk.
 * 2. Fix a site on the horizontal tangent plane, then move a seeded site with its region.
 * 3. Collapse the disk to zero radius and refuse negative radii.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads site frames under changing shoulder and region positions. A fixed centre, wrong axis, inverted radius or fresh draw changes the returned coordinates.
 * @evidence contracts/development/testing.md#independent-expectations Orthogonal projection followed by radial clipping minimizes distance to a closed disk. The explicit coordinates use a 3:4:5 triangle and the coordinate axes.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks interior, exact perimeter, exterior and normal-only displacements, a vertical normal, zero radius and negative radius.
 * @evidence contracts/development/testing.md#execution-ownership Uses the public site primitive, in-memory vectors and a real seeded variation stream.
 * @evidence contracts/development/common.md#meaningful-documentation Describes the projection, coordinate frames and domain.
 */
export function test_motion_contact_target_surface(): void {
  const skill: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
    { p: 0 },
    "site",
  );
  const context: Pick<IAutoMovieMotionHumanActionContext, "series"> = {
    series: (channel: string): IAutoMovieMotionHumanActionContext.ISeries => ({
      random: HumanSkill.series(skill, "a", "touch", channel),
      index: 0,
    }),
  };
  const frame: IAutoMovieMotionHumanTouchSite.IFrame = {
    point: { x: 1, y: 2, z: 3 },
    normal: { x: 0, y: 0, z: 1 },
  };
  const radius: number = 0.05;
  const nearest: ReturnType<typeof touchSite.of> = touchSite.of(context, {
    rule: "reach",
    within: radius,
  });
  for (const [scale, expected] of [
    [0, 0],
    [0.5, 0.5],
    [1, 1],
    [2, 1],
  ] as const) {
    const shoulder: IAutoMovieVector3 = Vector3.add(frame.point, {
      x: 0.03 * scale,
      y: 0.04 * scale,
      z: 0.4,
    });
    const target: IAutoMovieVector3 = Vector3.add(frame.point, {
      x: 0.03 * expected,
      y: 0.04 * expected,
      z: 0,
    });
    const site: IAutoMovieMotionHumanTouchSite.IFrame = nearest(
      frame,
      shoulder,
    );
    TestValidator.predicate(
      `nearest point at ${scale} radii`,
      Vector3.distance(site.point, target) <= 1e-12,
    );
    TestValidator.equals(
      "the normal remains the region normal",
      site.normal,
      frame.normal,
    );
  }
  const upward: IAutoMovieMotionHumanTouchSite.IFrame = {
    point: frame.point,
    normal: { x: 0, y: 1, z: 0 },
  };
  const fixed: ReturnType<typeof touchSite.of> = touchSite.of(context, {
    up: 0.02,
    out: 0.04,
  });
  TestValidator.predicate(
    "a horizontal plane carries the stated offset",
    Vector3.distance(fixed(upward, frame.point).point, {
      x: 0.96,
      y: 2,
      z: 3.02,
    }) <= 1e-12,
  );
  const draw: ReturnType<typeof touchSite.of> = touchSite.of(context, {
    draw: radius,
  });
  const offset: IAutoMovieVector3 = Vector3.subtract(
    draw(frame, frame.point).point,
    frame.point,
  );
  TestValidator.predicate(
    "the drawn site belongs to the disk",
    offset.z === 0 && Vector3.length(offset) <= radius,
  );
  const moved: IAutoMovieMotionHumanTouchSite.IFrame = {
    ...frame,
    point: { x: 3, y: 2, z: 1 },
  };
  TestValidator.predicate(
    "the offset rides a translated frame",
    Vector3.distance(
      draw(moved, frame.point).point,
      Vector3.add(moved.point, offset),
    ) <= 1e-12,
  );
  const zero: ReturnType<typeof touchSite.of> = touchSite.of(context, {
    rule: "reach",
    within: 0,
  });
  TestValidator.equals(
    "zero radius keeps the centre",
    zero(frame, moved.point).point,
    frame.point,
  );
  TestValidator.error("negative reach radius", () =>
    touchSite.of(context, { rule: "reach", within: -radius }),
  );
  TestValidator.error("negative draw radius", () =>
    touchSite.of(context, { draw: -radius }),
  );
}
