import { AutoMovieHumanSeam } from "../../lofting/AutoMovieHumanSeam";
import type { IAutoMovieHumanSeam } from "../../lofting/IAutoMovieHumanSeam";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * The foot's section arcs between junctions (the junctions' curvature channel
 * is `AutoMovieHumanFootJunction`).
 *
 * A junction's jet (place, unit tangent in the sense the ring runs, curvature
 * toward the inside) is owned by the guide that stands there; every arc on
 * either side copies it through the shared joining rule
 * (`AutoMovieHumanSeam.adopt`: `q_v = lambda T`, `q_vv = lambda^2 kappa N`),
 * so neighbouring arcs meet G2. An arc is the quintic Hermite of its two ends'
 * copied jets.
 */
export namespace AutoMovieHumanFootArc {
  /** A junction's jet in a section's plane. */
  export interface IJet {
    /** Place, `[across, up]` mm. */
    point: G.Vec2;

    /** Unit tangent in the sense the ring runs. */
    tangent: G.Vec2;

    /** Curvature toward the inside, 1/mm. */
    curvature: number;
  }

  /** A body section's piece: its name and the two junctions it runs between, in ring order. */
  export interface IPiece<Junction extends string> {
    /** The piece's name. */
    name: string;

    /** The junction it leaves. */
    from: Junction;

    /** The junction it reaches. */
    to: Junction;
  }

  /** A junction of a body section, at its guide. */
  export type BodyJunction = "crest" | "lateral" | "contactLateral" | "contactMedial" | "medial";

  /**
   * The body section's five pieces in ring order, each the quintic of its two
   * junctions' jets:
   *
   * - dorsalLateral: from the instep's crest over the dorsum's lateral slope to
   *   the lateral border, the side profile of the foot's lateral half;
   * - lateralPlantar: from the lateral border round the border onto the floor at
   *   the contact's lateral edge (behind the heel, onto the narrow posterior
   *   sector's lateral edge);
   * - sole: the contact between its lateral and medial edges; on the floor both
   *   edges are level with zero curvature, so the piece is the flat contact
   *   plane, and behind the heel's contact the edges' tangent and curvature are
   *   handed over by `AutoMovieHumanFootEdgeHandover`;
   * - arch: from the contact's medial edge on the floor up under the navicular
   *   region to the medial border; its clearance follows from where the medial
   *   edge stands across the sole and how high the border runs;
   * - dorsalMedial: from the medial border over the dorsum's medial slope (the
   *   first ray's dorsum and the arch's flank) to the crest.
   */
  export const BODY: readonly IPiece<BodyJunction>[] = [
    { name: "dorsalLateral", from: "crest", to: "lateral" },
    { name: "lateralPlantar", from: "lateral", to: "contactLateral" },
    { name: "sole", from: "contactLateral", to: "contactMedial" },
    { name: "arch", from: "contactMedial", to: "medial" },
    { name: "dorsalMedial", from: "medial", to: "crest" },
  ];

  /** A junction of a toe's section: the dorsal, lateral side, plantar and medial side points. */
  export type ToeJunction = "dorsal" | "lateral" | "plantar" | "medial";

  /**
   * A toe section's four pieces in ring order from the dorsal point toward the
   * lateral side: the nail side's lateral piece, the pad side's two, the nail
   * side's medial piece. The halves meet G2 at the side points, the section's
   * tightest turn.
   */
  export const TOE: readonly IPiece<ToeJunction>[] = [
    { name: "dorsalLateral", from: "dorsal", to: "lateral" },
    { name: "plantarLateral", from: "lateral", to: "plantar" },
    { name: "plantarMedial", from: "plantar", to: "medial" },
    { name: "dorsalMedial", from: "medial", to: "dorsal" },
  ];

  /**
   * A section's pieces from its junctions' jets.
   *
   * @param pieces The pieces in ring order.
   * @param jets Each junction's jet.
   * @param count Points of each piece less one.
   * @returns Each piece's points, in the pieces' order.
   */
  export function pieces<Junction extends string>(
    pieces: readonly IPiece<Junction>[],
    jets: Readonly<Record<Junction, IJet>>,
    count: number,
  ): G.Vec2[][] {
    return pieces.map((p: IPiece<Junction>): G.Vec2[] => quintic(jets[p.from], jets[p.to], count));
  }

  /**
   * The arc between two jets, `count + 1` points: the quintic Hermite of
   * their places, their tangents times the arc's speed and their curvature
   * vectors times its square. The speed is the quarter ellipse's arc on the
   * ends' extents along their tangents, `pi / 4 (a + b)`.
   */
  export function quintic(j0: IJet, j1: IJet, count: number): G.Vec2[] {
    const d: G.Vec2 = [j1.point[0] - j0.point[0], j1.point[1] - j0.point[1]];
    const speed: number =
      (Math.PI / 4) *
      (Math.abs(d[0] * j0.tangent[0] + d[1] * j0.tangent[1]) + Math.abs(d[0] * j1.tangent[0] + d[1] * j1.tangent[1]));
    const arcJet = (j: IJet): IAutoMovieHumanSeam.IArcJet => ({
      point: [...j.point],
      tangent: [...j.tangent],
      curvature: [j.curvature * j.tangent[1], -j.curvature * j.tangent[0]],
    });
    const first: ReturnType<typeof AutoMovieHumanSeam.adopt> = AutoMovieHumanSeam.adopt(arcJet(j0), speed);
    const last: ReturnType<typeof AutoMovieHumanSeam.adopt> = AutoMovieHumanSeam.adopt(arcJet(j1), speed);
    const v0: number[] = first[1];
    const a0: number[] = first[2];
    const v1: number[] = last[1];
    const a1: number[] = last[2];
    return Array.from({ length: count + 1 }, (_: unknown, i: number): G.Vec2 => {
      const s: number = i / count;
      const s2: number = s * s;
      const s3: number = s2 * s;
      const s4: number = s3 * s;
      const s5: number = s4 * s;
      const h0: number = 1 - 10 * s3 + 15 * s4 - 6 * s5;
      const h1: number = s - 6 * s3 + 8 * s4 - 3 * s5;
      const h2: number = 0.5 * (s2 - 3 * s3 + 3 * s4 - s5);
      const h3: number = 0.5 * (s3 - 2 * s4 + s5);
      const h4: number = -4 * s3 + 7 * s4 - 3 * s5;
      const h5: number = 10 * s3 - 15 * s4 + 6 * s5;
      return [0, 1].map(
        (c: number): number =>
          h0 * j0.point[c]! + h1 * v0[c]! + h2 * a0[c]! + h3 * a1[c]! + h4 * v1[c]! + h5 * j1.point[c]!,
      ) as G.Vec2;
    });
  }
}
