import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** The reach range for operable parts. */
const REACH: string =
  "2010 ADA Standards 308.2.1, operable parts within a forward reach 15 in (380 mm) minimum and 48 in (1220 mm) maximum above the floor (https://www.access-board.gov/ada/chapter/ch03/)";

/** The levers read. */
const LEVER: string =
  "Elesa+Ganter DIN 6337 ball levers, type L: lever length l1 63, 80, 100, 125 and 160 mm from the hub's centre to the DIN 319 ball knob's, the arm rising 20 degrees off the plane square to the bore, with knobs d5 20, 20, 25, 32 and 40 mm, arms d6 8, 9, 11, 15 and 18 mm, hubs d3 16, 20, 25, 32 and 40 mm across and b 12, 14.5, 18.5, 24 and 30 mm along the bore, weighing 32, 53, 100, 216 and 415 g (https://www.elesa-ganter.com/siteassets/PDF/EN/DIN%206337.pdf)";

/** One lever read, metres and kilograms: its length, knob, arm and hub across, hub along the bore, and mass. */
interface ILever {
  length: number;
  knob: number;
  arm: number;
  hub: number;
  bore: number;
  mass: number;
}

/** The five DIN 6337 levers read, the shortest first. */
const LEVERS: readonly ILever[] = [
  [63, 20, 8, 16, 12, 32],
  [80, 20, 9, 20, 14.5, 53],
  [100, 25, 11, 25, 18.5, 100],
  [125, 32, 15, 32, 24, 216],
  [160, 40, 18, 40, 30, 415],
].map(
  ([length, knob, arm, hub, bore, grams]: number[]): ILever => ({
    length: length! * ArchetypeUnits.MILLIMETRE,
    knob: knob! * ArchetypeUnits.MILLIMETRE,
    arm: arm! * ArchetypeUnits.MILLIMETRE,
    hub: hub! * ArchetypeUnits.MILLIMETRE,
    bore: bore! * ArchetypeUnits.MILLIMETRE,
    mass: grams! / 1000,
  }),
);

/** A DIN 6337 lever's arm off the plane square to its bore, degrees: the drawing's 20. */
const RISE: number = 20;

/**
 * A hand control on a panel: a ball lever or a selector dial.
 *
 * The panel is the `XY` plane facing `+Z`, not built, and the control's axis stands out of it at the drawn height above the origin on the floor, within the reach range for operable parts.
 *
 * - A lever's hub turns on a shaft along `+Z`, its arm pointing up at rest and rising off the panel at the drawing's 20 degrees to its ball knob. Its sizes are the maker's five levers', each interpolated at the drawn length between the two read either side. `knob` is the ball, a handle riding `shaft`, the shaft's turn about `+Z`; the shaft states no travel, since no source read gives a lever's throw.
 * - A dial is a selector head, its handle standing proud of the panel; `dial` turns it about `+Z` by the maker's 45 degrees, as far either way.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The control.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where the control stands, how each kind moves, why the lever states no travel, and each contact.
 * @evidence contracts/development/implementation.md#principled-implementation The lever's hub, arm and knob at the maker's sizes, interpolated between its two levers either side of the drawn length, the knob at that length along an arm rising 20 degrees from the hub's centre half the hub out from the panel; the selector head at the maker's diameter, depth proud of the panel, turn and weight; the axis height in the ADA's reach range.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then the kind's parts and contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The panel and the shaft behind it are the machine's, not built; a lever between two read sizes is interpolated, not a sixth catalogue size.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms At most three parts and a five-row table.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createControl(
  params: createControl.IParams,
  seed?: number | string,
): Archetype<createControl.Affordance, createControl.Dimension> {
  const kind: createControl.Kind = ArchetypeDraw.choice(
    "control",
    "kind",
    params.kind,
    createControl.KINDS,
  );
  const d: Partial<Record<createControl.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "control",
      createControl.BANDS[kind],
      seed,
      params,
      createControl.BANDS,
    );
  const builder: ArchetypeBuilder<
    createControl.Affordance,
    createControl.Dimension
  > = new ArchetypeBuilder({
    archetype: "control",
    id: params.id,
    name: kind === "lever" ? "ball lever" : "selector dial",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const y: number = d.height!;
  const black: string = "#1d1d1d";
  if (kind === "dial") {
    const head: number = createControl.SELECTOR.head;
    const proud: number = createControl.SELECTOR.proud;
    builder.rod("head", head / 2, v(0, y, 0), v(0, y, proud), { color: black });
    builder.affordance({
      id: "dial",
      kind: "knob",
      frame: ArchetypeFrame.facing(v(0, y, proud), v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      grip: "precision",
      travel: createControl.SELECTOR.turn,
      parts: ["head"],
    });
    return builder.build(createControl.SELECTOR.mass);
  }
  const lever: ILever = interpolate(d.length!);
  const rise: number = RISE * ArchetypeUnits.DEGREE;
  const hub: ReturnType<typeof v> = v(0, y, lever.bore / 2);
  const knob: ReturnType<typeof v> = v(
    0,
    y + lever.length * Math.cos(rise),
    lever.bore / 2 + lever.length * Math.sin(rise),
  );
  const steel: string = "#2b2b2e";
  builder.rod("hub", lever.hub / 2, v(0, y, 0), v(0, y, lever.bore), {
    color: steel,
  });
  builder.rod("arm", lever.arm / 2, hub, knob, { color: steel });
  builder.ball("ball", lever.knob / 2, knob, { color: black });
  builder.affordance({
    id: "shaft",
    kind: "knob",
    frame: ArchetypeFrame.facing(v(0, y, 0), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    parts: ["hub", "arm", "ball"],
  });
  builder.affordance({
    id: "knob",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(knob, v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    grip: "power",
    aperture: lever.knob,
    rides: "shaft",
  });
  return builder.build(lever.mass);
}

/**
 * The DIN 6337 lever at a length inside the read range: each size interpolated linearly between the two levers read either side.
 *
 * @param length The lever's length, metres.
 * @returns The lever's sizes and mass.
 */
