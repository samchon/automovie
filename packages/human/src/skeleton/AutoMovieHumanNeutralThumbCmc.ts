import type {
  AutoMovieQuaternionTuple,
  AutoMovieVector3Tuple,
  IAutoMovieHumanChainRings,
  IAutoMovieHumanNeutralBody,
} from "@automovie/interface";

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
    hand: AutoMovieQuaternionTuple,
  ): AutoMovieVector3Tuple {
    const index: AutoMovieVector3Tuple = Math3D.unit(
      body.between(`${side}Hand`, `${side}IndexProximal`),
    );
    const bind: AutoMovieVector3Tuple = body.direction(
      `${side}ThumbMetacarpal`,
    );
    const thumb: IAutoMovieHumanChainRings | undefined = rings.find(
      (r: IAutoMovieHumanChainRings): boolean => r.chain === `thumb.${side}`,
    );
    const palm: IAutoMovieHumanChainRings | undefined = rings.find(
      (r: IAutoMovieHumanChainRings): boolean => r.chain === `hand.${side}.1`,
    );
    if (thumb === undefined || palm === undefined)
      return Math3D.unit(Math3D.rotate(hand, index));

    // The thumb's skin past its root ring, in the bind.
    const joint: AutoMovieVector3Tuple = body.byBone.get(
      `${side}ThumbMetacarpal`,
    )!.position;
    const rows: AutoMovieVector3Tuple[][] = ringsOf(thumb);
    const depth: number[] = rows.map((r: AutoMovieVector3Tuple[]): number =>
      Turn.length(centroid(r), joint),
    );
    const root: number = depth.indexOf(Math.min(...depth));
    const skin: AutoMovieVector3Tuple[] = rows
      .filter((_: AutoMovieVector3Tuple[], k: number): boolean => k !== root)
      .flat();
    const hull: ISlab[] = slabs(ringsOf(palm));

    // The nearest share to the index line at which the turned skin stays out.
    for (let share: number = 1; share > 0; share -= STEP) {
      const along: AutoMovieVector3Tuple = Math3D.unit(
        Math3D.add(Math3D.times(bind, 1 - share), Math3D.times(index, share)),
      );
      const turn: AutoMovieQuaternionTuple = Turn.arc(bind, along);
      const clear: boolean = skin.every(
        (p: AutoMovieVector3Tuple): boolean =>
          !inside(
            hull,
            Math3D.add(joint, Math3D.rotate(turn, Math3D.sub(p, joint))),
          ),
      );
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
    hand: AutoMovieQuaternionTuple,
    along: AutoMovieVector3Tuple,
  ): AutoMovieQuaternionTuple {
    return Turn.straighten(body, `${side}ThumbMetacarpal`, hand, along);
  }

  /*
   * A chain's rings as point lists.
   */
  function ringsOf(
    chain: IAutoMovieHumanChainRings,
  ): AutoMovieVector3Tuple[][] {
    const n: number = chain.phases;
    return chain.stations.map((_: number, k: number): AutoMovieVector3Tuple[] =>
      Array.from(
        { length: n },
        (__: unknown, m: number): AutoMovieVector3Tuple => {
          const i: number = 3 * (k * n + m);
          return [chain.points[i]!, chain.points[i + 1]!, chain.points[i + 2]!];
        },
      ),
    );
  }

  /*
   * The mean of points.
   */
  function centroid(
    points: readonly AutoMovieVector3Tuple[],
  ): AutoMovieVector3Tuple {
    return Math3D.times(
      points.reduce(
        (
          s: AutoMovieVector3Tuple,
          p: AutoMovieVector3Tuple,
        ): AutoMovieVector3Tuple => Math3D.add(s, p),
        [0, 0, 0],
      ),
      1 / points.length,
    );
  }

  /*
   * One ring of a chain's skin as a slab: its centroid, its plane's normal
   * (along the line through its neighbours' centroids), the slab's half
   * thickness (half the gap to the neighbours either side) and its outline in
   * its own plane.
   */
  interface ISlab {
    /*
     * The ring's centroid.
     */
    centre: AutoMovieVector3Tuple;

    /*
     * Unit normal of the ring's plane.
     */
    normal: AutoMovieVector3Tuple;

    /*
     * Half thickness of the slab the ring stands for, mm.
     */
    half: number;

    /*
     * First in-plane axis.
     */
    e1: AutoMovieVector3Tuple;

    /*
     * Second in-plane axis.
     */
    e2: AutoMovieVector3Tuple;

    /*
     * The ring in its plane, `[along e1, along e2]`.
     */
    outline: [number, number][];
  }

  /*
   * A chain's rings as slabs, read once per chain: every point the scan
   * tests reads the same slabs, so their centroids, normals and outlines are
   * fixed before the scan.
   */
  function slabs(rings: readonly AutoMovieVector3Tuple[][]): ISlab[] {
    const centres: AutoMovieVector3Tuple[] = rings.map(centroid);
    return rings.map((ring: AutoMovieVector3Tuple[], k: number): ISlab => {
      const a: AutoMovieVector3Tuple = centres[Math.max(0, k - 1)]!;
      const b: AutoMovieVector3Tuple =
        centres[Math.min(rings.length - 1, k + 1)]!;
      const normal: AutoMovieVector3Tuple = Math3D.unit(Math3D.sub(b, a));
      const centre: AutoMovieVector3Tuple = centres[k]!;
      const e1: AutoMovieVector3Tuple = Math3D.unit(
        Turn.perpendicular(Math3D.sub(ring[0]!, centre), normal),
      );
      const e2: AutoMovieVector3Tuple = Turn.cross(normal, e1);
      return {
        centre,
        normal,
        half: Turn.length(a, b) / (k === 0 || k === rings.length - 1 ? 2 : 4),
        e1,
        e2,
        outline: ring.map((q: AutoMovieVector3Tuple): [number, number] => [
          Turn.dot(Math3D.sub(q, centre), e1),
          Turn.dot(Math3D.sub(q, centre), e2),
        ]),
      };
    });
  }

  /*
   * Whether a point lies inside a chain's skin: within the slab of the ring
   * whose plane it is nearest, and inside that ring's outline in its plane
   * (crossing number).
   */
  function inside(hull: readonly ISlab[], p: AutoMovieVector3Tuple): boolean {
    let best: ISlab | null = null;
    let least: number = Infinity;
    for (const slab of hull) {
      const offset: number = Math.abs(
        Turn.dot(Math3D.sub(p, slab.centre), slab.normal),
      );
      if (offset <= slab.half && offset < least) {
        least = offset;
        best = slab;
      }
    }
    if (best === null) return false;

    // The point in the ring's plane against its outline.
    const d: AutoMovieVector3Tuple = Math3D.sub(p, best.centre);
    const x: number = Turn.dot(d, best.e1);
    const y: number = Turn.dot(d, best.e2);
    const outline: [number, number][] = best.outline;
    let crossings: number = 0;
    outline.forEach((a: [number, number], i: number): void => {
      const b: [number, number] = outline[(i + 1) % outline.length]!;
      if (
        a[1] > y !== b[1] > y &&
        x < a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1])
      )
        crossings++;
    });
    return crossings % 2 === 1;
  }
}
