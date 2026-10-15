import { IAutoMovieVector3 } from "@automovie/interface";

import { subdivideAutoMovieSurface, IAutoMovieSubdivisionSurface } from "@automovie/engine";
import { fitAutoMovieHumanCageLimit } from "./fitAutoMovieHumanCageLimit";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";

/**
 * Solve the hand's cage and bring its measured lengths onto the skin: hand length from stylion to the middle fingertip, and hand breadth across metacarpale II and V.
 *
 * The cage is fitted to its skin points (`fitAutoMovieHumanCageLimit`), refined, and measured on the refined limit surface the way the survey measures a hand: the farthest skin beyond stylion along the hand, and the radial and ulnar extremes of the hand proper, the thumb's own surface aside, at the level of the metacarpal heads. The fit is regularised, so it reaches a narrow tip or border only nearly; the remaining shortfall moves the skin points of the fingers' distal segments along the hand, growing from each distal joint to its tip, and those of the palm's borders across it, fading over a fifth of the hand length from the heads. Three passes leave less than a hundredth of a millimetre.
 *
 * @param props What to solve
 * @returns Control points, by vertex, in the hand frame
 */
export function calibrateAutoMovieHumanHand(props: {
  /** Skin points by vertex, hand frame; adjusted in place. */
  targets: IAutoMovieVector3[];

  /** Quads. */
  faces: ReadonlyArray<readonly [number, number, number, number]>;

  /** The hand. */
  hand: readAutoMovieHumanHand.IHand;

  /** Hand length, millimetres. */
  length: number;

  /** Vertices of each finger beyond its socket, with the finger's joints. */
  fingers: Array<{ vertices: number[]; digit: readAutoMovieHumanHand.IDigit }>;

  /** Vertices of the thumb beyond its socket. */
  thumb: number[];
}): IAutoMovieVector3[] {
  const hand: readAutoMovieHumanHand.IHand = props.hand;
  const digits: Set<number> = new Set([...props.thumb, ...props.fingers.flatMap((f) => f.vertices)]);
  const thumb: Set<number> = new Set(props.thumb);
  const thumbFaces: boolean[] = props.faces.map((f: readonly number[]): boolean => f.some((v: number): boolean => thumb.has(v)));
  const heads: number = hand.metacarpaleII.x;
  const centre: number = (hand.metacarpaleII.z + hand.metacarpaleV.z) / 2;
  const half: number = (hand.metacarpaleII.z - hand.metacarpaleV.z) / 2;
  let positions: IAutoMovieVector3[] = [];
  for (let pass: number = 0; pass < 4; ++pass) {
    positions = fitAutoMovieHumanCageLimit({ targets: props.targets, faces: props.faces, sweeps: 400 });
    if (pass === 3) break;
    const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
      cage: {
        positions: positions.flatMap((p: IAutoMovieVector3): number[] => [p.x, p.y, p.z]),
        faces: props.faces.map((f: readonly number[]): number[] => [...f]),
      },
      levels: 3,
    });
    const limit: number[] = surface.limitPositions;
    let reach: number = -Infinity;
    let radial: number = -Infinity;
    let ulnar: number = Infinity;
    for (let v: number = 0; v < limit.length / 3; ++v) {
      const x: number = limit[3 * v]!;
      const z: number = limit[3 * v + 2]!;
      reach = Math.max(reach, x);
      if (Math.abs(x - heads) > 1 || thumbFaces[surface.parameters[v]!.face]) continue;
      radial = Math.max(radial, z);
      ulnar = Math.min(ulnar, z);
    }
    const along: number = hand.stylion.x + props.length - reach;
    const toRadial: number = hand.metacarpaleII.z - radial;
    const toUlnar: number = hand.metacarpaleV.z - ulnar;
    for (const finger of props.fingers) {
      const dip: number = finger.digit.points[2]!.x;
      const tip: number = finger.digit.points[3]!.x;
      for (const v of finger.vertices) {
        const t: IAutoMovieVector3 = props.targets[v]!;
        if (t.x > dip) props.targets[v] = { ...t, x: t.x + (along * (t.x - dip)) / (tip - dip) };
      }
    }
    props.targets.forEach((t: IAutoMovieVector3, v: number): void => {
      if (digits.has(v)) return;
      const level: number = Math.max(0, 1 - Math.abs(t.x - heads) / (0.2 * props.length));
      const across: number = (t.z - centre) / half;
      const shift: number =
        across > 0
          ? toRadial * Math.min(1, Math.max(0, 1.5 * across - 0.5))
          : toUlnar * Math.min(1, Math.max(0, -1.5 * across - 0.5));
      props.targets[v] = { ...t, z: t.z + shift * level };
    });
  }
  return positions;
}
