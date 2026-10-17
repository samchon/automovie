import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanEyeHairHost } from "../junction/IAutoMovieHumanEyeHairHost";
import { frameAutoMovieHumanHead } from "../junction/frameAutoMovieHumanHead";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AutoMovieHumanHeadSurface } from "./AutoMovieHumanHeadSurface";

/**
 * Hair anchors from the selected head's actual, composition-supplied lid owner.
 *
 * The host owns the left local course, mirrored in its supplied frame for the
 * right side. This adapter imports no head part and reconstructs no aperture.
 * A custom form must supply its corresponding symmetric course; asymmetric
 * heads and moving lids are not certified by this adapter.
 *
 * Lashes project only near the owned anterior course onto the emitted skin;
 * remote, missing and rear hits are refused. The conventional brow envelope is
 * anchored to those canthi and independent fissure dimensions, not a clinical
 * eyebrow boundary. All points and projection distances are model millimetres.
 */
export function ownAutoMovieHumanEyeHair(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  surface: AutoMovieHumanHeadSurface;
  host: IAutoMovieHumanEyeHairHost;
}): Record<"left" | "right", ownAutoMovieHumanEyeHair.IOwner> {
  const host: IAutoMovieHumanEyeHairHost = props.host;
  if (
    host.context.measurements !== props.measurements ||
    host.context.skeleton !== props.skeleton
  )
    throw new Error(
      "The eye-hair appearance capability belongs to another person context",
    );
  const frame: frameAutoMovieHumanHead.IAxes = host.frame;
  const make: (side: "left" | "right") => ownAutoMovieHumanEyeHair.IOwner = (
    side: "left" | "right",
  ): ownAutoMovieHumanEyeHair.IOwner => {
    const sign: number = side === "left" ? 1 : -1;
    const world: (point: IAutoMovieVector3) => V = (
      point: IAutoMovieVector3,
    ): V =>
      vector(
        frameAutoMovieHumanHead.toModel(frame, { ...point, x: sign * point.x }),
      );
    const local: (point: readonly number[]) => IAutoMovieVector3 = (
      point: readonly number[],
    ): IAutoMovieVector3 => {
      const p: IAutoMovieVector3 = frameAutoMovieHumanHead.toLocal(frame, {
        x: point[0]!,
        y: point[1]!,
        z: point[2]!,
      });
      return { ...p, x: sign * p.x };
    };
    const forward: V = vector(frame.z);
    const margin: (upper: boolean, s: number) => V = (
      upper: boolean,
      s: number,
    ): V => {
      if (!(s >= 0 && s <= 1))
        throw new Error("Hair anchor lies outside its owned lid course");
      return world(host.lidLocal(s, upper));
    };
    const length: number = host.lengthMm;
    const height: number = host.heightMm;
    const medial: number = host.lidLocal(0, true).x;
    const envelope: (u: number) => {
      x: number;
      lower: number;
      height: number;
    } = (u: number): { x: number; lower: number; height: number } => {
      const s: number = Math.max(0, Math.min(1, BROW.span * u));
      return {
        x: medial + length * (BROW.medial + BROW.span * u),
        lower:
          host.lidLocal(s, true).y +
          height * (BROW.clearance + BROW.arch * Math.sin(Math.PI * u)),
        height: height * (BROW.thickness - BROW.taper * u),
      };
    };
    const projection: ownAutoMovieHumanEyeHair.IProjection = {
      sampled: 0,
      rejected: 0,
      maximumDistanceMm: 0,
    };
    return {
      margin,
      length,
      height,
      forward,
      up: vector(frame.y),
      outward: scale(vector(frame.x), sign),
      projection,
      lidRoot: (
        upper: boolean,
        s: number,
      ): AutoMovieHumanHeadSurface.IPoint | null => {
        ++projection.sampled;
        const expected: V = margin(upper, s);
        const allowance: number = host.marginThicknessMm;
        const hit: AutoMovieHumanHeadSurface.IHit | null = props.surface.cast(
          add(expected, scale(forward, allowance)),
          scale(forward, -1),
        );
        const distance: number =
          hit === null
            ? Infinity
            : Math.hypot(
                ...hit.position.map(
                  (value: number, k: number): number => value - expected[k]!,
                ),
              );
        if (
          hit === null ||
          hit.distance > 2 * allowance ||
          dot(hit.normal, forward) <= 0 ||
          distance > allowance
        ) {
          ++projection.rejected;
          return null;
        }
        projection.maximumDistanceMm = Math.max(
          projection.maximumDistanceMm,
          distance,
        );
        return hit;
      },
      browRoot: (
        u: number,
        w: number,
      ): AutoMovieHumanHeadSurface.IPoint | null => {
        const e: ReturnType<typeof envelope> = envelope(u);
        const origin: V = world({
          x: e.x,
          y: e.lower + w * e.height,
          z: host.eyeDepthMm + 80,
        });
        const hit: AutoMovieHumanHeadSurface.IHit | null = props.surface.cast(
          origin,
          scale(forward, -1),
        );
        return hit !== null && dot(hit.normal, forward) > 0 ? hit : null;
      },
      inBrow: (point: readonly number[]): boolean => {
        const p: IAutoMovieVector3 = local(point);
        const u: number = ((p.x - medial) / length - BROW.medial) / BROW.span;
        if (u < 0 || u > 1) return false;
        const e: ReturnType<typeof envelope> = envelope(u);
        return p.y >= e.lower && p.y <= e.lower + e.height;
      },
    };
  };
  return { left: make("left"), right: make("right") };
}

/** Conventional hair-envelope ratios, in the actual aperture's length/height units. */
const BROW: {
  medial: number;
  span: number;
  clearance: number;
  arch: number;
  thickness: number;
  taper: number;
} = {
  medial: -0.03,
  span: 1.55,
  clearance: 0.55,
  arch: 0.15,
  thickness: 0.45,
  taper: 0.27,
};
type V = [number, number, number];
function vector(p: IAutoMovieVector3): V {
  return [p.x, p.y, p.z];
}
function add(a: readonly number[], b: readonly number[]): V {
  return [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];
}
function scale(a: readonly number[], n: number): V {
  return [a[0]! * n, a[1]! * n, a[2]! * n];
}
function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}

/** World-rest attachment operators and their measured projection observations. */
export namespace ownAutoMovieHumanEyeHair {
  /** Actual emitted-skin projection observations; no exact contact certificate. */
  export interface IProjection {
    sampled: number;
    rejected: number;
    maximumDistanceMm: number;
  }
  /** Default-head course and its conventional hair envelope, world-rest millimetres. */
  export interface IOwner {
    margin: (upper: boolean, s: number) => V;
    lidRoot: (
      upper: boolean,
      s: number,
    ) => AutoMovieHumanHeadSurface.IPoint | null;
    browRoot: (u: number, w: number) => AutoMovieHumanHeadSurface.IPoint | null;
    inBrow: (point: readonly number[]) => boolean;
    length: number;
    height: number;
    forward: V;
    up: V;
    outward: V;
    projection: IProjection;
  }
}
