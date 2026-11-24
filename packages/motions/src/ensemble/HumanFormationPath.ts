import { speedProfile } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanFormation,
  IAutoMovieSpeedProfile,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/** The record of `ILayResult`'s site. */
type ILayResult = { at: IAutoMovieVector3; heading: number };

/** The record of `IAtResult`'s site. */
type IAtResult = { at: IAutoMovieVector3; heading: number };

/**
 * A path frame laid out on the film clock: where its origin is and which way it
 * faces at any second, read in closed form.
 *
 * The origin's distance along the path comes from the engine's speed profile
 * (`speedProfile`, P13, one owner of travel timing): a single cruising speed is
 * one stretch that accelerates, cruises and brakes to a stop at the path's end;
 * speed marks are held stretches and constant-rate changes at the frame's
 * acceleration, the last speed held until the frame brakes onto the end. The
 * heading is the path's direction, turned at each corner linearly in distance
 * over `turn` metres centred on the corner (at most half of either neighbouring
 * stretch), so it is continuous; a fixed heading is kept as given.
 */
export namespace HumanFormationPath {
  /** A laid path frame. */
  export interface ILaid {
    /** The path's length, metres. */
    length: number;

    /**
     * The film second the frame stops at the end, or its last mark's second
     * when it ends at rest before it.
     */
    end: number;

    /**
     * The frame at a film second.
     *
     * @param seconds Film seconds.
     * @returns Its origin and heading.
     */
    at(seconds: number): IAtResult;
  }

