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
