import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieFramingGoal } from "./IAutoMovieFramingGoal";

/**
 * A camera pose meeting a framing goal from the subjects' actual bounding
 * spheres: the target is the centre of the smallest sphere about their
 * centroid that contains every subject sphere, and the camera stands on the
 * goal's bearing and elevation at the distance where that sphere's diameter
 * fills the declared share of the vertical field of view,
 * `d = r / (fill tan(fov / 2))`.
 *
 * @param goal The framing goal.
 * @param state Each subject's bounding sphere at the instant.
 * @returns The camera position, its look-at target and field of view.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A camera pose meeting a framing goal from the subjects' actual bounding spheres: the target is the centre of the smallest sphere about their centroid that contains every subject sphere, and the camera stands on the goal's bearing and elevation at the distance where that sphere's diameter fills the declared share of the vertical field of view, `d = r / (fill tan(fov / 2))`) and documents parameters `goal`, `state`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (A camera pose meeting a framing goal from the subjects' actual bounding spheres: the target is the centre of the smallest sphere about their centroid that contains every subject sphere, and the camera stands on the goal's bearing and elevation at the distance where that sphere's diameter fills the declared share of the vertical field of view, `d = r / (fill tan(fov / 2))`) directly over its typed inputs (`goal`, `state`) as 5 sequential passes (map over goal.subjects; reduce over spheres; reduce over spheres), delegating to `Math.abs`, `spheres.reduce`, `Math.max`, `spheres.map`, `Math.hypot`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 60 lines and 8 top-level statements that reuses `Math.abs`, `spheres.reduce`, `Math.max`, `spheres.map`, `Math.hypot` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `goal`, `state`; the dominant cost is 5 sequential passes (map over goal.subjects; reduce over spheres; reduce over spheres), performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function resolveAutoMovieFraming(
  goal: IAutoMovieFramingGoal,
  state: Readonly<
    Record<string, { center: IAutoMovieVector3; radius: number }>
  >,
): resolveAutoMovieFraming.ICamera {
  if (
    goal.subjects.length === 0 ||
    !(goal.fill > 0 && goal.fill <= 1) ||
    !(goal.fieldOfView > 0 && goal.fieldOfView < Math.PI) ||
    !(Math.abs(goal.elevation) < Math.PI / 2)
  )
    throw new Error("Invalid AutoMovie framing goal");
  const spheres: { center: IAutoMovieVector3; radius: number }[] =
    goal.subjects.map(
      (id: string): { center: IAutoMovieVector3; radius: number } => {
        const sphere:
          | { center: IAutoMovieVector3; radius: number }
          | undefined = state[id];
        if (!sphere) throw new Error(`Unknown framed subject ${id}`);
        return sphere;
      },
    );
  const n: number = spheres.length;
  const target: IAutoMovieVector3 = {
    x:
      spheres.reduce(
        (s: number, c: { center: IAutoMovieVector3 }): number => s + c.center.x,
        0,
      ) / n,
    y:
      spheres.reduce(
        (s: number, c: { center: IAutoMovieVector3 }): number => s + c.center.y,
        0,
      ) / n,
    z:
      spheres.reduce(
        (s: number, c: { center: IAutoMovieVector3 }): number => s + c.center.z,
        0,
      ) / n,
  };
  const radius: number = Math.max(
    ...spheres.map(
      (c: { center: IAutoMovieVector3; radius: number }): number =>
        Math.hypot(
          c.center.x - target.x,
          c.center.y - target.y,
          c.center.z - target.z,
        ) + c.radius,
    ),
  );
  const distance: number =
    radius / (goal.fill * Math.tan(goal.fieldOfView / 2));
  const horizontal: number = distance * Math.cos(goal.elevation);
  return {
    position: {
      x: target.x + horizontal * Math.sin(goal.bearing),
      y: target.y + distance * Math.sin(goal.elevation),
      z: target.z + horizontal * Math.cos(goal.bearing),
    },
    target,
    fieldOfView: goal.fieldOfView,
    radius,
  };
}
/**
 * Companion types of {@link resolveAutoMovieFraming}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Companion types of ) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Companion types of : companion namespace of 1 member (`ICamera`); units and frames named in its text: world, metres, radians. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `resolveAutoMovieFraming` in packages/engine/src/composition/resolveAutoMovieFraming.ts; its surface is the 1 member listed and the text shows 4 other files naming it, mostly packages/engine (2), movies (1), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace resolveAutoMovieFraming {
  /** A resolved camera. */
  export interface ICamera {
    /** Camera position, world metres. */
    position: IAutoMovieVector3;

    /** Look-at target, world metres. */
    target: IAutoMovieVector3;

    /** Vertical field of view, radians. */
    fieldOfView: number;

    /** Radius of the framed bounding sphere, metres. */
    radius: number;
  }
}
