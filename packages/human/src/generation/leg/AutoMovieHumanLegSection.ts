import { AutoMovieHumanLegAxis } from "./AutoMovieHumanLegAxis";
import { AutoMovieHumanLegCrotchRoot } from "./AutoMovieHumanLegCrotchRoot";
import { AutoMovieHumanLegSectionLaw } from "./AutoMovieHumanLegSectionLaw";
import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;
const { dot, sub } = AutoMovieHumanLegVector;

/**
 * One station's section: its plane and its points in it, `[x, z, lift]`, in
 * the canonical (left) frame.
 *
 * The section is the law's about the centre line, carried onto the crotch
 * ring's rounded loop over the span from the ring to the first landmark row
 * ({@link AutoMovieHumanLegCrotchRoot.join}), and then the thighs meet at the
 * midline and do not pass it: a point on the far side of the midline is
 * folded back by a smooth `tanh` of the contact's softness.
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
   * @param root The crotch ring the leg takes.
   * @param s The station.
   */
  export function of(
    law: AutoMovieHumanLegSectionLaw.ILaw,
    frames: AutoMovieHumanLegAxis.IFrames,
    centre: (s: number) => [number, number],
    root: AutoMovieHumanLegCrotchRoot.IRoot,
    s: number,
  ): ISection {
    const frame: AutoMovieHumanLegAxis.IFrame = AutoMovieHumanLegAxis.frameAt(frames, s);
    const own: Vec3[] = AutoMovieHumanLegSectionLaw.points(law, s, frame, centre(s));
    const world: Vec3[] = AutoMovieHumanLegCrotchRoot.join(root, own, s, law.crotchReach);

    // The thighs meet at the midline and do not pass it.
    const local: Vec3[] = world.map((p: Vec3): Vec3 => {
      const z: number = p[2] >= 0 ? p[2] : CONTACT * Math.tanh(p[2] / CONTACT);
      const d: Vec3 = sub([p[0], p[1], z], frame.origin);
      return [dot(d, frame.u), dot(d, frame.v), dot(d, frame.n)];
    });
    return { frame, local };
  }
}
