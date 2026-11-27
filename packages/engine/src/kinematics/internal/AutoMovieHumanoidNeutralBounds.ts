import type {
  IAutoMoviePhysicalSegment,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { physicalShapeBoundsImplementation } from "../../physics/internal/physicalShapeBoundsImplementation";

/*
 * Operation-owned exact neutral segment bounds for sequential body derivation.
 * Ordinary reads are fresh; an optional prepared handle shares the bounds its
 * profile's segments were measured with once at preparation. Geometry stays
 * unchanged until release.
 */
export namespace AutoMovieHumanoidNeutralBounds {
  /*
   * One unchanged-profile epoch with every segment's bounds measured.
   */
  export interface IPrepared {
    /*
     * Borrowed unchanged source for identity admission.
     */
    readonly profile: P;

    /*
     * One six-coordinate result per actual segment object; empty after release.
     */
    readonly bounds: Map<IAutoMoviePhysicalSegment, IBounds>;
  }

  /*
   * Exact axis bounds in world metres; every outward copy owns its vectors.
   */
  export interface IBounds {
    /*
     * Axis minima, world metres.
     */
    min: IAutoMovieVector3;

    /*
     * Axis maxima, world metres.
     */
    max: IAutoMovieVector3;
  }

  /*
   * Start a bounds epoch, measuring each segment of the profile once.
   */
  export function prepare(profile: P): IPrepared {
    const bounds: Map<IAutoMoviePhysicalSegment, IBounds> = new Map();
    for (const segment of profile.segments)
      bounds.set(segment, calculate(segment));
    return { profile, bounds };
  }

  /*
   * Read fresh independent vectors, optionally sharing a live epoch.
   */
  export function read(
    profile: P,
    segment: IAutoMoviePhysicalSegment,
    handle?: IPrepared,
  ): IBounds {
    if (handle === undefined) return calculate(segment);
    const bounds: IBounds | undefined =
      handle.profile === profile ? handle.bounds.get(segment) : undefined;
    if (bounds === undefined)
      throw new Error(
        "Neutral bounds need their live unchanged profile and segment",
      );
    return { min: { ...bounds.min }, max: { ...bounds.max } };
  }

  /*
   * End the epoch and invalidate every later read; repeated release is
   * harmless.
   */
  export function release(handle: IPrepared): void {
    handle.bounds.clear();
  }
}

/*
 * Preserve the original component update order without a per-shape axis array.
 */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];

/*
 * Every original collider contributes in original shape/component order.
 */
function calculate(
  segment: IAutoMoviePhysicalSegment,
): AutoMovieHumanoidNeutralBounds.IBounds {
  const bounds: AutoMovieHumanoidNeutralBounds.IBounds = {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  };
  for (const shape of segment.shapes) {
    const next: AutoMovieHumanoidNeutralBounds.IBounds =
      physicalShapeBoundsImplementation.physicalShapeBounds(
        segment.neutral,
        shape,
      );
    for (const axis of AXES) {
      bounds.min[axis] = Math.min(bounds.min[axis], next.min[axis]);
      bounds.max[axis] = Math.max(bounds.max[axis], next.max[axis]);
    }
  }
  return bounds;
}
