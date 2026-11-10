import { AutoMovieLoftChain, type AutoMovieViewLoft } from "@automovie/engine";

import { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanF1Arm } from "./AutoMovieHumanF1Arm";
import { AutoMovieHumanF1FingerIndex } from "./AutoMovieHumanF1FingerIndex";
import { AutoMovieHumanF1FingerMiddle } from "./AutoMovieHumanF1FingerMiddle";
import { AutoMovieHumanF1FingerPinky } from "./AutoMovieHumanF1FingerPinky";
import { AutoMovieHumanF1FingerRing } from "./AutoMovieHumanF1FingerRing";
import { AutoMovieHumanF1FingerThumb } from "./AutoMovieHumanF1FingerThumb";
import { AutoMovieHumanF1Foot } from "./AutoMovieHumanF1Foot";
import { AutoMovieHumanF1Leg } from "./AutoMovieHumanF1Leg";
import { AutoMovieHumanF1ToeBig } from "./AutoMovieHumanF1ToeBig";
import { AutoMovieHumanF1ToeIndex } from "./AutoMovieHumanF1ToeIndex";
import { AutoMovieHumanF1ToeLittle } from "./AutoMovieHumanF1ToeLittle";
import { AutoMovieHumanF1ToeMiddle } from "./AutoMovieHumanF1ToeMiddle";
import { AutoMovieHumanF1ToeRing } from "./AutoMovieHumanF1ToeRing";
import { AutoMovieHumanF1Trunk } from "./AutoMovieHumanF1Trunk";

/**
 * The f1 figure in its reference pose, generated from its authored conic
 * families alone: no reference mesh, recovered curve or observation file is
 * read anywhere on this path.
 *
 * Each family is lofted through the engine's view loft and sampled on its own
 * station and phase grid. A family that has a twin across the median plane is
 * emitted a second time reflected in `z = 0`.
 *
 * The figure is under construction: it holds the arms from below the armpit
 * to the wrist, the legs from below the crotch to above the ankle, the trunk
 * from the hip to below the bust, the shafts of the five digits of each hand
 * and foot, and each midfoot. The parts are separate open tubes; the
 * branches between them, the palms, heels, digit tips, pelvis, chest,
 * shoulders, neck and head are not built yet.
 */
export namespace AutoMovieHumanF1 {
  /** One generated surface piece. */
  export interface IPiece {
    /** Chain name, with `.mirror` for the reflected twin. */
    name: string;

    /** Vertex positions, three per vertex, metres in the figure's frame (forward +X, up +Y, left +Z). */
    positions: number[];

    /** Triangle indices, counter-clockwise seen from outside. */
    indices: number[];

    /** Diagnostics of the engine's loft; empty when the family was admitted whole. */
    diagnostics: AutoMovieViewLoft.IResult["diagnostics"];
  }

  /** Every authored family with whether it has a mirrored twin. */
  export const FAMILIES: readonly { family: AutoMovieHumanConicLoft.IFamily; mirrored: boolean }[] = [
    { family: AutoMovieHumanF1Trunk, mirrored: false },
    { family: AutoMovieHumanF1Arm, mirrored: true },
    { family: AutoMovieHumanF1Leg, mirrored: true },
    { family: AutoMovieHumanF1FingerIndex, mirrored: true },
    { family: AutoMovieHumanF1FingerMiddle, mirrored: true },
    { family: AutoMovieHumanF1FingerPinky, mirrored: true },
    { family: AutoMovieHumanF1FingerRing, mirrored: true },
    { family: AutoMovieHumanF1FingerThumb, mirrored: true },
    { family: AutoMovieHumanF1Foot, mirrored: true },
    { family: AutoMovieHumanF1ToeBig, mirrored: true },
    { family: AutoMovieHumanF1ToeIndex, mirrored: true },
    { family: AutoMovieHumanF1ToeLittle, mirrored: true },
    { family: AutoMovieHumanF1ToeMiddle, mirrored: true },
    { family: AutoMovieHumanF1ToeRing, mirrored: true },
  ];

  /**
   * Generate the figure's pieces.
   *
   * @param step Station spacing of the layers, mm.
   * @param phases Vertices round every layer.
   */
  export function create(step: number = 4, phases: number = 128): IPiece[] {
    const pieces: IPiece[] = [];
    for (const { family, mirrored } of FAMILIES) {
      // Layers from the first knot to the last, evenly spaced at most `step` apart.
      const from: number = family.knots[0]!;
      const to: number = family.knots.at(-1)!;
      const count: number = Math.max(2, Math.ceil((to - from) / step) + 1);
      const stations: number[] = Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1));
      const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, stations);
      if (loft.chain === null) {
        pieces.push({ name: family.name, positions: [], indices: [], diagnostics: loft.diagnostics });
        continue;
      }
      const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
      const rings: number[][][] = stations.map((s: number): number[][] => Array.from({ length: phases }, (_: unknown, j: number): number[] => AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / phases)));
      for (const sign of mirrored ? [1, -1] : [1]) {
        const positions: number[] = [];
        const indices: number[] = [];
        for (const ring of rings) for (const p of ring) positions.push(p[0]! / 1000, p[1]! / 1000, (sign * p[2]!) / 1000);
        for (let i: number = 0; i + 1 < rings.length; ++i)
          for (let j: number = 0; j < phases; ++j) {
            const a: number = i * phases + j;
            const b: number = i * phases + ((j + 1) % phases);

            // The reflection reverses the winding, so the twin's triangles are listed the other way round.
            if (sign > 0) indices.push(a, a + phases, b, b, a + phases, b + phases);
            else indices.push(a, b, a + phases, b, b + phases, a + phases);
          }
        pieces.push({ name: family.name + (sign > 0 ? "" : ".mirror"), positions, indices, diagnostics: loft.diagnostics });
      }
    }
    return pieces;
  }
}
