import type { AutoMovieViewAxis } from "@automovie/engine";

import left from "./AutoMovieHumanLegF1Left.json";
import native from "./AutoMovieHumanLegF1Native.json";
import right from "./AutoMovieHumanLegF1Right.json";
import { AutoMovieHumanLegF1Rebase } from "./AutoMovieHumanLegF1Rebase";
import { AutoMovieHumanLegF1World } from "./AutoMovieHumanLegF1World";

/**
 * f1's leg lines in the leg's zero frames (the owner's world-match method,
 * 2026-11-08): her four leg lines are authored as absolute world points on
 * her reference in her own stance (`AutoMovieHumanLegF1World`, checked on
 * her clay in every view), and `AutoMovieHumanLegF1Rebase` writes each point
 * in the frame of its segment from that segment's zero, the femur from the
 * hip centre and the tibia from the knee centre, with axes from her bone
 * landmarks in that stance. The values here are those converted points; the
 * leg's own neutral frames set the angles. The thigh still starts above them
 * from S00's half loop (the port datums, `AutoMovieHumanLegBuild`).
 *
 * The parameter-based boxes they replace stay in
 * `AutoMovieHumanLegViewCurves` as comments for the later algorithmization.
 */
export namespace AutoMovieHumanLegF1Lines {
  /** One exact holding contour from the accepted fixed F1 leg, in ISB world millimetres. */
  export interface IFixedSection {
    /** Actual authored course station, millimetres. */
    station: number;

    /** Observed origin and axes of this section plane. */
    frame: ReturnType<AutoMovieViewAxis.IAxis["at"]>;

    /** The original closed world contour in its recorded order. */
    points: [number, number, number][];
  }

  /**
   * Return the actual 212 regular generating contours, their original instep
   * phase change and the exact seed rim of the native forefoot. The first
   * regular rail is the actual s136 native-thigh boundary.
   */
  export function fixed(side: "left" | "right"): { rows: IFixedSection[]; refinements: number[] } {
    const data: typeof left | typeof right = side === "left" ? left : right;
    const point = (value: number | number[] | number[][] | undefined): [number, number, number] => {
      if (!Array.isArray(value) || typeof value[0] !== "number" || typeof value[1] !== "number" || typeof value[2] !== "number")
        throw new Error("A measured F1 leg contour point or frame is missing");
      return [value[0], value[1], value[2]];
    };
    const rows: IFixedSection[] = data.rows.map(([station, origin, u, v, samples]): IFixedSection => {
      if (typeof station !== "number" || !Array.isArray(samples)) throw new Error("A measured F1 leg section is missing");
      return { station, frame: { origin: point(origin), u: point(u), v: point(v) }, points: samples.map(point) };
    });
    // The seam clock uses the regular course's final plane, not the shifted
    // origin of the native seed cut. Both planes own the same physical rim.
    const seed: Omit<IFixedSection, "points"> = side === "left"
      ? { station: 892.8572857642163, frame: { origin: [128.69465255820268, 11.42973333310325, -156.40010052635884], u: [0.43295000701549186, 0.8983283490541243, -0.074568550414885], v: [-0.169734488552903, 0, -0.9854898291690709] } }
      : { station: 892.8572527576581, frame: { origin: [128.694686078446, 11.429766860189588, 156.43366528546824], u: [0.4329500522420355, 0.8983283333642552, 0.07456847684255179], v: [0.1697343086908451, 0, -0.9854898601473485] } };
    rows.push({ ...seed, points: data.ports[0]!.points.map(point) });
    return { rows, refinements: data.refined };
  }

  /** Read the two native thigh rims and the actual measured fork guides. */
  export function fixedHip(side: "left" | "right"): {
    frame: IFixedSection["frame"];
    entry: [number, number, number][];
    rings: [number, number, number][][];
    arcs: [number, number, number][][];
  } {
    type V3 = [number, number, number];
    const data: typeof left | typeof right = side === "left" ? left : right;
    const patch = native.patches.find(item => item.name === `leg.${side}.hip.native`)?.info;
    if (patch === undefined || patch.start === undefined || patch.entry === undefined)
      throw new Error(`The observed F1 ${side} proximal patch is absent`);
    const point = (value: readonly number[]): V3 => [value[0]!, value[1]!, value[2]!];
    const { origin, u, v } = patch.start.frame;
    const rings: V3[][] = [];
    const arcs: V3[][] = [];
    for (const [, closed, points] of data.hip) {
      if (!Array.isArray(points)) throw new Error("A recorded F1 fork guide is not a contour");
      (closed === true ? rings : arcs).push(points.map(point));
    }
    return { frame: { origin: point(origin), u: point(u), v: point(v) }, entry: patch.entry.map(point), rings, arcs };
  }

  /** The same six physical rings consumed by the leg and its five toes. */
  export function fixedFoot(side: "left" | "right"): [number, number, number][][] {
    return (side === "left" ? left : right).ports.map(({ points }) =>
      points.map((point: number[]): [number, number, number] => [point[0]!, point[1]!, point[2]!]),
    );
  }

  /** One label's four extents: lateral, medial, anterior, posterior, mm. */
  export type IBox = [number, number, number, number];

  /** The girth sites carried by the lines. */
  export type Site = "gluteal furrow" | "suprapatella" | "midpatella" | "calf maximum" | "ankle minimum";

  /** The lines in the order of a box. */
  export const LABELS: readonly AutoMovieHumanLegF1Rebase.Label[] = ["lateral", "medial", "anterior", "posterior"];

  /** Her stance's zero frames (the lateral sign of world Z from the hip centre's side). */
  export const FRAMES: { femur: AutoMovieHumanLegF1Rebase.IFrame; tibia: AutoMovieHumanLegF1Rebase.IFrame } = AutoMovieHumanLegF1Rebase.frames(AutoMovieHumanLegF1World.LANDMARKS, AutoMovieHumanLegF1World.LANDMARKS.hip[2] > 0 ? 1 : -1);