function interpolate(length: number): ILever {
  const above: number = Math.max(
    1,
    LEVERS.findIndex((l: ILever): boolean => l.length >= length),
  );
  const a: ILever = LEVERS[above - 1]!;
  const b: ILever = LEVERS[above]!;
  const t: number = (length - a.length) / (b.length - a.length);
  const at = (key: keyof ILever): number => a[key] + (b[key] - a[key]) * t;
  return {
    length,
    knob: at("knob"),
    arm: at("arm"),
    hub: at("hub"),
    bore: at("bore"),
    mass: at("mass"),
  };
}

/**
 * Companion types, constants and bands of {@link createControl}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, constant and dimension states what it is; each band and constant its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions; the lever drawn by its catalogue length, every other size following from it, and the selector's read single figures as constants.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The knob a hand takes, the shaft it turns and the dial it twists (#3468 N14).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A lever's throw no sheet gives is left out, not invented.
 */
export namespace createControl {
  /** The kinds of control. */
  export type Kind = "lever" | "dial";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["lever", "dial"];

  /** The selector head read, metres, degrees and kilograms: Schneider Electric Harmony XB4 ZB4BD3, head 28.5 mm across standing 27 mm proud of the panel, "3 positions +/- 45°", product weight 0.04 kg (https://assets.cef.co.uk/downloads/pdg/tele_zb4bd3_datasheet/tele_zb4bd3_datasheet.pdf). */
  export const SELECTOR: Readonly<{
    head: number;
    proud: number;
    turn: number;
    mass: number;
  }> = {
    head: 28.5 * ArchetypeUnits.MILLIMETRE,
    proud: 27 * ArchetypeUnits.MILLIMETRE,
    turn: 45,
    mass: 0.04,
  };

  /**
   * The affordance ids:
   *
   * - `knob`: a lever's ball, a handle riding `shaft`.
   * - `shaft`: a lever's turn about `+Z`, carrying its hub, arm and ball; it states no travel.
   * - `dial`: a dial's head, turned about `+Z`.
   */
  export type Affordance = "knob" | "shaft" | "dial";

  /**
   * The free dimensions, metres:
   *
   * - `height`: the control's axis above the floor.
   * - `length`: a lever's length from its hub's centre to its knob's.
   */
  export type Dimension = "height" | "length";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which control. */
    kind: Kind;

    /** The model's id, unique in a scene; `control` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    lever: {
      height: ArchetypeBand.metres(
        15 * ArchetypeUnits.INCH,
        48 * ArchetypeUnits.INCH,
        REACH,
      ),
      length: ArchetypeBand.metres(
        63 * ArchetypeUnits.MILLIMETRE,
        160 * ArchetypeUnits.MILLIMETRE,
        LEVER,
      ),
    },
    dial: {
      height: ArchetypeBand.metres(
        15 * ArchetypeUnits.INCH,
        48 * ArchetypeUnits.INCH,
        REACH,
      ),
    },
  };
}
