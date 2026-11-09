import fs from "node:fs";

import { AutoMovieMeshExtract, AutoMovieViewAxis } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import type { CaptureModel } from "../inspection/CaptureModel";
import { HumanNodePaths } from "./HumanNodePaths";

/**
 * F1 limb archive input, chart evaluation and frame placement.
 *
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
 */
export namespace NodeLegF1Archive {
  /**
   * A point or vector in native world millimetres.
   *
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
   */
  export type V3 = CaptureModel.Vec3;
  /**
   * A point in a native section chart, in millimetres.
   *
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
   */
  export type V2 = [number, number];
  /**
   * The anatomical leg selected for capture.
   *
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
   */
  export type Side = "left" | "right";
  /**
   * The origin and chart axes of one measured plane.
   *
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
   */
  export type Frame = ReturnType<AutoMovieViewAxis.IAxis["at"]>;

  interface ISpan {
    start: V3;
    end: V3;
    startDerivative: V3;
    endDerivative: V3;
  }

  /**
   * An original leg or digit cut and its closed Hermite observations.
   *
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
   */
  export interface IArchiveStation {
    /** Identifier of the original archive row. */
    station: number;
    /** Origin displacement along the family's first plane normal, in millimetres. */
    stationMm: number;
    originMm: V3;
    u: V3;
    v: V3;
    loops: { kind: string; curve: { phaseIntervals: number[]; spans: ISpan[] } }[];
  }

  /**
   * The ignored native F1 limb archive root.
   *
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
   */
  export const SOURCE = ".references/curves/hermite/f1/limbs";

  /** The common trace’s measured reduction tolerance. */
  const Trace: typeof AutoMovieHumanF1Trace = AutoMovieHumanF1Trace;

  /** Vector operations used by the captured chart. */
  const Geometry: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;

  interface IArchivePart {
    family: string;
    variant: string;
    files: string[];
    rows: IArchiveStation[];
    portion: "leg" | "foot" | "toe";
    kneeStation?: number;
  }

  /**
   * Digit names in their anatomical ordering in the F1 archive.
   *
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
   */
  export const DIGITS = ["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"];

