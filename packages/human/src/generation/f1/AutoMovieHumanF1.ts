import { AutoMovieLoftChain, type AutoMovieConstructionRealization, type AutoMovieViewLoft, type IAutoMovieViewPart, realizeAutoMovieConstruction } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionPort } from "@automovie/interface";

import { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanF1Arm } from "./AutoMovieHumanF1Arm";
import { AutoMovieHumanF1FingerIndex } from "./AutoMovieHumanF1FingerIndex";
import { AutoMovieHumanF1FingerMiddle } from "./AutoMovieHumanF1FingerMiddle";
import { AutoMovieHumanF1FingerPinky } from "./AutoMovieHumanF1FingerPinky";
import { AutoMovieHumanF1FingerRing } from "./AutoMovieHumanF1FingerRing";
import { AutoMovieHumanF1FingerThumb } from "./AutoMovieHumanF1FingerThumb";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
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
 * The body is one sewn skin, built by the engine's construction operators
 * from five families: the trunk from the crotch to the crown, and on each side
 * an arm that runs from below the armpit through the wrist to the knuckles and
 * a leg that runs from below the crotch round the ankle to the ball of the
 * foot. The trunk's open lower end is split into the two legs along the
 * midsagittal chord, and each arm is attached at a port on the trunk's
 * shoulder. No intersection is traced: every band spans from a curve on the
 * trunk to a ring of the limb and meets both G2.
 *
 * The figure is under construction. The digits are separate open tubes that
 * reach into the hand and the foot without being sewn; the digit tips, the
 * crown, the knuckle end of each hand and the ball end of each foot are open;
 * and the head's ears, nose and mouth are a wall with height fields over it.
 */
export namespace AutoMovieHumanF1 {
  /** One generated surface piece. */
  export interface IPiece {
    /** `body` for the sewn skin, else a digit's chain name, with `.mirror` for the reflected twin. */
    name: string;

    /** Vertex positions, three per vertex, metres in the figure's frame (forward +X, up +Y, left +Z). */
    positions: number[];

    /** Triangle indices, counter-clockwise seen from outside. */
    indices: number[];

    /** What the engine refused, one line each; empty when the piece was admitted whole. */
    diagnostics: string[];
  }

  /** One authored family in the figure. */
  export interface IMember {
    /** The authored definition. */
    family: AutoMovieHumanConicLoft.IFamily;

    /** Present a second time as its twin across the median plane `z = 0`. */
    mirrored: boolean;

    /**
     * How far a loose family is carried before its first knot and past its last, mm. There its fields continue as the straight
     * end tangents of their natural cubics, so a digit reaches into the hand or the foot. The overlap is not a join. Absent, no reach.
     */
    reach?: [number, number];
  }

  /** The families the sewn body is built from. */
  export const BODY: { trunk: AutoMovieHumanConicLoft.IFamily; arm: AutoMovieHumanConicLoft.IFamily; leg: AutoMovieHumanConicLoft.IFamily } = { trunk: AutoMovieHumanF1Trunk, arm: AutoMovieHumanF1Arm, leg: AutoMovieHumanF1Leg };

  /** The families not sewn yet: the digits. */
  export const LOOSE: readonly IMember[] = [
    { family: AutoMovieHumanF1FingerIndex, mirrored: true, reach: [10, 0] },
    { family: AutoMovieHumanF1FingerMiddle, mirrored: true, reach: [10, 0] },
    { family: AutoMovieHumanF1FingerPinky, mirrored: true, reach: [10, 0] },
    { family: AutoMovieHumanF1FingerRing, mirrored: true, reach: [10, 0] },
    { family: AutoMovieHumanF1FingerThumb, mirrored: true, reach: [10, 0] },
    { family: AutoMovieHumanF1ToeBig, mirrored: true, reach: [8, 0] },
    { family: AutoMovieHumanF1ToeIndex, mirrored: true, reach: [8, 0] },
    { family: AutoMovieHumanF1ToeLittle, mirrored: true, reach: [8, 0] },
    { family: AutoMovieHumanF1ToeMiddle, mirrored: true, reach: [8, 0] },
    { family: AutoMovieHumanF1ToeRing, mirrored: true, reach: [8, 0] },
  ];

