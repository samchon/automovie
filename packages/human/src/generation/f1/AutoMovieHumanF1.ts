import { AutoMovieLoftChain, type AutoMovieConstructionRealization, type AutoMovieViewLoft, type IAutoMovieViewPart, realizeAutoMovieConstruction } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionPort } from "@automovie/interface";

import { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanF1Arm } from "./AutoMovieHumanF1Arm";
import { AutoMovieHumanF1Ear } from "./AutoMovieHumanF1Ear";
import { AutoMovieHumanF1FingerIndex } from "./AutoMovieHumanF1FingerIndex";
import { AutoMovieHumanF1FingerMiddle } from "./AutoMovieHumanF1FingerMiddle";
import { AutoMovieHumanF1FingerPinky } from "./AutoMovieHumanF1FingerPinky";
import { AutoMovieHumanF1FingerRing } from "./AutoMovieHumanF1FingerRing";
import { AutoMovieHumanF1FingerThumb } from "./AutoMovieHumanF1FingerThumb";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Leg } from "./AutoMovieHumanF1Leg";
import { AutoMovieHumanF1Nose } from "./AutoMovieHumanF1Nose";
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
 * The body is one sewn skin, built by the engine's construction operators:
 * the trunk from the crotch to the crown, and on each side an arm that runs
 * from below the armpit through the wrist to the finger webs, a leg that runs
 * from below the crotch round the ankle to the toe webs, an ear, five fingers
 * and five toes. The trunk's open lower end is split into the two legs along
 * the midsagittal chord, and each arm and each ear is attached at a port on
 * the trunk; those bands span from a curve on the trunk to a ring of the part
 * and meet both G2 without a traced intersection. Each finger and toe is a
 * capsule merged onto its limb's cap along the curve where it comes out. The
 * crown, each hand, each foot, each ear and each digit close in a pole.
 *
 * The hand's sections leave out the thumb past where it stands free, as the
 * trunk's leave out the arms and the ears. The face's nose, eyes and mouth are
 * height fields over the trunk's wall, and the ear is its outer form without
 * the concha.
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
  export const BODY: { trunk: AutoMovieHumanConicLoft.IFamily; arm: AutoMovieHumanConicLoft.IFamily; leg: AutoMovieHumanConicLoft.IFamily; ear: AutoMovieHumanConicLoft.IFamily; nose: AutoMovieHumanConicLoft.IFamily } = { trunk: AutoMovieHumanF1Trunk, arm: AutoMovieHumanF1Arm, leg: AutoMovieHumanF1Leg, ear: AutoMovieHumanF1Ear, nose: AutoMovieHumanF1Nose };

  /** One digit sewn to its limb. */
  export interface IDigit {
    /** The digit's authored definition. */
    family: AutoMovieHumanConicLoft.IFamily;

    /** The limb whose cap it leaves through. */
    limb: "arm" | "leg";

    /**
     * Chord of the blend on either side of the curve where the digit meets the limb, mm: 1 for the fingers and the toes, whose webs leave no
     * room for a wider rail, and 0.5 for the thumb, whose blend folds at 1 mm in the acute web beside the index finger.
     */
    chord: number;
  }

  /**
   * The digits sewn to the body, in the order they are merged: the middle one of each limb first, then its neighbours outward. Each is merged
   * as a capsule: besides its tip it closes in a point `ROOT_MM` behind its first joint, inside the hand or the foot, so it meets the limb's
   * cap in a closed curve wherever it comes out.
   */
  export const DIGITS: readonly IDigit[] = [
    { family: AutoMovieHumanF1FingerMiddle, limb: "arm", chord: 1 },
    { family: AutoMovieHumanF1FingerRing, limb: "arm", chord: 1 },
    { family: AutoMovieHumanF1FingerIndex, limb: "arm", chord: 1 },
    { family: AutoMovieHumanF1FingerPinky, limb: "arm", chord: 1 },
    { family: AutoMovieHumanF1FingerThumb, limb: "arm", chord: 0.5 },
    { family: AutoMovieHumanF1ToeBig, limb: "leg", chord: 1 },
    { family: AutoMovieHumanF1ToeIndex, limb: "leg", chord: 1 },
    { family: AutoMovieHumanF1ToeMiddle, limb: "leg", chord: 1 },
    { family: AutoMovieHumanF1ToeRing, limb: "leg", chord: 1 },
    { family: AutoMovieHumanF1ToeLittle, limb: "leg", chord: 1 },
  ];

  /** The families not sewn: none now. A loose family is emitted as a closed tube of its own, carried by its reach under its neighbour's skin. */
  export const LOOSE: readonly IMember[] = [];

  /** Every authored family of the figure. */
  export const FAMILIES: readonly IMember[] = [
    { family: BODY.trunk, mirrored: false },
    { family: BODY.arm, mirrored: true },
    { family: BODY.leg, mirrored: true },
    { family: BODY.ear, mirrored: true },
    { family: BODY.nose, mirrored: false },
    ...DIGITS.map((digit: IDigit): IMember => ({ family: digit.family, mirrored: true })),
    ...LOOSE,
  ];

  /** How far behind its first joint a sewn digit closes in a point, mm. */
  const ROOT_MM: number = 10;

  /**
   * Station spacing of the layers and derived outlines of a sewn family, mm. Each part adds stations of its own where its section turns fast,
   * so 4 mm is admitted whole with 345,000 triangles; at 2 mm the body held 589,000 and the engine read one toe's middle section as degenerate.
   */
  const LAYER_MM: number = 4;

  /**
   * How far outside the shoulder's section the port loop stands on the trunk's own skin, mm. At 4 mm every column of the band leaves the
   * trunk toward the arm's ring (`FamilyConicArmscye.ts`), over the shoulder by 12 to 24 mm; a wider loop only lengthens the band.
   */
  const ARMSCYE_MARGIN_MM: number = 4;

  /**
   * Where each limb's band lands on it, mm from the limb's first station: the limb keeps its stations beyond. The arm's first station is 2 mm
   * past the armscye's plane and its course is still square to that plane there, so its ring 3 mm on lies beside the plane, inside the loop.
   */
  const RAIL_MM: { arm: number; leg: number; ear: number } = { arm: 3, leg: 12, ear: 2 };

  /** How far outside the auricle's root the ear's port loop stands on the skull, mm. */
  const AURICLE_MARGIN_MM: number = 4;

  /** Columns round each band and rows across it. */
  const BAND: { count: number; rows: number } = { count: 96, rows: 8 };

  /** Columns round each leg's band at the crotch: a thigh's girth of 565 mm at 4 mm apart, as the legs' own rings stand. At 96 the band showed as a ring of facets round each thigh. */
  const THIGH_COLUMNS: number = 144;

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
   * The armscye is the armpit's sagittal plane: the trunk owns the skin medial of it and the arm the skin lateral of it, the shoulder's cap
   * included. The port is the shoulder's section in that plane as the trunk's chart sees it, its height in station and its depth as phases at
   * the plane's side distance, both widened by the margin so the loop stands on the trunk's own skin round the section. The arm's course leaves
   * the trunk square to that plane, so the ring the band lands on lies beside the plane and inside the loop all the way round.
   *
   * @param side +1 for the +Z side, -1 for its twin.
   */
  export function armscye(side: 1 | -1): IAutoMovieConstructionPort.ILoop {
    const J = AutoMovieHumanF1Joints;
    const fore: number = Math.atan2(J.armpit[2], J.armscye.fore);
    const aft: number = Math.atan2(J.armpit[2], J.armscye.aft);
    return {
      centre: [((J.armscye.bottom + J.armscye.top) / 2 - J.axisFloor[1]) / 1000, (side * (fore + aft)) / 2],
      semi: [((J.armscye.top - J.armscye.bottom) / 2 + ARMSCYE_MARGIN_MM) / 1000, (aft - fore) / 2 + ARMSCYE_MARGIN_MM / J.armpit[2]],
      sense: side,
    };
  }

  /**
   * Where the armscye's band meets the arm in a crease, on the port loop's clock: from just behind the armpit's lowest point, at clock pi, round
   * the fold in front of it. There the arm's underside leaves the trunk downward, back over the trunk's own side, and its skin runs against
   * the band's columns: `FamilyConicArmscye.ts` reads 15 of the 96 columns arriving against the arm's direction, all between clocks 2.9 and 4.0.
   * Inside the window the band reaches the arm along its chord, as the skin does in the fold. The loop of each side runs the way its reflection
   * does (`sense`), so one window serves both.
   */
  const ARMPIT_CREASE: { start: number; end: number; transition: number } = { start: Math.PI - 0.25, end: Math.PI + 0.95, transition: 0.3 };

  /**
   * The ear's port on the trunk's chart: an ellipse about the centre of the auricle's root, its semi-axes the root's half height in station and
   * its half depth as a phase at the root's side distance, both widened by the margin so the loop stands on the skull round the root.
   *
   * @param side +1 for the +Z side, -1 for its twin.
   */
  export function auricle(side: 1 | -1): IAutoMovieConstructionPort.ILoop {
    const J = AutoMovieHumanF1Joints;
    return {
      centre: [(J.earBase[1] - J.axisFloor[1]) / 1000, side * Math.atan2(J.earBase[2], J.earBase[0])],
      semi: [(J.earHalf[0] + AURICLE_MARGIN_MM) / 1000, Math.atan((J.earHalf[1] + AURICLE_MARGIN_MM) / J.earBase[2])],
      sense: 1,
    };
  }

  /**
   * The nose's port on the trunk's chart: an ellipse about the centre of the nose's root on the median line in front, its semi-axes the root's
   * half height in station and its half width as a phase at the root's forward distance, both widened by the margin.
   */
  export function nostril(): IAutoMovieConstructionPort.ILoop {
    const J = AutoMovieHumanF1Joints;
    return {
      centre: [(J.noseBase[1] - J.axisFloor[1]) / 1000, 0],
      semi: [(J.noseHalf[0] + AURICLE_MARGIN_MM) / 1000, Math.atan((J.noseHalf[1] + AURICLE_MARGIN_MM) / J.noseBase[0])],
      sense: 1,
    };
  }

  /**
   * Declare the sewn body.
   *
   * @param layer Station spacing of each family's layers and derived outlines, mm.
   */
  export function construction(layer: number = LAYER_MM): IConstruction {
    const sources: Map<string, IAutoMovieViewPart> = new Map();
    const leaf = (family: AutoMovieHumanConicLoft.IFamily): AutoMovieConstructionNode => {
      const from: number = family.knots[0]!;
      const to: number = family.knots.at(-1)!;
      const count: number = Math.ceil((to - from) / layer) + 1;
      sources.set(family.name, AutoMovieHumanConicLoft.part(family, Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1))));
      return { type: "source", name: family.name, source: family.name };
    };
    const twin = (family: AutoMovieHumanConicLoft.IFamily): AutoMovieHumanConicLoft.IFamily => AutoMovieHumanConicLoft.mirror(family, family.name + ".mirror");
    const trunk: string = BODY.trunk.name;

    // A limb with its digits: each digit is merged onto the limb's cap before the limb is attached to the trunk, so the engine traces where a
    // capsule comes out against the limb alone. Merged after the whole body was sewn, every digit was traced against all of it.
    const limb = (which: "arm" | "leg", side: 1 | -1): { node: AutoMovieConstructionNode; face: string } => {
      const family: AutoMovieHumanConicLoft.IFamily = side > 0 ? BODY[which] : twin(BODY[which]);
      let node: AutoMovieConstructionNode = leaf(family);
      for (const digit of DIGITS.filter((d: IDigit): boolean => d.limb === which)) {
        const capsule: AutoMovieHumanConicLoft.IFamily = { ...digit.family, tips: [{ from: digit.family.knots[0]!, tip: -ROOT_MM }, digit.family.tips?.[1] ?? null] };
        const part: AutoMovieHumanConicLoft.IFamily = side > 0 ? capsule : twin(capsule);
        node = {
          type: "join",
          kind: "merge",
          name: "web." + part.name,
          host: node,
          part: leaf(part),
          seed: { type: "search", partFace: part.name, hostFace: family.name, phase: 0, from: 0, to: 0.7 },
          parameter: { type: "phase" },
          partWidth: { type: "chord", value: digit.chord / 1000 },
          hostWidth: { type: "chord", value: digit.chord / 1000 },
          continuity: "G2",
          count: 48,
          rows: 4,
          tolerance: 1e-12,
          grazing: 0.05,
        };
      }
      return { node, face: family.name };
    };

    // The trunk's section chart has +u forward and +v to +Z, so the seam from phase 0 to pi gives the first child the +Z half of the end.
    const legs: { node: AutoMovieConstructionNode; face: string }[] = [limb("leg", 1), limb("leg", -1)];
    let root: AutoMovieConstructionNode = {
      type: "split",
      name: "crotch",
      host: leaf(BODY.trunk),
      hostFace: trunk,
      hostEnd: "bottom",
      seam: [0, Math.PI],
      count: THIGH_COLUMNS,
      rows: BAND.rows,
      children: [
        { band: "band." + legs[0]!.face, part: legs[0]!.node, partFace: legs[0]!.face, partEnd: "bottom", rail: RAIL_MM.leg / 1000 },
        { band: "band." + legs[1]!.face, part: legs[1]!.node, partFace: legs[1]!.face, partEnd: "bottom", rail: RAIL_MM.leg / 1000 },
      ],
    };
    for (const side of [1, -1] as const) {
      const arm: { node: AutoMovieConstructionNode; face: string } = limb("arm", side);
      root = { type: "port", name: "armscye." + arm.face, host: root, hostFace: trunk, loop: armscye(side), band: "band." + arm.face, part: arm.node, partFace: arm.face, partEnd: "bottom", rail: RAIL_MM.arm / 1000, count: BAND.count, rows: BAND.rows, crease: ARMPIT_CREASE };
      const ear: AutoMovieHumanConicLoft.IFamily = side > 0 ? BODY.ear : twin(BODY.ear);
      root = { type: "port", name: "auricle." + ear.name, host: root, hostFace: trunk, loop: auricle(side), band: "band." + ear.name, part: leaf(ear), partFace: ear.name, partEnd: "bottom", rail: RAIL_MM.ear / 1000, count: BAND.count, rows: BAND.rows };
    }
    root = { type: "port", name: "nostril." + BODY.nose.name, host: root, hostFace: trunk, loop: nostril(), band: "band." + BODY.nose.name, part: leaf(BODY.nose), partFace: BODY.nose.name, partEnd: "bottom", rail: RAIL_MM.ear / 1000, count: BAND.count, rows: BAND.rows };
    return { root, sources };
  }

  /**
   * Generate the figure's pieces: the sewn body, then every loose family and its twin.
   *
   * @param step Station spacing of a loose family's layers, mm.
   * @param phases Vertices round every layer of a loose family.
   * @param chord Largest distance the sewn body's triangles may stand off its surfaces, metres. Most of the generation time is this tessellation.
   */
  export function create(step: number = 4, phases: number = 128, chord: number = 0.001): IPiece[] {
    const declared: IConstruction = construction();
    const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "f1.body", root: declared.root }, { chord, sources: declared.sources });
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
