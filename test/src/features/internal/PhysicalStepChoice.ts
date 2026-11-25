import { AutoMoviePhysicalBalance } from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The recovery step choice's test fixtures: the stance constants, rectangular
 * foot patches, a footfall pattern over them, and a hand-built convex hull and
 * depth to check a landing against, independent of the engine's polygon
 * routines.
 */
export namespace PhysicalStepChoice {
  /** Gravity, metres per second squared. */
  export const G: number = 9.81;

  /** The centre of mass's height over the floor, metres. */
  export const HEIGHT: number = 0.9;

  /** The stance's centre-of-pressure inset, metres. */
  export const INSET: number = 0.02;

  /** The capture point's accepted excursion past the shrunken support, metres. */
  export const MARGIN: number = 0.01;

  /** The swing's unloading ramp, peak acceleration, clearance and ramp-in. */
  export const SWING = {
    ramp: 0.05,
    acceleration: 30,
    height: 0.05,
    landing: 0.05,
  };

  /** The longest step, metres. */
  export const REACH: number = 0.5;

  /** The forward heading. */
  export const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

  /** A rectangular foot patch on the floor. */
  export function foot(
    bone: string,
    x0: number,
    x1: number,
    z0: number,
    z1: number,
  ): IAutoMoviePhysicalSupportPatch {
    return {
      bone,
      points: [
        { x: x0, y: 0, z: z0 },
        { x: x1, y: 0, z: z0 },
        { x: x1, y: 0, z: z1 },
        { x: x0, y: 0, z: z1 },
      ],
      position: { x: (x0 + x1) / 2, y: 0, z: (z0 + z1) / 2 },
    };
  }

  /** A footfall pattern naming the given limbs, one support required to stay. */
  export function pattern(bones: string[]): IAutoMovieFootfallPattern {
    return {
      id: "test",
      limbs: bones.map((bone: string, index: number) => ({
        bone,
        chain: [bone],
        phase: index / bones.length,
        duty: 0.5,
        offset: { forward: 0, left: 0 },
        stride: [{ speed: 0, length: 0 }],
      })),
      minimumSupports: 1,
    };
  }

  /**
   * Assess a body at rest whose capture point is `capture`, over `supports`,
   * with any further request fields.
   */
  export function assess(
    supports: IAutoMoviePhysicalSupportPatch[],
    capture: IAutoMovieVector3,
    extra: Partial<IAutoMoviePhysicalBalance.IAssessInput> = {},
  ): IAutoMoviePhysicalBalance.IResult {
    return AutoMoviePhysicalBalance.assess({
      center: { x: capture.x, y: HEIGHT, z: capture.z },
      velocity: { x: 0, y: 0, z: 0 },
      gravity: G,
      floor: 0,
      supports,
      pattern: pattern(supports.map((support) => support.bone)),
      maximumStep: REACH,
      margin: MARGIN,
      unavailable: [],
      swing: SWING,
      inset: INSET,
      heading: FORWARD,
      ...extra,
    });
  }

  /**
   * The quickest swing over a distance: the minimum-jerk transfer's time or the
   * clearance's, whose peak accelerations are 5.77 d / T^2 and 24 h / T^2, and
   * no shorter than 0.3 s (Khadiv et al. 2017).
   */
  export function swing(d: number): number {
    return Math.max(
      0.3,
      Math.sqrt(Math.max(5.77 * d, 24 * SWING.height) / SWING.acceleration),
    );
  }

  /** A convex hull of floor points, counter-clockwise from above. */
  export function hull(points: readonly IAutoMovieVector3[]): IAutoMovieVector3[] {
    const sorted: IAutoMovieVector3[] = [...points].sort(
      (a, b) => a.x - b.x || a.z - b.z,
    );
    const cross = (
      o: IAutoMovieVector3,
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
    ): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const half = (list: IAutoMovieVector3[]): IAutoMovieVector3[] => {
      const out: IAutoMovieVector3[] = [];
      for (const p of list) {
        while (
          out.length >= 2 &&
          cross(out[out.length - 2]!, out[out.length - 1]!, p) <= 0
        )
          out.pop();
        out.push(p);
      }
      return out.slice(0, -1);
    };
    return [...half(sorted), ...half([...sorted].reverse())];
  }

  /**
   * How deep a point lies inside a counter-clockwise convex polygon, metres:
   * its least distance to an edge, negative outside.
   */
  export function inside(
    polygon: readonly IAutoMovieVector3[],
    point: IAutoMovieVector3,
  ): number {
    return Math.min(
      ...polygon.map((a: IAutoMovieVector3, i: number): number => {
        const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
        return (
          ((b.x - a.x) * (point.z - a.z) - (b.z - a.z) * (point.x - a.x)) /
          Math.hypot(b.x - a.x, b.z - a.z)
        );
      }),
    );
  }
}