  /**
   * Lay a path frame out.
   *
   * @param frame The path frame.
   * @param acceleration Its acceleration and braking, metres per second
   *   squared.
   * @param turn Metres of path over which its heading turns at a corner.
   * @returns The laid frame.
   * @throws {HumanRefusal} When the path has fewer than two distinct corners, a
   *   speed or mark is not finite and nonnegative, marks overlap a change still
   *   under way, or the path is too short to stop on after the last mark.
   */
  export function lay(
    frame: IAutoMovieMotionHumanFormation.IPath,
    acceleration: number,
    turn: number,
  ): ILaid {
    const refuse = (
      axis: string,
      value: unknown,
      reason: string,
      fix: string,
    ): never => {
      throw new HumanRefusal({ kind: "parameter", axis, value, reason, fix });
    };

    // The stretches: each corner, its arc distance and the heading of the stretch it starts.
    const corners: readonly IAutoMovieVector3[] = frame.via;
    const stretches: IStretch[] = [];
    let total: number = 0;
    for (let i: number = 0; i + 1 < corners.length; ++i) {
      const dx: number = corners[i + 1]!.x - corners[i]!.x;
      const dz: number = corners[i + 1]!.z - corners[i]!.z;
      const length: number = Math.hypot(dx, dz);
      if (length < 1e-9) continue;
      stretches.push({
        from: corners[i]!,
        dx: dx / length,
        dz: dz / length,
        start: total,
        length,
        heading: (Math.atan2(dx, dz) * 180) / Math.PI,
      });
      total += length;
    }
    if (stretches.length === 0)
      refuse(
        "frame.via",
        corners.length,
        "a path frame needs two distinct corners",
        "give the path at least two corners apart",
      );

    // The profile: one cruise to a stop, or the marks held and changed at the frame's rates.
    const start: number = frame.start ?? 0;
    const profiled: IAutoMovieSpeedProfile.Stretch[] = [];
    if (typeof frame.speed === "number") {
      if (!(frame.speed > 0))
        refuse(
          "frame.speed",
          frame.speed,
          "a cruising speed is positive",
          "give a positive speed",
        );
      profiled.push({
        kind: "distance",
        length: total,
        speed: 0,
        cap: frame.speed,
      });
    } else {
      let v: number = 0;
      let t: number = start;
      let covered: number = 0;
      for (const mark of frame.speed.marks) {
        if (!(mark.speed >= 0))
          refuse(
            "frame.speed.marks",
            mark.speed,
            "a mark's speed is finite and nonnegative",
            "give a speed of at least 0",
          );
        if (!(mark.at >= t - 1e-9))
          refuse(
            "frame.speed.marks",
            mark.at,
            `the mark at ${mark.at} s comes before the change before it ends at ${t.toFixed(3)} s`,
            "space the marks so each change ends before the next begins",
          );
        if (mark.at > t + 1e-9) {
          profiled.push({ kind: "seconds", seconds: mark.at - t, speed: v });
          covered += v * (mark.at - t);
          t = mark.at;
        }
        const change: number = Math.abs(mark.speed - v) / acceleration;
        if (change > 0) {
          profiled.push({
            kind: "seconds",
            seconds: change,
            speed: mark.speed,
          });
          covered += ((v + mark.speed) * change) / 2;
          t += change;
        }
        v = mark.speed;
      }
      if (covered > total + 1e-9)
        refuse(
          "frame.speed.marks",
          covered,
          `the marks carry the frame ${covered.toFixed(2)} m along a ${total.toFixed(2)} m path`,
          "lengthen the path or end the marks sooner",
        );
      if (v > 0) {
        const left: number = total - covered;
        if (v * v > 2 * acceleration * left + 1e-9)
          refuse(
            "frame.speed.marks",
            v,
            `at ${v} m/s the frame needs ${((v * v) / (2 * acceleration)).toFixed(2)} m to stop and has ${left.toFixed(2)} m`,
            "lengthen the path, or end the marks at a lower speed",
          );
        profiled.push({ kind: "distance", length: left, speed: 0, cap: v });
      }
    }
    const profile: IAutoMovieSpeedProfile.IProfile = speedProfile({
      start,
      speed: 0,
      acceleration,
      deceleration: acceleration,
      stretches: profiled,
    });

    // The heading at a distance: the stretch's, blended across each corner.
    const along = (s: number): number => {
      let k: number = 0;
      while (k + 1 < stretches.length && stretches[k + 1]!.start <= s) ++k;
      const here: IStretch = stretches[k]!;
      const blend = (a: number, b: number, u: number): number =>
        a + (((((b - a + 180) % 360) + 360) % 360) - 180) * u;
      if (k + 1 < stretches.length) {
        const next: IStretch = stretches[k + 1]!;
        const half: number = Math.min(
          turn / 2,
          here.length / 2,
          next.length / 2,
        );
        if (half > 0 && s > next.start - half)
          return blend(
            here.heading,
            next.heading,
            (s - (next.start - half)) / (2 * half),
          );
      }
      if (k > 0) {
        const before: IStretch = stretches[k - 1]!;
        const half: number = Math.min(
          turn / 2,
          here.length / 2,
          before.length / 2,
        );
        if (half > 0 && s < here.start + half)
          return blend(
            before.heading,
            here.heading,
            (s - (here.start - half)) / (2 * half),
          );
      }
      return here.heading;
    };
    return {
      length: total,
      end: profile.end,
      at: (seconds: number): ILayResult => {
        const s: number = Math.min(total, profile.at(seconds).distance);
        let k: number = 0;
        while (k + 1 < stretches.length && stretches[k + 1]!.start <= s) ++k;
        const here: IStretch = stretches[k]!;
        const into: number = s - here.start;
        return {
          at: {
            x: here.from.x + here.dx * into,
            y: 0,
            z: here.from.z + here.dz * into,
          },
          heading:
            frame.heading === undefined || frame.heading === "along"
              ? along(s)
              : frame.heading,
        };
      },
    };
  }
}

/** One straight stretch of a path frame. */
interface IStretch {
  /** Its first corner, world metres. */
  from: IAutoMovieVector3;

  /** Its unit direction's x. */
  dx: number;

  /** Its unit direction's z. */
  dz: number;

  /** The arc distance at its start, metres. */
  start: number;

  /** Its length, metres. */
  length: number;

  /** Its heading, degrees. */
  heading: number;
}