  /** Every authored family of the figure. */
  export const FAMILIES: readonly IMember[] = [{ family: BODY.trunk, mirrored: false }, { family: BODY.arm, mirrored: true }, { family: BODY.leg, mirrored: true }, ...LOOSE];

  /** Station spacing of the layers and derived outlines of a sewn family, mm: the spacing at which the engine admits these families as faces. */
  const LAYER_MM: number = 2;

  /** Radius of the arm at its armscye plane, mm, read off the reference's section there. */
  const ARMSCYE_RADIUS_MM: number = 48;

  /** How far outside the arm's root the port loop stands on the trunk's own skin, mm. */
  const ARMSCYE_MARGIN_MM: number = 10;

  /** Where each limb's band lands on it, mm from the limb's first station: the limb keeps its stations beyond. */
  const RAIL_MM: { arm: number; leg: number } = { arm: 10, leg: 12 };

  /** Columns round each band and rows across it. */
  const BAND: { count: number; rows: number } = { count: 96, rows: 8 };

  /** The sewn body's declaration: its construction tree and the view parts its source leaves name. */
  export interface IConstruction {
    /** The tree: both arm ports over the crotch split over the trunk. */
    root: AutoMovieConstructionNode;

    /** The view part of every source leaf, by its name. */
    sources: Map<string, IAutoMovieViewPart>;
  }

  /**
   * The armscye's port on the trunk's chart.
   *
   * Its centre is where the upper arm's axis meets the armscye plane. Its semi-axes are the arm's girth there as the trunk's chart sees it,
   * the station one foreshortened by the arm's slope, both widened by the margin so the loop stands on the trunk's skin round the arm's root.
   *
   * @param side +1 for the +Z side, -1 for its twin.
   */
  export function armscye(side: 1 | -1): IAutoMovieConstructionPort.ILoop {
    const J = AutoMovieHumanF1Joints;
    const length: number = Math.hypot(J.lowerarm[0] - J.upperarm[0], J.lowerarm[1] - J.upperarm[1], J.lowerarm[2] - J.upperarm[2]);
    const d: number[] = [0, 1, 2].map((c: number): number => (J.lowerarm[c]! - J.upperarm[c]!) / length);
    const hub: number[] = [0, 1, 2].map((c: number): number => J.upperarm[c]! + J.armscye * d[c]!);
    return {
      centre: [(hub[1]! - J.axisFloor[1]) / 1000, side * Math.atan2(hub[2]!, hub[0]!)],
      semi: [(ARMSCYE_RADIUS_MM * (Math.abs(d[2]!) / Math.hypot(d[1]!, d[2]!)) + ARMSCYE_MARGIN_MM) / 1000, Math.atan((ARMSCYE_RADIUS_MM + ARMSCYE_MARGIN_MM) / hub[2]!)],
      sense: 1,
    };
  }

