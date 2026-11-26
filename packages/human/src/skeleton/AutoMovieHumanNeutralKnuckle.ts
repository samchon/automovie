import type {
  AutoMovieQuaternionTuple,
  AutoMovieVector3Tuple,
  IAutoMovieHumanChainRings,
  IAutoMovieHumanNeutralBody,
  IAutoMovieHumanNeutralKnuckle,
} from "@automovie/interface";

import { AutoMovieHumanNeutralTurn as Turn } from "./AutoMovieHumanNeutralTurn";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * A finger's metacarpophalangeal neutral: the proximal phalanx extended along
 * the hand (Neutral-0: the extended position is the zero of every finger
 * motion), the fingers side by side at the least spread at which their skins do
 * not cross.
 *
 * Extended fingers laid parallel at the knuckles' own spacing cross wherever
 * two neighbours are together thicker than the knuckles stand apart, so, as the
 * resting arm clears the trunk, each pair of neighbours parts by the least
 * angle in the palm's plane at which their skins meet and no more: at each
 * depth of a finger's shaft the axes' gap grows by the depth times the sine of
 * the angle, and it must reach the two fingers' radii at that depth. The middle
 * finger is the hand's axis and stays on it; the index parts radially, the ring
 * and the little ulnarly, each from its neighbour nearer the middle.
 */
export namespace AutoMovieHumanNeutralKnuckle {
  /** The fingers, radial to ulnar. */
  export const FINGERS: readonly string[] = [
    "Index",
    "Middle",
    "Ring",
    "Little",
  ];

  /**
   * Each finger's line at neutral.
   *
   * @param body The bind skeleton.
   * @param rings The skin; the side's finger chains `finger.<side>.<name>` are
   *   read.
   * @param side Which hand.
   * @param hand The hand's world turn.
   * @param down The arm's unit direction at neutral, the middle finger's line.
   * @returns Each finger's unit direction, by the names of {@link FINGERS}.
   */
  export function lines(
    body: IAutoMovieHumanNeutralBody,
    rings: readonly IAutoMovieHumanChainRings[],
    side: "left" | "right",
    hand: AutoMovieQuaternionTuple,
    down: AutoMovieVector3Tuple,
  ): Map<string, AutoMovieVector3Tuple> {
    const out: Map<string, AutoMovieVector3Tuple> = new Map(
      FINGERS.map((f: string): [string, AutoMovieVector3Tuple] => [f, down]),
    );
    const fingers: (IAutoMovieHumanNeutralKnuckle.IFinger | null)[] =
      FINGERS.map((f: string): IAutoMovieHumanNeutralKnuckle.IFinger | null =>
        read(body, rings, side, f),
      );
    if (
      fingers.some(
        (f: IAutoMovieHumanNeutralKnuckle.IFinger | null): boolean =>
          f === null,
      )
    )
      return out;
    const read4: IAutoMovieHumanNeutralKnuckle.IFinger[] =
      fingers as IAutoMovieHumanNeutralKnuckle.IFinger[];

    // The palm's across direction, radial positive, square to the hand's axis at the bind.
    const axis: AutoMovieVector3Tuple = Math3D.unit(
      body.between(`${side}Hand`, `${side}MiddleProximal`),
    );
    const span: AutoMovieVector3Tuple = Math3D.sub(
      read4[0]!.knuckle,
      read4[3]!.knuckle,
    );
    const across: AutoMovieVector3Tuple = Math3D.unit(
      Turn.perpendicular(span, axis),
    );

    // The least parting of each neighbouring pair, radians.
    function part(
      a: IAutoMovieHumanNeutralKnuckle.IFinger,
      b: IAutoMovieHumanNeutralKnuckle.IFinger,
    ): number {
      const gap: number = Math.abs(
        Turn.dot(Math3D.sub(a.knuckle, b.knuckle), across),
      );
      let most: number = 0;
      a.depths.forEach((depth: number, k: number): void => {
        const need: number = a.radii[k]! + radiusAt(b, depth) - gap;
        if (need > 0 && depth > 0)
          most = Math.max(most, Math.asin(Math.min(1, need / depth)));
      });
      return most;
    }
    const angles: number[] = [
      part(read4[0]!, read4[1]!),
      0,
      -part(read4[1]!, read4[2]!),
      0,
    ];
    angles[3] = angles[2]! - part(read4[2]!, read4[3]!);

    // Each line in the palm's plane at neutral: the hand's across direction
    // carried by its turn, taken square to the arm's line.
    const side3: AutoMovieVector3Tuple = Math3D.unit(
      Turn.perpendicular(Math3D.rotate(hand, across), down),
    );
    FINGERS.forEach((f: string, i: number): void => {
      const a: number = angles[i]!;
      out.set(
        f,
        Math3D.unit(
          Math3D.add(
            Math3D.times(down, Math.cos(a)),
            Math3D.times(side3, Math.sin(a)),
          ),
        ),
      );
    });
    return out;
  }

