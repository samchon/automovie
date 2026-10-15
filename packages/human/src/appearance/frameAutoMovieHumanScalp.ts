import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";

/**
 * The hair-bearing scalp of one person: a centre hair grows away from and the hairline that bounds it, both set from the skeleton's landmarks and the identity's head measurements.
 *
 * The hairline is a height above the standing surface as a function of the azimuth about the head's vertical axis, from the anterior midline (0) to the posterior midline (π), the same on both sides:
 *
 * - The frontal margin lies at trichion, 0.57 face heights above nasion: trichion-nasion measures 72.2 mm in Kenyan men and 67.5 in women (Virdi et al. 2019) and 69.1 mm in Nigerian adults (Adekunle et al. 2022), 0.60 of their face heights near 120 and 112 mm, of which the sloping forehead leaves about 0.95 as height (derived).
 * - The hairline shape choice moves the margin as its class is defined (Zhang et al. 2026 after Suzan et al., conventional): `round` keeps a smooth contour; `mShaped` lifts the frontotemporal corners by a quarter of the forehead's rise above glabella; `rectangular` keeps the margin level to the corner; `bellShaped` lifts the midline point by a third of the forehead's rise; `triangular` lets the margin descend from the midline toward the temples.
 * - From the temples the margin falls along the sideburn in front of the ear to the tragion's level, passes over the ear, and runs back to the nape, a third of the tragion-to-vertex height below the tragion (conventional).
 *
 * Around the hairline the density falls to zero over a 4 mm band, which is how a hairline thins into vellus hair. Points near the ear's attachment, within the ear's own half-length and half-breadth of a centre above and behind the tragion, bear no hair.
 *
 * @param props.measurements Resolved measurements
 * @param props.skeleton The skeleton at rest
 * @param props.hairline The appearance's hairline choice
 * @returns The scalp's centre and its density function
 */
export function frameAutoMovieHumanScalp(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  hairline: IAutoMovieHumanAppearance.IHair["hairline"];
}): frameAutoMovieHumanScalp.IScalp {
  const l = props.skeleton.landmarks;
  const head = props.measurements.identity.head;
  const tragion: number = (l.left.tragion.position.y + l.right.tragion.position.y) / 2;
  const vertex: number = l.vertex.position.y;
  const centre: [number, number, number] = [
    0,
    tragion + 0.35 * (vertex - tragion),
    (l.glabella.position.z + l.opisthocranion.position.z) / 2,
  ];
  const front: number = l.nasion.position.y + 0.57 * head.faceHeight;
  const forehead: number = front - l.glabella.position.y;
  const lift: Record<IAutoMovieHumanAppearance.IHair["hairline"], [number, number, number]> = {
    // midline, frontotemporal corner, temple; millimetres above the frontal margin
    round: [0, 0.05 * forehead, -0.1 * forehead],
    mShaped: [0, 0.25 * forehead, 0.05 * forehead],
    rectangular: [0, 0, -0.05 * forehead],
    bellShaped: [forehead / 3, 0.05 * forehead, -0.1 * forehead],
    triangular: [0, -0.15 * forehead, -0.3 * forehead],
  };
  const [mid, corner, temple] = lift[props.hairline];
  const nape: number = tragion - (vertex - tragion) / 3;
  const knots: Array<[number, number]> = [
    [0, front + mid],
    [0.35, front + corner * 0.5 + mid * 0.2],
    [0.7, front + corner],
    [1.05, front + temple - 0.25 * forehead],
    [1.3, tragion + 6],
    [1.48, tragion + 6],
    [2.0, tragion - 4],
    [2.6, nape],
    [Math.PI, nape],
  ];
  const height = (azimuth: number): number => {
    const a: number = Math.abs(azimuth);
    for (let i: number = 1; i < knots.length; ++i)
      if (a <= knots[i]![0]) {
        const [a0, y0] = knots[i - 1]!;
        const [a1, y1] = knots[i]!;
        const t: number = (a - a0) / (a1 - a0);
        const s: number = t * t * (3 - 2 * t);
        return y0 + s * (y1 - y0);
      }
    return nape;
  };
  const ears = (["left", "right"] as const).map((side) => {
    const t = l[side].tragion.position;
    const ear = head[side === "left" ? "leftEar" : "rightEar"];
    return {
      centre: [t.x, t.y + 0.12 * ear.earLength, t.z - 0.35 * ear.earBreadth] as const,
      long: 0.5 * ear.earLength + 4,
      short: 0.5 * ear.earBreadth + 6,
    };
  });
  return {
    centre,
    density: (p: readonly [number, number, number]): number => {
      for (const ear of ears) {
        const dy: number = (p[1] - ear.centre[1]) / ear.long;
        const dz: number = (p[2] - ear.centre[2]) / ear.short;
        if (Math.abs(p[0] - ear.centre[0]) < 25 && dy * dy + dz * dz < 1) return 0;
      }
      const azimuth: number = Math.atan2(p[0] - centre[0], p[2] - centre[2]);
      const above: number = p[1] - height(azimuth);
      return Math.max(0, Math.min(1, above / BAND));
    },
  };
}
/**
 * Types of the scalp frame.
 */
export namespace frameAutoMovieHumanScalp {
  /**
   * The scalp of one person.
   *
   * @author Samchon
   */
  export interface IScalp {
    /** Centre hair grows away from, millimetres, model frame at rest: on the midline between glabella and opisthocranion, a little above the tragion level. */
    centre: [number, number, number];

    /**
     * Hair density at a point of the head's surface, as a share of full density in `[0, 1]`.
     *
     * @param p The point, millimetres, model frame at rest
     * @returns Zero off the scalp, one inside it
     */
    density(p: readonly [number, number, number]): number;
  }
}

/** Width over which density rises at the hairline, millimetres. */
const BAND: number = 4;
