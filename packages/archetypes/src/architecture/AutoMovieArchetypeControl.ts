import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { ADA_RANGES } from "./constants/ADA_RANGES";

/** Creates a deterministic control fixture and exposes its construction parameters. */
export namespace AutoMovieArchetypeControl {
  /**
   * A hand control on a panel: a ball lever or a selector dial.
   *
   * The panel is the `XY` plane facing `+Z`, not built, and the control's axis
   * stands out of it at the drawn height above the origin on the floor, within
   * the reach range for operable parts.
   *
   * - A lever's hub turns on a shaft along `+Z`, its arm pointing up at rest and
   *   rising off the panel at the drawing's 20 degrees to its ball knob. It is
   *   one of the maker's five levers read, whole: the lever given, or one drawn
   *   from the seed. `knob` is the ball, a handle riding `shaft`, the shaft's
   *   turn about `+Z`; the shaft states no travel, since no source read gives a
   *   lever's throw.
   * - A dial is a selector head, its handle standing proud of the panel; `dial`
   *   turns it about `+Z` by the maker's 45 degrees, and as far the other way as
   *   its `reverse`.
   *
   * @param params The kind, a lever's model and any dimension the author fixes.
   * @param seed The seed that draws a lever's model when it is not given and
   *   every dimension left free inside its band; absent, the first lever and the
   *   middle of each band.
   * @returns The control.
   * @throws {AutoMovieArchetypeRefusal} For a lever the sheet does not list, a
   *   lever named for a dial, or a fixed dimension outside its band.
   */
  export function create(
    params: AutoMovieArchetypeControl.IParams,
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeControl.Affordance,
    AutoMovieArchetypeControl.Dimension
  > {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeControl.Dimension> =
      new AutoMovieArchetypeDrawSession<AutoMovieArchetypeControl.Dimension>(
        "control",
        AutoMovieArchetypeControl.UNITS,
        seed,
        params,
      );
    const kind: AutoMovieArchetypeControl.Kind = ArchetypeDraw.choice(
      "control",
      "kind",
      params.kind,
      AutoMovieArchetypeControl.KINDS,
    );
    if (kind === "dial" && params.lever !== undefined)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "control",
        axis: "lever",
        value: params.lever,
        feasible: null,
        reason: "a dial has no lever",
        fix: "leave lever out for a dial",
      });
    const d: Record<"height", number> = draw.dimensions(
      AutoMovieArchetypeControl.BANDS,
    );
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeControl.Affordance,
      AutoMovieArchetypeControl.Dimension
    > = new AutoMovieArchetypeBuilder({
      material: "composite",
      id: params.id,
      name: kind === "lever" ? "ball lever" : "selector dial",
      draw,
    });
    const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
    const y: number = d.height;
    const black: string = "#1d1d1d";
    if (kind === "dial") {
      const head: number = AutoMovieArchetypeControl.SELECTOR.head;
      const proud: number = AutoMovieArchetypeControl.SELECTOR.proud;
      builder.rod("head", head / 2, v(0, y, 0), v(0, y, proud), {
        color: black,
      });
      builder.affordance({
        id: "dial",
        kind: "knob",
        frame: AutoMovieArchetypeFrame.facing(
          v(0, y, proud),
          v(0, 0, 1),
          v(1, 0, 0),
        ),
        extent: null,
        grip: "precision",
        travel: AutoMovieArchetypeControl.SELECTOR.turn,
        reverse: AutoMovieArchetypeControl.SELECTOR.turn,
        parts: ["head"],
      });
      return builder.build(AutoMovieArchetypeControl.SELECTOR.mass);
    }
    const model: {
      name: AutoMovieArchetypeControl.Lever | undefined;
      figures: Readonly<
        Partial<Record<AutoMovieArchetypeControl.Dimension, number>>
      >;
    } = draw.model<AutoMovieArchetypeControl.Lever>(
      "lever",
      params.lever,
      AutoMovieArchetypeControl.LEVERS,
    );
    const lever: Readonly<
      Record<AutoMovieArchetypeControl.LeverDimension, number>
    > = {
      length: model.figures.length!,
      knob: model.figures.knob!,
      arm: model.figures.arm!,
      hub: model.figures.hub!,
      bore: model.figures.bore!,
      mass: model.figures.mass!,
    };
    const rise: number = RISE * AutoMovieArchetypeUnits.DEGREE;
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
      frame: AutoMovieArchetypeFrame.facing(v(0, y, 0), v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      parts: ["hub", "arm", "ball"],
    });
    builder.affordance({
      id: "knob",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(knob, v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      grip: "power",
      aperture: lever.knob,
      rides: "shaft",
    });
    return builder.build(lever.mass);
  }

  /** The kinds of control. */
  export type Kind = "lever" | "dial";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["lever", "dial"];

  /** The DIN 6337 ball levers read, by their length l1 in millimetres. */
  export type Lever = "63" | "80" | "100" | "125" | "160";

  /**
   * A lever's figures, its model's, metres and kilograms: `length` from the
   * hub's centre to the knob's, `knob`, `arm` and `hub` across, `bore` the hub
   * along the bore, and `mass`.
   */
  export type LeverDimension =
    | "length"
    | "knob"
    | "arm"
    | "hub"
    | "bore"
    | "mass";

  /**
   * Each lever's figures, the default first, by its length l1 in millimetres:
   * Elesa+Ganter DIN 6337 ball levers, type L, l1 63, 80, 100, 125 and 160 mm
   * with DIN 319 ball knobs d5 20, 20, 25, 32 and 40 mm, arms d6 8, 9, 11, 15
   * and 18 mm, hubs d3 16, 20, 25, 32 and 40 mm across and b 12, 14.5, 18.5, 24
   * and 30 mm along the bore, weighing 32, 53, 100, 216 and 415 g
   * (https://www.elesa-ganter.com/siteassets/PDF/EN/DIN%206337.pdf).
   */
  export const LEVERS: Readonly<
    Record<Lever, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "63": row(63, 20, 8, 16, 12, 32),
    "80": row(80, 20, 9, 20, 14.5, 53),
    "100": row(100, 25, 11, 25, 18.5, 100),
    "125": row(125, 32, 15, 32, 24, 216),
    "160": row(160, 40, 18, 40, 30, 415),
  };

  /**
   * The selector head read, metres, degrees and kilograms: Schneider Electric
   * Harmony XB4 ZB4BD3, head 28.5 mm across standing 27 mm proud of the panel,
   * "3 positions +/- 45°", product weight 0.04 kg
   * (https://assets.cef.co.uk/downloads/pdg/tele_zb4bd3_datasheet/tele_zb4bd3_datasheet.pdf).
   */
  export const SELECTOR: Readonly<{
    head: number;
    proud: number;
    turn: number;
    mass: number;
  }> = {
    head: 28.5 * AutoMovieArchetypeUnits.MILLIMETRE,
    proud: 27 * AutoMovieArchetypeUnits.MILLIMETRE,
    turn: 45,
    mass: 0.04,
  };

  /**
   * The affordance ids:
   *
   * - `knob`: a lever's ball, a handle riding `shaft`.
   * - `shaft`: a lever's turn about `+Z`, carrying its hub, arm and ball; it
   *   states no travel.
   * - `dial`: a dial's head, turned about `+Z`.
   */
  export type Affordance = "knob" | "shaft" | "dial";

  /**
   * The dimensions: `height`, the control's axis above the floor, metres, free;
   * and a lever's figures, its model's.
   */
  export type Dimension = "height" | LeverDimension;

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    length: "m",
    knob: "m",
    arm: "m",
    hub: "m",
    bore: "m",
    mass: "kg",
  };

  /** The parameters: the kind, and the height fixed to a value inside its band. */
  export interface IParams extends Partial<Record<"height", number>> {
    /** Which control. */
    kind: Kind;

    /** A lever's model; drawn from the seed when absent. A dial has none. */
    lever?: Lever;

    /** The model's id, unique in a scene; `control` when absent. */
    id?: string;
  }

  /** The band of the free dimension. */
  export const BANDS: Readonly<Record<"height", IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(
      ADA_RANGES.reach.low,
      ADA_RANGES.reach.high,
      ADA_RANGES.reach.source,
    ),
  };
}

/*
 * A DIN 6337 lever's arm off the plane square to its bore, degrees: the
 * drawing's 20.
 */
const RISE: number = 20;

/*
 * One DIN 6337 row in metres and kilograms, from the sheet's millimetres and
 * grams.
 * Parameter length: The length l1, millimetres.
 * Parameter knob: The knob d5, millimetres.
 * Parameter arm: The arm d6, millimetres.
 * Parameter hub: The hub d3, millimetres.
 * Parameter bore: The hub's length b along the bore, millimetres.
 * Parameter grams: The mass, grams.
 * Returns: The lever's figures.
 */
function row(
  length: number,
  knob: number,
  arm: number,
  hub: number,
  bore: number,
  grams: number,
): Readonly<Record<AutoMovieArchetypeControl.LeverDimension, number>> {
  const mm: number = AutoMovieArchetypeUnits.MILLIMETRE;
  return {
    length: length * mm,
    knob: knob * mm,
    arm: arm * mm,
    hub: hub * mm,
    bore: bore * mm,
    mass: grams / 1000,
  };
}