  /** Declare the sewn body. */
  export function construction(): IConstruction {
    const sources: Map<string, IAutoMovieViewPart> = new Map();
    const leaf = (family: AutoMovieHumanConicLoft.IFamily): AutoMovieConstructionNode => {
      const from: number = family.knots[0]!;
      const to: number = family.knots.at(-1)!;
      const count: number = Math.ceil((to - from) / LAYER_MM) + 1;
      sources.set(family.name, AutoMovieHumanConicLoft.part(family, Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1))));
      return { type: "source", name: family.name, source: family.name };
    };
    const twin = (family: AutoMovieHumanConicLoft.IFamily): AutoMovieHumanConicLoft.IFamily => AutoMovieHumanConicLoft.mirror(family, family.name + ".mirror");
    const trunk: string = BODY.trunk.name;

    // The trunk's section chart has +u forward and +v to +Z, so the seam from phase 0 to pi gives the first child the +Z half of the end.
    let root: AutoMovieConstructionNode = {
      type: "split",
      name: "crotch",
      host: leaf(BODY.trunk),
      hostFace: trunk,
      hostEnd: "bottom",
      seam: [0, Math.PI],
      count: BAND.count,
      rows: BAND.rows,
      children: [
        { band: "band." + BODY.leg.name, part: leaf(BODY.leg), partFace: BODY.leg.name, partEnd: "bottom", rail: RAIL_MM.leg / 1000 },
        { band: "band." + BODY.leg.name + ".mirror", part: leaf(twin(BODY.leg)), partFace: BODY.leg.name + ".mirror", partEnd: "bottom", rail: RAIL_MM.leg / 1000 },
      ],
    };
    for (const side of [1, -1] as const) {
      const arm: AutoMovieHumanConicLoft.IFamily = side > 0 ? BODY.arm : twin(BODY.arm);
      root = { type: "port", name: "armscye." + arm.name, host: root, hostFace: trunk, loop: armscye(side), band: "band." + arm.name, part: leaf(arm), partFace: arm.name, partEnd: "bottom", rail: RAIL_MM.arm / 1000, count: BAND.count, rows: BAND.rows };
    }
    return { root, sources };
  }

  /**
   * Generate the figure's pieces: the sewn body, then every loose family and its twin.
   *
   * @param step Station spacing of a loose family's layers, mm.
   * @param phases Vertices round every layer of a loose family.
   */
  export function create(step: number = 4, phases: number = 128): IPiece[] {
    const declared: IConstruction = construction();
    const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "f1.body", root: declared.root }, { chord: 0.001, sources: declared.sources });
    const pieces: IPiece[] = [{ name: "body", positions: Array.from(real.mesh.positions), indices: Array.from(real.mesh.indices), diagnostics: real.diagnostics.map((d: { node: string; contract: string; detail: string }): string => d.node + " (" + d.contract + "): " + d.detail) }];
    for (const { family, mirrored, reach } of LOOSE) {
      // Layers from the first knot to the last, widened by the member's reach, evenly spaced at most `step` apart.
      const from: number = family.knots[0]! - (reach?.[0] ?? 0);
      const to: number = family.knots.at(-1)! + (reach?.[1] ?? 0);
      const count: number = Math.max(2, Math.ceil((to - from) / step) + 1);
      const stations: number[] = Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1));
      const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, stations);
      const diagnostics: string[] = loft.diagnostics.map((d: unknown): string => JSON.stringify(d));
      if (loft.chain === null) {
        pieces.push({ name: family.name, positions: [], indices: [], diagnostics });
        continue;
      }
      const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;

      // Past the last knot the loft's own cap layers follow, and the pole closes them by a fan.
      const layers: number[] = [...stations, ...chain.layers.map((layer: { y: number }): number => layer.y).filter((y: number): boolean => y > to)];
      const rings: number[][][] = layers.map((s: number): number[][] => Array.from({ length: phases }, (_: unknown, j: number): number[] => AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / phases)));
      for (const sign of mirrored ? [1, -1] : [1]) {
        const positions: number[] = [];
        const indices: number[] = [];
        for (const ring of rings) for (const p of ring) positions.push(p[0]! / 1000, p[1]! / 1000, (sign * p[2]!) / 1000);
        if (chain.pole?.end === "top") {
          const apex: number = positions.length / 3;
          const last: number = (rings.length - 1) * phases;
          positions.push(chain.pole.point[0] / 1000, chain.pole.point[1] / 1000, (sign * chain.pole.point[2]) / 1000);
          for (let j: number = 0; j < phases; ++j) indices.push(...(sign > 0 ? [last + j, apex, last + ((j + 1) % phases)] : [last + j, last + ((j + 1) % phases), apex]));
        }
        for (let i: number = 0; i + 1 < rings.length; ++i)
          for (let j: number = 0; j < phases; ++j) {
            const a: number = i * phases + j;
            const b: number = i * phases + ((j + 1) % phases);

            // The reflection reverses the winding, so the twin's triangles are listed the other way round.
            if (sign > 0) indices.push(a, a + phases, b, b, a + phases, b + phases);
            else indices.push(a, b, a + phases, b, b + phases, a + phases);
          }
        pieces.push({ name: family.name + (sign > 0 ? "" : ".mirror"), positions, indices, diagnostics });
      }
    }
    return pieces;
  }
}
