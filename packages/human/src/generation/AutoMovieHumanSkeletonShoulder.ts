import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanSkeletonChain } from "./AutoMovieHumanSkeletonChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

type Vec3 = AutoMovieHumanSkeletonChain.Vec3;
const { distance, PHASES, RING, start, stop } = AutoMovieHumanSkeletonChain;

/**
 * The skeleton's shoulders: the glenohumeral centre one humerus from the
 * elbow, where the deltoid's skin stands one arm-root radius outside it.
 */
export namespace AutoMovieHumanSkeletonShoulder {
  /** Bisections of the shoulder's height. */
  export const SHOULDER_STEPS: number = 30;

  /**
   * The glenohumeral joint: one humerus from the elbow, where the deltoid's skin
   * stands one arm radius outside it.
   *
   * At a height the shoulder's section has its lateral extremity, and the joint
   * lies the arm root's girth radius inside it, fore and aft among the points
   * that near the extremity. The height is the one at which that point lies the
   * humerus' length from the elbow. A height read as a fraction of stature would
   * not follow the shoulders, which the construction places from the head down.
   */
  export function shoulder(
    upper: IAutoMovieHumanLoftChain,
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
    elbow: Vec3,
    humerus: number,
  ): Vec3 {
    const s: number = side === "left" ? 1 : -1;
    const radius: number = rootRadius(upper, calibration, side);
    const deltoid = (y: number): Vec3 => {
      const cap: Vec3[] = AutoMovieHumanLoftChain.ring(
        upper,
        Math.min(stop(upper), Math.max(start(upper), y)),
        PHASES,
      ).filter((p: Vec3): boolean => s * p[2] > 0);
      const lateral: number = Math.max(...cap.map((p: Vec3): number => s * p[2]));
      const xs: number[] = cap
        .filter((p: Vec3): boolean => s * p[2] > lateral - radius)
        .map((p: Vec3): number => p[0]);
      return [
        xs.reduce((a: number, b: number): number => a + b, 0) / xs.length,
        y,
        s * (lateral - radius),
      ];
    };
    // Going up, the point rises and the shoulder narrows, so its distance from
    // the elbow only grows: bisect for the height. Shoulders that end first keep
    // the joint at their top.
    let low: number = Math.max(start(upper), elbow[1]);
    let high: number = stop(upper);
    if (distance(deltoid(high), elbow) <= humerus) return deltoid(high);
    for (let i: number = 0; i < SHOULDER_STEPS; i++) {
      const mid: number = (low + high) / 2;
      if (distance(deltoid(mid), elbow) < humerus) low = mid;
      else high = mid;
    }
    return deltoid((low + high) / 2);
  }

  /** Girth radius of the arm's root: its arc of the shoulder ring, closed. */
  export function rootRadius(
    upper: IAutoMovieHumanLoftChain,
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
  ): number {
    const event: IAutoMovieHumanBodyCalibration.IEvent = calibration.events.find(
      (e: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
        e.parent === "upper" && e.direction === "down",
    )!;
    const ring: Vec3[] = event.splits
      .find(
        (sp: IAutoMovieHumanBodyCalibration.ISplit): boolean =>
          sp.child === `arm.${side}`,
      )!
      .arcs.flatMap(([from, to]: [number, number]): Vec3[] => {
        const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
        return AutoMovieHumanLoftChain.ring(
          upper,
          upper.layers[0]!.y,
          Array.from(
            { length: RING },
            (_: unknown, i: number): number => from + (span * i) / RING,
          ),
        );
      });
    let perimeter: number = 0;
    ring.forEach((p: Vec3, i: number): void => {
      perimeter += distance(ring[(i + 1) % ring.length]!, p);
    });
    return perimeter / (2 * Math.PI);
  }
}