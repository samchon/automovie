import type { IAutoMovieHumanChainRings } from "./IAutoMovieHumanChainRings";
import type { IAutoMovieHumanNeutralBody } from "./IAutoMovieHumanNeutralBody";
import { AutoMovieHumanNeutralTurn as Turn } from "./AutoMovieHumanNeutralTurn";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The thumb's carpometacarpal neutral: the metacarpal turned from the bind
 * toward the index metacarpal's line about the saddle joint at the trapezium,
 * as far as its skin stays out of the hand's.
 *
 * Neutral-0 measures the thumb from its adducted position, against the hand in
 * the hand's plane and in the plane square to it (DGUV F 4030), but a thumb
 * laid exactly along the index metacarpal swings its own skin through the
 * thenar and the palm. The neutral therefore takes the nearest direction to the
 * index metacarpal's at which no point of the thumb's skin past its root ring
 * (where it leaves the hand's) lies inside the hand's skin: the turn's share
 * from the bind direction to the index line is scanned down from the whole in
 * steps of {@link STEP}, each candidate turning the thumb's bind skin rigidly
 * about the joint. Without the two chains the thumb lies on the index line.
 */
export namespace AutoMovieHumanNeutralThumbCmc {
  /** Step of the share scanned from the index line back toward the bind, a fraction of the whole turn. */
  export const STEP: number = 0.02;

  /**
   * The line the thumb lies along at neutral.
   *
   * @param body The bind skeleton.
   * @param rings The skin; the side's `thumb.<side>` and `hand.<side>.1` chains are read.
   * @param side Which hand.
   * @param hand The hand's world turn.
   * @returns The unit direction.
   */
  export function line(
    body: IAutoMovieHumanNeutralBody,
    rings: readonly IAutoMovieHumanChainRings[],
    side: "left" | "right",
    hand: Math3D.Quaternion,
  ): Math3D.Vector {
    const index: Math3D.Vector = Math3D.unit(body.between(`${side}Hand`, `${side}IndexProximal`));
    const bind: Math3D.Vector = body.direction(`${side}ThumbMetacarpal`);
    const thumb: IAutoMovieHumanChainRings | undefined = rings.find((r: IAutoMovieHumanChainRings): boolean => r.chain === `thumb.${side}`);
    const palm: IAutoMovieHumanChainRings | undefined = rings.find((r: IAutoMovieHumanChainRings): boolean => r.chain === `hand.${side}.1`);
    if (thumb === undefined || palm === undefined) return Math3D.unit(Math3D.rotate(hand, index));

    // The thumb's skin past its root ring, in the bind.
    const joint: Math3D.Vector = body.byBone.get(`${side}ThumbMetacarpal`)!.position;
    const rows: Math3D.Vector[][] = ringsOf(thumb);
    const depth: number[] = rows.map((r: Math3D.Vector[]): number => Turn.length(centroid(r), joint));
    const root: number = depth.indexOf(Math.min(...depth));
    const skin: Math3D.Vector[] = rows.filter((_: Math3D.Vector[], k: number): boolean => k !== root).flat();
    const hull: ISlab[] = slabs(ringsOf(palm));

    // The nearest share to the index line at which the turned skin stays out.
    for (let share: number = 1; share > 0; share -= STEP) {
      const along: Math3D.Vector = Math3D.unit(Math3D.add(Math3D.times(bind, 1 - share), Math3D.times(index, share)));
      const turn: Math3D.Quaternion = Turn.arc(bind, along);
      const clear: boolean = skin.every((p: Math3D.Vector): boolean => !inside(hull, Math3D.add(joint, Math3D.rotate(turn, Math3D.sub(p, joint)))));
      if (clear) return Math3D.unit(Math3D.rotate(hand, along));
    }
    return Math3D.unit(Math3D.rotate(hand, bind));
  }

  /**
   * Derive one thumb metacarpal's neutral.
   *
   * @param body The bind skeleton.
   * @param side Which hand.
   * @param hand The hand's world turn.
   * @param along The line the thumb lies along, from {@link line}.
   * @returns The metacarpal's world turn.
   */
  export function derive(
    body: IAutoMovieHumanNeutralBody,
    side: "left" | "right",
    hand: Math3D.Quaternion,
    along: Math3D.Vector,
  ): Math3D.Quaternion {
    return Turn.straighten(body, `${side}ThumbMetacarpal`, hand, along);
  }

  /** A chain's rings as point lists. */
  function ringsOf(chain: IAutoMovieHumanChainRings): Math3D.Vector[][] {
    const n: number = chain.phases;
    return chain.stations.map((_: number, k: number): Math3D.Vector[] =>
      Array.from({ length: n }, (__: unknown, m: number): Math3D.Vector => {
        const i: number = 3 * (k * n + m);
        return [chain.points[i]!, chain.points[i + 1]!, chain.points[i + 2]!];
      }),
    );
  }

  /** The mean of points. */
  function centroid(points: readonly Math3D.Vector[]): Math3D.Vector {
    return Math3D.times(points.reduce((s: Math3D.Vector, p: Math3D.Vector): Math3D.Vector => Math3D.add(s, p), [0, 0, 0]), 1 / points.length);
  }

  /**
   * One ring of a chain's skin as a slab: its centroid, its plane's normal
   * (along the line through its neighbours' centroids), the slab's half
   * thickness (half the gap to the neighbours either side) and its outline in
   * its own plane.
   */
  interface ISlab {
    /** The ring's centroid. */
    centre: Math3D.Vector;

    /** Unit normal of the ring's plane. */
    normal: Math3D.Vector;

    /** Half thickness of the slab the ring stands for, mm. */
    half: number;

    /** First in-plane axis. */
    e1: Math3D.Vector;

    /** Second in-plane axis. */
    e2: Math3D.Vector;

    /** The ring in its plane, `[along e1, along e2]`. */
    outline: [number, number][];
  }

  /**
   * A chain's rings as slabs, read once per chain: every point the scan
   * tests reads the same slabs, so their centroids, normals and outlines are
   * fixed before the scan.
   */
  function slabs(rings: readonly Math3D.Vector[][]): ISlab[] {
    const centres: Math3D.Vector[] = rings.map(centroid);
    return rings.map((ring: Math3D.Vector[], k: number): ISlab => {
      const a: Math3D.Vector = centres[Math.max(0, k - 1)]!;
      const b: Math3D.Vector = centres[Math.min(rings.length - 1, k + 1)]!;
      const normal: Math3D.Vector = Math3D.unit(Math3D.sub(b, a));
      const centre: Math3D.Vector = centres[k]!;
      const e1: Math3D.Vector = Math3D.unit(Turn.perpendicular(Math3D.sub(ring[0]!, centre), normal));
      const e2: Math3D.Vector = Turn.cross(normal, e1);
      return {
        centre,
        normal,
        half: Turn.length(a, b) / (k === 0 || k === rings.length - 1 ? 2 : 4),
        e1,
        e2,
        outline: ring.map((q: Math3D.Vector): [number, number] => [Turn.dot(Math3D.sub(q, centre), e1), Turn.dot(Math3D.sub(q, centre), e2)]),
      };
    });
  }

  /**
   * Whether a point lies inside a chain's skin: within the slab of the ring
   * whose plane it is nearest, and inside that ring's outline in its plane
   * (crossing number).
   */
  function inside(hull: readonly ISlab[], p: Math3D.Vector): boolean {
    let best: ISlab | null = null;
    let least: number = Infinity;
    for (const slab of hull) {
      const offset: number = Math.abs(Turn.dot(Math3D.sub(p, slab.centre), slab.normal));
      if (offset <= slab.half && offset < least) {
        least = offset;
        best = slab;
      }
    }
    if (best === null) return false;

    // The point in the ring's plane against its outline.
    const d: Math3D.Vector = Math3D.sub(p, best.centre);
    const x: number = Turn.dot(d, best.e1);
    const y: number = Turn.dot(d, best.e2);
    const outline: [number, number][] = best.outline;
    let crossings: number = 0;
    outline.forEach((a: [number, number], i: number): void => {
      const b: [number, number] = outline[(i + 1) % outline.length]!;
      if (a[1] > y !== b[1] > y && x < a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1])) crossings++;
    });
    return crossings % 2 === 1;
  }
}