  /** The four lines re-based, one knot per level, top down. */
  export const LINES: Readonly<Record<AutoMovieHumanLegF1Rebase.Label, readonly AutoMovieHumanLegF1Rebase.IKnot[]>> = {
    lateral: AutoMovieHumanLegF1Rebase.convert(AutoMovieHumanLegF1World.LEG.lateral, AutoMovieHumanLegF1World.LEVELS, "lateral", FRAMES),
    medial: AutoMovieHumanLegF1Rebase.convert(AutoMovieHumanLegF1World.LEG.medial, AutoMovieHumanLegF1World.LEVELS, "medial", FRAMES),
    anterior: AutoMovieHumanLegF1Rebase.convert(AutoMovieHumanLegF1World.LEG.anterior, AutoMovieHumanLegF1World.LEVELS, "anterior", FRAMES),
    posterior: AutoMovieHumanLegF1Rebase.convert(AutoMovieHumanLegF1World.LEG.posterior, AutoMovieHumanLegF1World.LEVELS, "posterior", FRAMES),
  };

  /** Her foot's zero frame at IM in her stance (her foot course, `AutoMovieHumanLegF1World.COURSE`). */
  export const FOOT_FRAME: AutoMovieHumanLegF1Rebase.IFrame = AutoMovieHumanLegF1Rebase.foot(AutoMovieHumanLegF1World.LANDMARKS.im, AutoMovieHumanLegF1World.COURSE, AutoMovieHumanLegF1World.LANDMARKS.hip[2] > 0 ? 1 : -1);

  /** Her foot's lines re-based into the foot frame: the lateral and medial outlines and the dorsal profile (as `anterior`). */
  export const FOOT: Readonly<Record<"lateral" | "medial" | "anterior", readonly AutoMovieHumanLegF1Rebase.IKnot[]>> = {
    lateral: AutoMovieHumanLegF1Rebase.convertFoot(AutoMovieHumanLegF1World.FOOT.lateral, "lateral", FOOT_FRAME),
    medial: AutoMovieHumanLegF1Rebase.convertFoot(AutoMovieHumanLegF1World.FOOT.medial, "medial", FOOT_FRAME),
    anterior: AutoMovieHumanLegF1Rebase.convertFoot(AutoMovieHumanLegF1World.FOOT.dorsal, "anterior", FOOT_FRAME),
  };

  /** The ankle's common anterior half extent at IM from her front-ankle juncture (the talus' front on the bisection ray), mm. */
  export const ANKLE_ANTERIOR: number = AutoMovieHumanLegF1Rebase.ankleAnterior(AutoMovieHumanLegF1World.JUNCTURE, FRAMES.tibia, FOOT_FRAME);

  /** One foot line's knots (0 lateral, 1 medial, 2 dorsal) at their neutral walks (IM at `imWalk`, the walk running along the foot course), those with walks inside (from, to). */
  export function foot(index: 0 | 1 | 2, imWalk: number, from: number, to: number): { site: string; walk: number; value: number }[] {
    return FOOT[(["lateral", "medial", "anterior"] as const)[index]]
      .map((k: AutoMovieHumanLegF1Rebase.IKnot): { site: string; walk: number; value: number } => ({ site: `foot ${k.at.toFixed(0)}`, walk: imWalk + k.at, value: k.value }))
      .filter((k: { walk: number }): boolean => k.walk > from && k.walk < to);
  }

  /** Walk where S00's ring's quarter shoulders have handed over to the lines' fullness: the upper thigh's first 200 mm from the hip centre, so the ring's flat front-lateral and square back-medial quarters round off over the thigh, not at the furrow. */
  export const FADE: number = 200;

  /** One site's box: the four lines' re-based extents at the site's own level. */
  export function site(name: Site): IBox {
    const k: number = AutoMovieHumanLegF1World.LEVELS.indexOf(name);
    return [LINES.lateral[k]!.value, LINES.medial[k]!.value, LINES.anterior[k]!.value, LINES.posterior[k]!.value];
  }

  /** One line's knots between the sites (0 lateral, 1 medial, 2 anterior, 3 posterior) at their neutral walks, the knee centre at `kneeWalk`. */
  export function between(index: 0 | 1 | 2 | 3, kneeWalk: number): { site: string; walk: number; value: number }[] {
    return LINES[LABELS[index]!]
      .filter((k: AutoMovieHumanLegF1Rebase.IKnot): boolean => k.level === "")
      .map((k: AutoMovieHumanLegF1Rebase.IKnot): { site: string; walk: number; value: number } => ({ site: `${k.segment} ${k.at.toFixed(0)}`, walk: (k.segment === "femur" ? 0 : kneeWalk) + k.at, value: k.value }));
  }

  /**
   * Her heel's back line (`AutoMovieHumanLegF1World.FOOT.heel`, bottom up) in
   * the sagittal plane of a frame whose IM stands at `im`: each point's
   * forward and vertical offsets from her own IM in her stance, so the line
   * keeps its place behind and above the ankle centre (the femur frame keeps
   * the pelvis axes, so world and frame offsets agree).
   */
  export function heel(im: readonly number[]): [number, number][] {
    const her: readonly number[] = AutoMovieHumanLegF1World.LANDMARKS.im;
    return AutoMovieHumanLegF1World.FOOT.heel.map((p: readonly number[]): [number, number] => [im[0]! + p[0]! - her[0]!, im[1]! + p[1]! - her[1]!]);
  }

  /** The walk where the ring's quarter shoulders have faded, {@link FADE}. */
  export function fade(): number {
    return FADE;
  }
}
