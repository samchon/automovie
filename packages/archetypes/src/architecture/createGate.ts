import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The tripod turnstile read. */
const TRILOCK: string =
  "Boon Edam Trilock 60 product data sheet: cabinet 178 mm wide, 965 mm high, 686 mm long; passage 457, 508 or 559 mm; barrier height 838 mm; arm reach 416 mm and 32 mm across on the drawing (https://websaweprd.blob.core.windows.net/cms-assets-us/2021-02/BEI_PDS_Trilock%2060.pdf)";

/** The swing speed gate read. */
const SPEEDLANE: string =
  "Boon Edam Lifeline Speedlane Swing brochure: cabinet 106 mm wide, 1035 mm high, 1776 mm long; passage 615 mm, wide 915 mm; wing height 940 mm (https://www.barbourproductsearch.info/BEL_Lifeline%20Speedlane%20Swing_A4%20Brochure_2023-file133773.pdf)";

/** A speed gate wing's lower edge above the floor, metres: the Speedlane Swing elevation's 200 mm. */
const WING_FOOT: number = 0.2;

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `wing`, a swing gate's wing thickness. */
const ESTIMATES: Readonly<{ wing: number }> = { wing: 0.02 };

/**
 * A pedestrian gate a person passes through: a tripod turnstile or a swing speed gate.
 *
 * The lane runs along `Z` through the origin, `passage` wide between its cabinets, and is walked toward `-Z`. A turnstile has one cabinet on the lane's `-X` side with its barrier arm reaching across the lane at the maker's barrier height; a speed gate has a cabinet on each side, each with a wing closing half the lane at the maker's wing height. `passage` is the lane's opening, an aperture as high as the cabinets; `top` is the `-X` cabinet's top, leaned on or vaulted.
 *
 * The arm and the wings are drawn at their cabinet's middle and declared as no contact, since no source read places them along the cabinet; turning an arm or swinging a wing has no motion law yet (#3468 N7), so the gate is built for static use.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The gate.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the lane's frame, each kind's parts, its contacts, and why the arm and wings are no contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The makers' cabinet sizes, passage widths and barrier and wing heights; the arm's reach and section from the Trilock drawing.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the cabinets, the barrier, then the two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts One arm stands for the tripod's three; a wing is a slab from the elevation's 200 mm up to its height; their place along the cabinet and the wing's thickness are construction estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms At most four parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createGate(
  params: createGate.IParams,
  seed?: number | string,
): Archetype<createGate.Affordance, createGate.Dimension> {
  const kind: createGate.Kind = ArchetypeDraw.choice(
    "gate",
    "kind",
    params.kind,
    createGate.KINDS,
  );
  const d: Partial<Record<createGate.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "gate",
      createGate.BANDS[kind],
      seed,
      params,
      createGate.BANDS,
    );
  const builder: ArchetypeBuilder<createGate.Affordance, createGate.Dimension> =
    new ArchetypeBuilder({
      archetype: "gate",
      id: params.id,
      name: kind === "turnstile" ? "turnstile" : "speed gate",
      dimensions: d,
    });
  const v: typeof Vector3.create = Vector3.create;
  const lane: number = d.passage!;
  const width: number = d.width!;
  const height: number = d.height!;
  const length: number = d.length!;
  const x: number = lane / 2 + width / 2;
  const steel: string = "#b9bec4";
  const sides: readonly (readonly [string, number])[] =
    kind === "turnstile"
      ? [["cabinet-right", -1]]
      : [
          ["cabinet-left", 1],
          ["cabinet-right", -1],
        ];
  for (const [id, sign] of sides)
    builder.box(id, v(width, height, length), v(sign * x, height / 2, 0), {
      color: steel,
    });
  const barrier: number = d.barrier!;
  if (kind === "turnstile")
    builder.rod(
      "arm",
      d.arm! / 2,
      v(-lane / 2, barrier, 0),
      v(-lane / 2 + d.reach!, barrier, 0),
      { color: "#55595f" },
    );
  else
    for (const [id, sign] of [
      ["wing-left", 1],
      ["wing-right", -1],
    ] as const)
      builder.box(
        id,
        v(lane / 2, barrier - WING_FOOT, ESTIMATES.wing),
        v((sign * lane) / 4, (barrier + WING_FOOT) / 2, 0),
        { color: "#d6e6ef" },
      );
  builder.affordance({
    id: "passage",
    kind: "aperture",
    frame: ArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
    width: lane,
    height,
  });
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(-x, height, 0)),
    extent: null,
    width,
    depth: length,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createGate}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The lane a person passes and the cabinet top a hand meets (#3468 N7).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A barrier no source places along its cabinet is drawn but not declared.
 */
export namespace createGate {
  /** The kinds of gate. */
  export type Kind = "turnstile" | "speedGate";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["turnstile", "speedGate"];

  /**
   * The affordance ids:
   *
   * - `passage`: the lane's opening between the cabinets, an aperture.
   * - `top`: the `-X` cabinet's top.
   */
  export type Affordance = "passage" | "top";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `passage`: the lane's clear width.
   * - `width`, `height`, `length`: a cabinet across the lane, high and along it.
   * - `barrier`: a turnstile arm's height or a wing's height.
   * - `reach`, `arm`: a turnstile arm's reach into the lane and its diameter.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "passage"
    | "width"
    | "height"
    | "length"
    | "barrier"
    | "reach"
    | "arm"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which gate. */
    kind: Kind;

    /** The model's id, unique in a scene; `gate` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    turnstile: {
      passage: ArchetypeBand.metres(0.457, 0.559, TRILOCK),
      width: ArchetypeBand.metres(0.178, 0.178, TRILOCK),
      height: ArchetypeBand.metres(0.965, 0.965, TRILOCK),
      length: ArchetypeBand.metres(0.686, 0.686, TRILOCK),
      barrier: ArchetypeBand.metres(0.838, 0.838, TRILOCK),
      reach: ArchetypeBand.metres(0.416, 0.416, TRILOCK),
      arm: ArchetypeBand.metres(0.032, 0.032, TRILOCK),
      mass: ArchetypeBand.of("kg", 60, 100, ArchetypeBand.TYPICAL_MASS, true),
    },
    speedGate: {
      passage: ArchetypeBand.metres(0.615, 0.915, SPEEDLANE),
      width: ArchetypeBand.metres(0.106, 0.106, SPEEDLANE),
      height: ArchetypeBand.metres(1.035, 1.035, SPEEDLANE),
      length: ArchetypeBand.metres(1.776, 1.776, SPEEDLANE),
      barrier: ArchetypeBand.metres(0.94, 0.94, SPEEDLANE),
      mass: ArchetypeBand.of("kg", 150, 250, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
