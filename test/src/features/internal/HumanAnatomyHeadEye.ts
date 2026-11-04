import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyHeadGeometry } from "./HumanAnatomyHeadGeometry";

type V3 = HumanAnatomy.V3;
type ISide = "left" | "right";
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * The eye openings of a head and their Farkas landmarks: the lid margins as the
 * widest opening of the skin on each side, the endocanthion and exocanthion at
 * its ends, and the palpebral fissure's length and height.
 */
export namespace HumanAnatomyHeadEye {
  /** The eyes of a head. */
  export interface IEyes {
    /** The lid-margin loops found, left then right, whichever exist. */
    found: V3[][];

    /** Palpebral fissure length (en to ex) and height (lid to lid at the middle) by side, mm; NaN when absent. */
    fissure: Record<ISide, { length: number; height: number }>;

    /** Endocanthion and exocanthion by side, mm; NaN when the eye has no fissure. */
    canthi: Record<ISide, { en: V3; ex: V3 }>;
  }

  /**
   * Locate the eyes among the skin's openings. On each side the widest
   * opening between pronasale and the vertex, off the midline, is the
   * palpebral fissure's lid margins: a real head may hold other, smaller
   * boundaries round the eye, and the margin is the widest of them.
   *
   * @param loops The skin's boundary loops.
   * @param prn Pronasale, below which no eye lies.
   * @param top Vertex, 30 mm under which the eyes end.
   */
  export function eyes(loops: V3[][], prn: V3, top: V3): IEyes {
    const openings: Record<ISide, V3[] | undefined> = { left: undefined, right: undefined };
    const ends: Map<V3[], [V3, V3]> = new Map();

    for (const l of loops) {
      const c: V3 = HumanAnatomyHeadGeometry.centre(l);
      if (c[1] < prn[1] || c[1] > top[1] - 30 || Math.abs(c[2]) < 12 || Math.abs(c[2]) > 80 || c[0] < prn[0] - 70) continue;

      const side: ISide = c[2] > 0 ? "left" : "right";
      ends.set(l, HumanAnatomyHeadGeometry.diameter(l));

      const was: V3[] | undefined = openings[side];
      if (was === undefined || HumanAnatomyHeadGeometry.span(ends.get(l)!) > HumanAnatomyHeadGeometry.span(ends.get(was)!))
        openings[side] = l;
    }

    const nan: V3 = [NaN, NaN, NaN];
    const fissure: Record<ISide, { length: number; height: number }> = {
      left: { length: NaN, height: NaN },
      right: { length: NaN, height: NaN },
    };
    const canthi: Record<ISide, { en: V3; ex: V3 }> = { left: { en: nan, ex: nan }, right: { en: nan, ex: nan } };

    for (const side of ["left", "right"] as const) {
      const eye: V3[] | undefined = openings[side];
      if (eye === undefined) continue;

      const [a, b]: [V3, V3] = ends.get(eye)!;

      // Endocanthion is the end nearer the midline.
      const en: V3 = Math.abs(a[2]) < Math.abs(b[2]) ? a : b;
      const ex: V3 = en === a ? b : a;

      fissure[side] = { length: A.dist(en, ex), height: height(eye, en, ex) };
      canthi[side] = { en, ex };
    }
    return {
      found: [openings.left, openings.right].filter((e: V3[] | undefined): e is V3[] => e !== undefined),
      fissure,
      canthi,
    };
  }

  /**
   * Palpebral fissure height: lid to lid at the fissure's middle, the upper and
   * lower margin points farthest from its axis upward and downward
   * (perpendicular to the axis, so a tilted fissure reads its own height), and
   * the distance between them across the axis, depth included, as at one point
   * along it.
   */
  function height(eye: V3[], en: V3, ex: V3): number {
    const d: V3 = A.unit(A.sub(ex, en));
    const L: number = A.dist(en, ex);
    const across: V3 = A.unit(A.reject([0, 1, 0], d));
    let upper: V3 | undefined;
    let lower: V3 | undefined;

    for (const p of eye) {
      const s: number = A.dot(A.sub(p, en), d);
      if (Math.abs(s - L / 2) > 0.1 * L) continue;

      const off: number = A.dot(A.sub(p, en), across);
      if (upper === undefined || off > A.dot(A.sub(upper, en), across)) upper = p;
      if (lower === undefined || off < A.dot(A.sub(lower, en), across)) lower = p;
    }
    return upper === undefined || lower === undefined ? NaN : Math.hypot(...A.reject(A.sub(upper, lower), d));
  }
}