  /**
   * Derive one finger's proximal phalanx.
   *
   * @param body The bind skeleton.
   * @param side Which hand.
   * @param finger Which finger, one of {@link FINGERS}.
   * @param hand The hand's world turn.
   * @param line The finger's unit direction at neutral, from {@link lines}.
   * @returns The proximal phalanx's world turn.
   */
  export function derive(
    body: IAutoMovieHumanNeutralBody,
    side: "left" | "right",
    finger: string,
    hand: AutoMovieQuaternionTuple,
    line: AutoMovieVector3Tuple,
  ): AutoMovieQuaternionTuple {
    return Turn.straighten(body, `${side}${finger}Proximal`, hand, line);
  }

  /** A finger's radius at a depth: its shaft ring nearest that depth. */
  function radiusAt(
    finger: IAutoMovieHumanNeutralKnuckle.IFinger,
    depth: number,
  ): number {
    let best: number = 0;
    finger.depths.forEach((d: number, k: number): void => {
      if (Math.abs(d - depth) < Math.abs(finger.depths[best]! - depth))
        best = k;
    });
    return finger.radii[best] ?? 0;
  }

  /**
   * One finger's skin: its knuckle and its shaft rings' depths and radii, or
   * null without its chain.
   */
  function read(
    body: IAutoMovieHumanNeutralBody,
    rings: readonly IAutoMovieHumanChainRings[],
    side: "left" | "right",
    finger: string,
  ): IAutoMovieHumanNeutralKnuckle.IFinger | null {
    const chain: IAutoMovieHumanChainRings | undefined = rings.find(
      (r: IAutoMovieHumanChainRings): boolean =>
        r.chain === `finger.${side}.${finger.toLowerCase()}`,
    );
    const joint: AutoMovieVector3Tuple | undefined = body.byBone.get(
      `${side}${finger}Proximal`,
    )?.position;
    if (chain === undefined || joint === undefined || chain.stations.length < 4)
      return null;

    // Each ring's centroid and its largest radius about it.
    const n: number = chain.phases;
    const rows: { centre: AutoMovieVector3Tuple; radius: number }[] =
      chain.stations.map(
        (
          _: number,
          k: number,
        ): { centre: AutoMovieVector3Tuple; radius: number } => {
          const points: AutoMovieVector3Tuple[] = Array.from(
            { length: n },
            (__: unknown, m: number): AutoMovieVector3Tuple => {
              const i: number = 3 * (k * n + m);
              return [
                chain.points[i]!,
                chain.points[i + 1]!,
                chain.points[i + 2]!,
              ];
            },
          );
          const centre: AutoMovieVector3Tuple = Math3D.times(
            points.reduce(
              (
                s: AutoMovieVector3Tuple,
                p: AutoMovieVector3Tuple,
              ): AutoMovieVector3Tuple => Math3D.add(s, p),
              [0, 0, 0],
            ),
            1 / n,
          );
          return {
            centre,
            radius: Math.max(
              ...points.map((p: AutoMovieVector3Tuple): number =>
                Turn.length(p, centre),
              ),
            ),
          };
        },
      );

    // The root ring is the one nearest the knuckle, where the finger leaves the
    // palm; the pulp's closing rings (the farthest two) are no section of the
    // shaft.
    const depths: number[] = rows.map(
      (r: { centre: AutoMovieVector3Tuple }): number =>
        Turn.length(r.centre, joint),
    );
    const order: number[] = depths
      .map((_: number, k: number): number => k)
      .sort((a: number, b: number): number => depths[a]! - depths[b]!);
    const shaft: number[] = order.slice(1, order.length - 2);
    return {
      knuckle: joint,
      depths: shaft.map((k: number): number => depths[k]!),
      radii: shaft.map((k: number): number => rows[k]!.radius),
    };
  }
}
