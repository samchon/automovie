import {
  Quaternion,
  Vector3,
  distalEndSwivelNearest,
  distalTwistSwivelRange,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The swivels at which a distally twisting mid segment can take, inside its
 * twist range, the twist a requested end rotation leaves it, and the
 * admissible swivel nearest a desired one.
 *
 * A seeded case is a twist axis, an orthonormal pair of zero-twist
 * directions, a carried axis on a seeded circle of the unit sphere (a fixed
 * vector turned about a fixed axis by the swivel) and a twist range. The
 * oracle turns the carried axis about the twist axis itself: it steps the
 * twist a quarter degree at a time from a degree under the range to a degree
 * over it, and finds every twist at which the turned axis crosses the plane
 * perpendicular to the first direction while lying ahead of the second. A
 * swivel is surely admitted when such a twist lies half a degree inside the
 * range, surely refused when none lies within half a degree of it, and left
 * out otherwise.
 *
 * Scenarios:
 * 1. At every 5 degrees of 12 seeded circles the admission agrees with the
 *    oracle wherever the oracle is sure.
 * 2. Over the cases some swivels are admitted and some refused.
 * 3. Every breakpoint lies in [0, 360), and between two neighbouring
 *    breakpoints more than a degree apart the admission is the same at a
 *    quarter, a half and three quarters of the way.
 * 4. With no refused arc, the nearest admissible swivel to a seeded desired
 *    one is the desired one when it is admitted; otherwise it is admitted
 *    and no swivel of the degree grid the oracle surely admits lies nearer
 *    the desired one; and with no admitted swivel on the circle it is the
 *    desired one, the box's own candidate.
 */
export function test_unit_engine_kinematics_distal_twist_swivel_range(): void {
  const random: () => number = seeded(20261118);
  const wrong: string[] = [];
  const broken: string[] = [];
  const far: string[] = [];
  let admitted: number = 0;
  let refused: number = 0;
  for (let k: number = 0; k < 12; ++k) {
    const axis: IAutoMovieVector3 = unit(random);
    const normal: IAutoMovieVector3 = unit(random);
    const ahead: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(normal, unit(random)),
    );
    const carried: (swivel: number) => IAutoMovieVector3 = circling(random);
    const low: number = -90 + 60 * random();
    const range: readonly [number, number] = [low, low + 60 + 120 * random()];
    const read: distalTwistSwivelRange.IRange = distalTwistSwivelRange.of({
      axis,
      normal,
      ahead,
      carried,
      range,
    });

    // The twists at which the turned axis reads the zero, by scanning.
    const sure = (swivel: number): boolean | null => {
      const x: IAutoMovieVector3 = carried(swivel);
      const at = (twist: number): IAutoMovieVector3 =>
        Quaternion.rotateVector(Quaternion.fromAxisAngle(axis, -twist), x);
      let inside: boolean = false;
      let near: boolean = false;
      let before: IAutoMovieVector3 = at(range[0] - 1);
      for (let twist: number = range[0] - 0.75; twist <= range[1] + 1; twist += 0.25) {
        const here: IAutoMovieVector3 = at(twist);
        const a: number = Vector3.dot(normal, before);
        const b: number = Vector3.dot(normal, here);
        const front: number = Math.min(Vector3.dot(ahead, before), Vector3.dot(ahead, here));
        if (a * b <= 0 && a !== b && front > 0) {
          const root: number = twist - 0.25 + (0.25 * a) / (a - b);
          if (root >= range[0] + 0.5 && root <= range[1] - 0.5) inside = true;
          if (root >= range[0] - 0.5 && root <= range[1] + 0.5) near = true;
        }

        // A graze of the plane, or a crossing where the axis is barely
        // ahead, is one the quarter-degree scan cannot decide.
        if ((Math.abs(b) < 0.01 && a * b > 0) ||
          (a * b <= 0 && Math.abs(front) < 0.01)) near = true;
        before = here;
      }
      return inside ? true : near ? null : false;
    };
    for (let swivel: number = 0; swivel < 360; swivel += 5) {
      const expected: boolean | null = sure(swivel);
      if (expected === null) continue;
      if (expected) ++admitted; else ++refused;
      if (read.admits(swivel) !== expected && wrong.length < 10)
        wrong.push(`case ${k} swivel ${swivel}: admits ${read.admits(swivel)}, the scan ${expected}`);
    }

    const breaks: number[] = [...read.breaks].sort((a: number, b: number): number => a - b);
    for (const at of breaks)
      if (!(at >= 0 && at < 360) && broken.length < 10)
        broken.push(`case ${k}: breakpoint ${at} outside [0, 360)`);
    for (let i: number = 0; i < breaks.length; ++i) {
      const from: number = breaks[i]!;
      const to: number = i + 1 < breaks.length ? breaks[i + 1]! : breaks[0]! + 360;
      if (to - from <= 1) continue;
      const inside: boolean[] = [0.25, 0.5, 0.75].map(
        (share: number): boolean => read.admits(from + share * (to - from)),
      );
      if ((inside[0] !== inside[1] || inside[1] !== inside[2]) && broken.length < 10)
        broken.push(`case ${k}: admission changes between ${from} and ${to}`);
    }

    const grid: number[] = [];
    for (let swivel: number = 0; swivel < 360; ++swivel)
      if (sure(swivel) === true) grid.push(swivel);
    for (let i: number = 0; i < 4; ++i) {
      const desired: number = 360 * random();
      const apart = (swivel: number): number => {
        const turn: number = swivel - desired;
        return Math.abs(turn - 360 * Math.round(turn / 360));
      };
      const nearest: number | null = distalEndSwivelNearest([], read, desired);
      if (nearest === null) {
        far.push(`case ${k} desired ${desired}: no swivel though no arc is refused`);
        continue;
      }
      if (read.admits(desired)) {
        if (nearest !== desired && far.length < 10)
          far.push(`case ${k} desired ${desired}: admitted, but ${nearest} returned`);
        continue;
      }
      if (!read.admits(nearest)) {
        if ((grid.length > 0 || nearest !== desired) && far.length < 10)
          far.push(`case ${k} desired ${desired}: ${nearest} is not admitted, ${grid.length} grid swivels are`);
        continue;
      }
      for (const swivel of grid)
        if (apart(swivel) < apart(nearest) - 1e-5 && far.length < 10)
          far.push(`case ${k} desired ${desired}: ${swivel} is admitted and nearer than ${nearest}`);
    }
  }
  TestValidator.equals("the admission agrees with the turned axis", wrong, []);
  TestValidator.predicate(
    "some swivels are admitted and some refused",
    admitted > 0 && refused > 0,
  );
  TestValidator.equals("the admission changes only at a breakpoint", broken, []);
  TestValidator.equals("the nearest admissible swivel is the nearest", far, []);
}

/** A seeded unit vector. */
function unit(random: () => number): IAutoMovieVector3 {
  return Vector3.normalize({ x: random() - 0.5, y: random() - 0.5, z: random() - 0.5 });
}

/** A unit direction on a seeded circle of the unit sphere, by swivel in degrees. */
function circling(random: () => number): (swivel: number) => IAutoMovieVector3 {
  const axis: IAutoMovieVector3 = unit(random);
  const seed: IAutoMovieVector3 = unit(random);
  const u: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(seed, Vector3.scale(axis, Vector3.dot(seed, axis))));
  const v: IAutoMovieVector3 = Vector3.cross(axis, u);
  const along: number = 2 * random() - 1;
  const radius: number = Math.sqrt(1 - along * along);
  return (swivel: number): IAutoMovieVector3 => {
    const angle: number = swivel * Quaternion.DEG2RAD;
    return Vector3.add(
      Vector3.scale(axis, along),
      Vector3.add(Vector3.scale(u, radius * Math.cos(angle)), Vector3.scale(v, radius * Math.sin(angle))),
    );
  };
}

/** A seeded uniform generator on [0, 1) (mulberry32). */
function seeded(seed: number): () => number {
  let state: number = seed >>> 0;
  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t: number = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