  /**
   * Read this region’s actual world planes and Hermite loops.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function archivePart(name: string, side: Side): IArchivePart {
    const [region, , digit] = name.split(".");
    const code = side === "left" ? "l" : "r";
    const toe = digit === undefined ? undefined : DIGITS[Number(digit) - 1];
    const family = region === "toe" ? `${toe}_${code}` : `leg_${code}`;
    const variant = region === "toe" ? "v3" : "v2";
    const directory = HumanNodePaths.resolve(`${SOURCE}/${family}`);
    const read = (suffix: string): { files: string[]; rows: IArchiveStation[] } => {
      const files = fs.readdirSync(directory).filter((file): boolean => file.startsWith(`${family}-${suffix}-`) && file.endsWith(".json")).sort((a, b): number => a.localeCompare(b));
      return {
        files,
        rows: files.flatMap((file): IArchiveStation[] => {
          const packed: { stations: IArchiveStation[] } = JSON.parse(fs.readFileSync(`${directory}/${file}`, "utf8"));
          return packed.stations;
        }),
      };
    };
    const { files, rows } = read(variant);
    if (rows.length < 2) throw new Error(`${name}: no complete reference section family ${family}-${variant}`);
    if (region === "toe") {
      const roots = read("root-v3");
      const root = roots.rows[0];
      if (roots.rows.length !== 1 || root?.loops.filter((loop): boolean => loop.kind === "closed").length !== 1)
        throw new Error(`${name}: expected its one observed disjoint toe root ring`);
      const first = rows[0]!;
      const normal = Geometry.cross(first.v, first.u);
      const rootStation = Geometry.dot(sub(root.originMm, first.originMm), normal);
      let last = rows.length - 1;
      while (last > 0 && !rows[last]!.loops.some((loop): boolean => loop.kind === "closed")) --last;
      const distal = rows.slice(0, last + 1).filter((row): boolean => row.stationMm > rootStation + 1e-8);
      return { family, variant, files: [...roots.files, ...files], rows: [{ ...root, stationMm: rootStation }, ...distal], portion: "toe" };
    }
    const joints = read("joints-v2");
    const jointIndex = (i: number): number => {
      const joint = joints.rows[i];
      return joint === undefined ? -1 : rows.findIndex((row): boolean => Math.hypot(...sub(row.originMm, joint.originMm)) < 1e-8);
    };
    const ankleIndex = jointIndex(1);
    if (ankleIndex < 1) throw new Error(`${name}: its observed ankle plane is outside the section family`);
    if (region === "foot") {
      const n = (row: IArchiveStation): V3 => Geometry.cross(row.v, row.u);
      let first = ankleIndex - 1;
      while (first > 0 && Math.hypot(...sub(n(rows[first]!), n(rows[first - 1]!))) > 1e-9) --first;
      return { family, variant, files: [...joints.files, ...files], rows: rows.slice(first), portion: "foot" };
    }
    const kneeIndex = jointIndex(0);
    if (kneeIndex < 1 || kneeIndex >= ankleIndex) throw new Error(`${name}: its observed knee plane is outside the lower-leg course`);
    return { family, variant, files: [...joints.files, ...files], rows, portion: "leg", kneeStation: rows[kneeIndex]!.stationMm };
  }

  /**
   * Keep each archived station’s frame and interpolate only between its recorded neighbours.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function archivedAxis(stations: number[], frames: Frame[]): AutoMovieViewAxis.IAxis {
    const exact = new Map(stations.map((s, i): [number, Frame] => [s, frames[i]!]));
    return {
      at(s): Frame {
        const frame = exact.get(s);
        if (frame !== undefined) return frame;
        const i = stations.findIndex((station): boolean => station > s);
        if (i <= 0) throw new Error(`station ${s} mm is outside the archived section family`);
        const a = frames[i - 1]!;
        const b = frames[i]!;
        const t = (s - stations[i - 1]!) / (stations[i]! - stations[i - 1]!);
        const origin = mix(a.origin as V3, b.origin as V3, t);
        const n = Geometry.unit(mix(AutoMovieViewAxis.normal(a) as V3, AutoMovieViewAxis.normal(b) as V3, t));
        const first = mix(a.u as V3, b.u as V3, t);
        const u = Geometry.unit(sub(first, scale(n, Geometry.dot(first, n))));
        return { origin, u, v: Geometry.cross(u, n) };
      },
    };
  }

  /**
   * Evaluate the stored cubic arcs in arc-phase steps of at most 0.5 mm.
   * Hermite phase is local arc distance along this ring. Across cuts, read
   * the corresponding physical ray again in each cut's original chart.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function chartLoop(curve: { phaseIntervals: number[]; spans: ISpan[] }, frame: Frame): V2[] {
    const output: V2[] = [];
    for (const [i, span] of curve.spans.entries()) {
      const width = curve.phaseIntervals[i]!;
      const count = Math.ceil(width / Trace.TOLERANCE);
      for (let k = 0; k < count; ++k) {
        const phase = width * k / count;
        const p = span.start.map((value, d): number => AutoMovieMeshExtract.hermite(0, value, span.startDerivative[d]!, width, span.end[d]!, span.endDerivative[d]!, phase)) as V3;
        const displacement = sub(world(p), frame.origin as V3);
        output.push([Geometry.dot(displacement, frame.u as V3), Geometry.dot(displacement, frame.v as V3)]);
      }
    }
    return output;
  }

  /**
   * Place a chart point in the original world frame.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function place(frame: Frame, [a, b]: readonly [number, number]): V3 {
    const { origin, u, v } = frame;
    return [origin[0]! + a * u[0]! + b * v[0]!, origin[1]! + a * u[1]! + b * v[1]!, origin[2]! + a * u[2]! + b * v[2]!];
  }

  /**
   * Convert the archived point to the capture world by reflecting Z once.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function world([x, y, z]: V3): V3 {
    return [x, y, -z];
  }

  /**
   * Interpolate coordinates with the measured station fraction.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function mix(a: V3, b: V3, t: number): V3 {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  /**
   * Scale a vector in the current chart.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function scale(p: V3, k: number): V3 {
    return [p[0] * k, p[1] * k, p[2] * k];
  }

  /**
   * Read the displacement from a chart or world origin.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }
}
