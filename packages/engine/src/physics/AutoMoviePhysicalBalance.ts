import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/convexHull2D";

/**
 * Linear-inverted-pendulum capture-point balance over an arbitrary support
 * polygon (Pratt et al., 2006). It predicts horizontal recovery only; solved
 * contacts and the subsequent simulation decide whether a step actually lands.
 * No support count or anatomical name selects a different law.
 */
export namespace AutoMoviePhysicalBalance {
  /** Current resolved support points in world metres. */
  export interface ISupport {
    /** Endpoint bone from the footfall pattern. */ bone: string;
    /** Contact patch vertices, not an invented standing footprint. */ points: IAutoMovieVector3[];
    /** Current endpoint world position. */ position: IAutoMovieVector3;
  }
  /** A prediction remains separate from the observed simulation outcome. */
  export interface IResult {
    /** Stable support, reachable recovery, or predicted loss of recovery. */ state:
      | "supported"
      | "recovery"
      | "unrecoverable";
    /** Horizontal COM plus velocity/sqrt(g/height), world metres. */ capturePoint: IAutoMovieVector3;
    /** Actual convex support hull. */ polygon: IAutoMovieVector3[];
    /** Metres outside the support polygon, zero when inside. */ outside: number;
    /** Recovery request goes back to the step planner; absent otherwise. */ step?: {
      bone: string;
      target: IAutoMovieVector3;
    };
  }
  /** Order reachable recovery supports by travel distance, then declared footfall phase. */
  export function assess(input: {
    center: IAutoMovieVector3;
    velocity: IAutoMovieVector3;
    gravity: number;
    floor: number;
    supports: ISupport[];
    pattern: IAutoMovieFootfallPattern;
    maximumStep: number;
    margin: number;
    unavailable: readonly string[];
  }): IResult {
    const height: number = input.center.y - input.floor;
    if (
      !(input.gravity > 0) ||
      !Number.isFinite(input.gravity) ||
      !(input.maximumStep > 0) ||
      !Number.isFinite(input.maximumStep) ||
      !Number.isFinite(input.margin) ||
      input.margin < 0 ||
      ![
        input.center.x,
        input.center.y,
        input.center.z,
        input.velocity.x,
        input.velocity.y,
        input.velocity.z,
        input.floor,
      ].every(Number.isFinite)
    )
      throw new Error("Invalid physical balance state or limits");
    const omega: number =
      height > 0 ? Math.sqrt(input.gravity / height) : Infinity;
    const capturePoint: IAutoMovieVector3 = {
      x: input.center.x + input.velocity.x / omega,
      y: input.floor,
      z: input.center.z + input.velocity.z / omega,
    };
    const polygon: IAutoMovieVector3[] = convexHull2D(
      input.supports.flatMap(
        (support: (typeof input.supports)[number]): IAutoMovieVector3[] =>
          support.points,
      ),
    );
    let inside: boolean = polygon.length >= 3;
    let outside: number = Infinity;
    for (let i: number = 0; i < polygon.length; i++) {
      const a: IAutoMovieVector3 = polygon[i]!;
      const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
      const dx: number = b.x - a.x;
      const dz: number = b.z - a.z;
      const denominator: number = dx * dx + dz * dz;
      const t: number =
        denominator === 0
          ? 0
          : Math.max(
              0,
              Math.min(
                1,
                ((capturePoint.x - a.x) * dx + (capturePoint.z - a.z) * dz) /
                  denominator,
              ),
            );
      outside = Math.min(
        outside,
        Math.hypot(
          capturePoint.x - a.x - dx * t,
          capturePoint.z - a.z - dz * t,
        ),
      );
      if (dx * (capturePoint.z - a.z) - dz * (capturePoint.x - a.x) < 0)
        inside = false;
    }
    if (inside) outside = 0;
    const result: IResult = {
      state: "unrecoverable",
      capturePoint,
      polygon,
      outside,
    };
    if (height <= 0 || polygon.length === 0) return result;
    if (outside <= input.margin) return { ...result, state: "supported" };
    const centroid: IAutoMovieVector3 = Vector3.scale(
      input.supports.reduce(
        (sum: IAutoMovieVector3, support: ISupport): IAutoMovieVector3 =>
          Vector3.add(sum, support.position),
        { x: 0, y: 0, z: 0 },
      ),
      1 / input.supports.length,
    );
    const direction: IAutoMovieVector3 = {
      x: capturePoint.x - centroid.x,
      y: 0,
      z: capturePoint.z - centroid.z,
    };
    const denominator: number = direction.x ** 2 + direction.z ** 2;
    const candidates: {
      support: ISupport;
      phase: number;
      distance: number;
      target: IAutoMovieVector3;
    }[] = input.supports
      .flatMap(
        (
          support: (typeof input.supports)[number],
        ): {
          support: ISupport;
          phase: number;
          distance: number;
          target: IAutoMovieVector3;
        }[] => {
          const limb: IAutoMovieFootfallPattern["limbs"][number] | undefined =
            input.pattern.limbs.find(
              (candidate: (typeof input.pattern.limbs)[number]): boolean =>
                candidate.bone === support.bone,
            );
          const offset: IAutoMovieVector3 = {
            x: support.position.x - centroid.x,
            y: 0,
            z: support.position.z - centroid.z,
          };
          const along: number =
            denominator > 0 ? Vector3.dot(offset, direction) / denominator : 0;
          const target: IAutoMovieVector3 = Vector3.add(
            capturePoint,
            Vector3.subtract(offset, Vector3.scale(direction, along)),
          );
          const distance: number = Math.hypot(
            target.x - support.position.x,
            target.z - support.position.z,
          );
          return limb &&
            !input.unavailable.includes(support.bone) &&
            distance <= input.maximumStep
            ? [{ support, phase: limb.phase, distance, target }]
            : [];
        },
      )
      .sort(
        (
          a: {
            support: ISupport;
            phase: number;
            distance: number;
            target: IAutoMovieVector3;
          },
          b: {
            support: ISupport;
            phase: number;
            distance: number;
            target: IAutoMovieVector3;
          },
        ): number => a.distance - b.distance || a.phase - b.phase,
      );
    const chosen: (typeof candidates)[number] | undefined = candidates[0];
    if (!chosen || input.supports.length - 1 < input.pattern.minimumSupports)
      return result;
    return {
      ...result,
      state: "recovery",
      step: { bone: chosen.support.bone, target: chosen.target },
    };
  }
}
