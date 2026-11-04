import { AutoMovieHumanLoftChain } from "../../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";

/**
 * The glenohumeral centre from the shoulders the trunk builds, by the same
 * rule for every person: `AutoMovieHumanArmBones.ACROMION` of acromion-radiale
 * straight under the shoulder point (de Leva 1996 Table 2; ISO 8559-1 3.1.1
 * puts the shoulder point on the skin straight above the acromion's lateral
 * edge), and across the body the arm root's girth radius inside the shoulder
 * section's lateral extremity at that height, fore and aft among the points
 * that near the extremity.
 *
 * It reads no arm and no elbow, so the bones can be placed from it. The trunk
 * will publish this centre from its own inputs; until then the arm and the
 * skeleton both take it from here.
 */
export namespace AutoMovieHumanArmShoulder {
  /**
   * The glenohumeral centre of a side, world millimetres.
   *
   * @param calibration Calibration holding the `upper` chain and its event.
   * @param side Side.
   * @param acromionRadiale Acromion-radiale length, mm.
   */
  export function glenohumeral(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
    acromionRadiale: number,
  ): Vec3 {
    const upper: IAutoMovieHumanLoftChain = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "upper",
    )!;
    const s: number = side === "left" ? 1 : -1;
    const lo: number = upper.layers[0]!.y;
    const hi: number = upper.layers[upper.layers.length - 1]!.y;
    const radius: number = rootRadius(upper, calibration, side);
    const below: number = AutoMovieHumanArmBones.ACROMION * acromionRadiale;
    const deltoid = (y: number): Vec3 => {
      const cap: Vec3[] = AutoMovieHumanLoftChain.ring(upper, Math.min(hi, Math.max(lo, y)), PHASES).filter(
        (p: Vec3): boolean => s * p[2] > 0,
      );
      const lateral: number = Math.max(...cap.map((p: Vec3): number => s * p[2]));
      const xs: number[] = cap.filter((p: Vec3): boolean => s * p[2] > lateral - radius).map((p: Vec3): number => p[0]);
      return [xs.reduce((a: number, b: number): number => a + b, 0) / xs.length, y, s * (lateral - radius)];
    };

    // The point the vertical through the centre leaves the shoulders' skin:
    // the highest section holding it.
    const top = (x: number, z: number, from: number): number => {
      let a: number = Math.max(lo, from);
      let b: number = hi;
      if (!inside(AutoMovieHumanLoftChain.ring(upper, a, PHASES), x, z)) return a;
      for (let i: number = 0; i < STEPS; i++) {
        const m: number = (a + b) / 2;
        if (inside(AutoMovieHumanLoftChain.ring(upper, m, PHASES), x, z)) a = m;
        else b = m;
      }
      return (a + b) / 2;
    };

    // The centre's height and its place across the body settle in turns:
    // each moves the other by a share of its own change.
    let y: number = (lo + hi) / 2;
    for (let pass: number = 0; pass < PASSES; pass++) {
      const p: Vec3 = deltoid(y);
      y = top(p[0], p[2], lo) - below;
    }
    return deltoid(y);
  }
}

/** A point. */
type Vec3 = [number, number, number];

/** Phases sampling a section. */
const PHASES: number[] = Array.from({ length: 192 }, (_: unknown, i: number): number => (2 * Math.PI * i) / 192);

/** Bisections of a height. */
const STEPS: number = 30;

/** Turns between the centre's height and its place. */
const PASSES: number = 6;

/** Samples of the arm's arc of the shoulder ring. */
const RING: number = 512;

/** Whether `(x, z)` lies inside a section's outline in the level plane. */
function inside(ring: readonly Vec3[], x: number, z: number): boolean {
  let odd: boolean = false;
  for (let i: number = 0, j: number = ring.length - 1; i < ring.length; j = i++) {
    const a: Vec3 = ring[i]!;
    const b: Vec3 = ring[j]!;
    if (a[2] > z !== b[2] > z && x < ((b[0] - a[0]) * (z - a[2])) / (b[2] - a[2]) + a[0]) odd = !odd;
  }
  return odd;
}

/** Girth radius of the arm's root: its arc of the shoulder ring, closed. */
function rootRadius(
  upper: IAutoMovieHumanLoftChain,
  calibration: IAutoMovieHumanBodyCalibration,
  side: "left" | "right",
): number {
  const event: IAutoMovieHumanBodyCalibration.IEvent = calibration.events.find(
    (e: IAutoMovieHumanBodyCalibration.IEvent): boolean => e.parent === "upper" && e.direction === "down",
  )!;
  const ring: Vec3[] = event.splits
    .find((sp: IAutoMovieHumanBodyCalibration.ISplit): boolean => sp.child === `arm.${side}`)!
    .arcs.flatMap(([from, to]: [number, number]): Vec3[] => {
      const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
      return AutoMovieHumanLoftChain.ring(
        upper,
        upper.layers[0]!.y,
        Array.from({ length: RING }, (_: unknown, i: number): number => from + (span * i) / RING),
      );
    });
  let perimeter: number = 0;
  ring.forEach((p: Vec3, i: number): void => {
    const q: Vec3 = ring[(i + 1) % ring.length]!;
    perimeter += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
  });
  return perimeter / (2 * Math.PI);
}
