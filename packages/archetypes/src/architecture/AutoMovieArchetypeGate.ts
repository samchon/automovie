import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeGateData } from "./internal/AutoMovieArchetypeGateData";

/**
 * Constructs a static turnstile or speed-gate proxy with an alignment aperture.
 */
export namespace AutoMovieArchetypeGate {
/**
 * Build a turnstile with one cabinet and an arm, or a speed gate with
 * opposed cabinets and two wings.
 *
 * The floor-level `passage` records the nominal lane span. The `top`
 * surface occupies the `-X` cabinet at its measured height.
 *
 * @param params Required gate kind, optional lane selection and scene ID,
 *   and applicable finite dimensions. The default ID is `gate`.
 * @param seed Numeric seed for omitted settings. Omission uses lane `457`
 *   for a turnstile or `615` for a speed gate and the band midpoints.
 * @returns The static barrier, nominal aperture and cabinet top surface.
 * @throws {AutoMovieArchetypeRefusal} If a kind, lane or fixed value is inadmissible.
 */
export function create(
  params: AutoMovieArchetypeGate.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeGate.Affordance, AutoMovieArchetypeGate.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeGate.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeGate.Dimension>(
      "gate",
      AutoMovieArchetypeGate.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeGate.Kind = ArchetypeDraw.choice(
    "gate",
    "kind",
    params.kind,
    AutoMovieArchetypeGate.KINDS,
  );
  const model: {
    name: AutoMovieArchetypeGate.Passage | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeGate.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeGate.Passage>(
    "lane",
    params.lane,
    AutoMovieArchetypeGate.PASSAGES[kind],
  );
  const d: Partial<Record<AutoMovieArchetypeGate.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeGate.BANDS[kind], AutoMovieArchetypeGate.BANDS),
    ...model.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeGate.Affordance,
    AutoMovieArchetypeGate.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `${kind === "turnstile" ? "turnstile" : "speed gate"} ${model.name} mm`,
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
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
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
    width: lane,
    height,
  });
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(-x, height, 0)),
    extent: null,
    width,
    depth: length,
  });
  return builder.build(d.mass!);
}

  /** Selects a one-cabinet `turnstile` or two-cabinet `speedGate`. */
  export type Kind = "turnstile" | "speedGate";

  /** The admitted gate kinds in turnstile then speed-gate order. */
  export const KINDS: readonly Kind[] = ["turnstile", "speedGate"];

  /**
   * Width labels in millimetres. Turnstiles use `457`, `508` or `559` and speed gates use `615` or `915`.
   */
  export type Passage = "457" | "508" | "559" | "615" | "915";

  /**
   * Catalogue nominal lane spans recorded in metres by kind and width label.
   */
  export const PASSAGES: Readonly<
    Record<
      Kind,
      Readonly<
        Partial<Record<Passage, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    turnstile: {
      "457": { passage: 0.457 },
      "508": { passage: 0.508 },
      "559": { passage: 0.559 },
    },
    speedGate: { "615": { passage: 0.615 }, "915": { passage: 0.915 } },
  };

  /**
   * Floor-level nominal `passage` aperture and `top` of the cabinet at `-X`.
   */
  export type Affordance = "passage" | "top";

  /**
   * Lane span, cabinet width, height and length, barrier height and
   * turnstile arm reach and diameter in metres. Mass is in kilograms.
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

  /** Metres for physical gate dimensions and kilograms for mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    passage: "m",
    width: "m",
    height: "m",
    length: "m",
    barrier: "m",
    reach: "m",
    arm: "m",
    mass: "kg",
  };

  /**
   * Required gate kind, optional lane and scene ID, and finite dimensions applicable to that kind.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "passage">, number>
  > {
    /**
     * Selects the cabinet and barrier arrangement and its measurement bands.
     */
    kind: Kind;

    /** Selects a nominal lane width from the chosen kind's catalogue. */
    lane?: Passage;

    /** Scene object ID, defaulting to `gate`. */
    id?: string;
  }

  /**
   * Free dimensions by gate kind. The lane width comes from the catalogue selection.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    turnstile: {
      width: AutoMovieArchetypeBand.metres(0.178, 0.178, AutoMovieArchetypeGateData.TRILOCK),
      height: AutoMovieArchetypeBand.metres(0.965, 0.965, AutoMovieArchetypeGateData.TRILOCK),
      length: AutoMovieArchetypeBand.metres(0.686, 0.686, AutoMovieArchetypeGateData.TRILOCK),
      barrier: AutoMovieArchetypeBand.metres(0.838, 0.838, AutoMovieArchetypeGateData.TRILOCK),
      reach: AutoMovieArchetypeBand.metres(0.416, 0.416, AutoMovieArchetypeGateData.TRILOCK),
      arm: AutoMovieArchetypeBand.metres(0.032, 0.032, AutoMovieArchetypeGateData.TRILOCK),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        60,
        100,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    speedGate: {
      width: AutoMovieArchetypeBand.metres(0.106, 0.106, AutoMovieArchetypeGateData.SPEEDLANE),
      height: AutoMovieArchetypeBand.metres(1.035, 1.035, AutoMovieArchetypeGateData.SPEEDLANE),
      length: AutoMovieArchetypeBand.metres(1.776, 1.776, AutoMovieArchetypeGateData.SPEEDLANE),
      barrier: AutoMovieArchetypeBand.metres(0.94, 0.94, AutoMovieArchetypeGateData.SPEEDLANE),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        150,
        250,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
  };
}

/*
 * A speed gate wing's lower edge above the floor, metres: the Speedlane Swing
 * elevation's 200 mm.
 */
const WING_FOOT: number = 0.2;

/*
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `wing`, a swing gate's wing thickness.
 */
const ESTIMATES: Readonly<{ wing: number }> = { wing: 0.02 };
