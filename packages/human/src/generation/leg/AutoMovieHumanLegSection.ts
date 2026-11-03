import type { AutoMovieHumanLimbRootStrip } from "../AutoMovieHumanLimbRootStrip";
import { AutoMovieHumanLegAxis } from "./AutoMovieHumanLegAxis";
import { AutoMovieHumanLegSectionLaw } from "./AutoMovieHumanLegSectionLaw";
import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;
const { dot, sub } = AutoMovieHumanLegVector;

/**
 * One station's section: its plane and its points in it, `[x, z, lift]`, in
 * the canonical (left) frame.
 *
 * Under the law's crotch reach the section is the law's about the centre line;
 * over it, the root strip's ring at the station's share of the reach, which
 * runs from the trunk's crotch ring to the law's own section there
 * ({@link AutoMovieHumanLimbRootStrip}). Then the thighs meet at the midline
 * and do not pass it: a point on the far side of the midline is folded back by
 * a smooth `tanh` of the contact's softness.
 */
export namespace AutoMovieHumanLegSection {
  /** One station's section. */
  export interface ISection {
    /** The section plane. */
    frame: AutoMovieHumanLegAxis.IFrame;

    /** Points in the plane, `[x, z, lift]`, one per phase. */
    local: Vec3[];
  }

  /** Softness of the thighs' contact at the midline, mm. */
  export const CONTACT: number = 1.5;

  /**
   * The section at station s, canonical.
   *
   * @param law The leg's section law.
   * @param frames The leg's frames.
   * @param centre The centre line: the chart origin's offset from the frame origin at a station.
   * @param strip The root strip from the crotch ring down the law's crotch reach.
   * @param s The station.
   */
  export function of(
    law: AutoMovieHumanLegSectionLaw.ILaw,
    frames: AutoMovieHumanLegAxis.IFrames,
    centre: (s: number) => [number, number],
    strip: AutoMovieHumanLimbRootStrip.IStrip,
    s: number,
  ): ISection {
    const frame: AutoMovieHumanLegAxis.IFrame = AutoMovieHumanLegAxis.frameAt(frames, s);
    const depth: number = law.top - s;
    const world: Vec3[] = depth < law.crotchReach ? strip.ring(depth / law.crotchReach) : AutoMovieHumanLegSectionLaw.points(law, s, frame, centre(s));

    // The thighs meet at the midline and do not pass it.
    const local: Vec3[] = world.map((p: Vec3): Vec3 => {
      const z: number = p[2] >= 0 ? p[2] : CONTACT * Math.tanh(p[2] / CONTACT);
      const d: Vec3 = sub([p[0], p[1], z], frame.origin);
      return [dot(d, frame.u), dot(d, frame.v), dot(d, frame.n)];
    });
    return { frame, local };
  }
}
