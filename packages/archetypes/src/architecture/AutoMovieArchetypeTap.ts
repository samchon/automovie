import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeTapData } from "./internal/AutoMovieArchetypeTapData";

/** Constructs the tap archetype from its recipe. */
export namespace AutoMovieArchetypeTap {
/**
 * A single-lever mixer tap of a sink or a basin.
 *
 * It stands on the counter at the origin, its body rising along `+Y` and its
 * spout reaching out along `+Z` over the basin, toward whoever uses it. `lever`
 * is the lever's hub on the body's top, a knob turned about its upright axis,
 * `+Y` up toward the hand that comes from above; `spout` the spout's mouth,
 * facing down, where the water comes out and a hand or a glass is held under.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The tap.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeTap.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeTap.Affordance, AutoMovieArchetypeTap.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeTap.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeTap.Dimension>(
      "tap",
      AutoMovieArchetypeTap.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeTap.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeTap.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeTap.Affordance,
    AutoMovieArchetypeTap.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "mixer tap",
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const r: number = d.diameter / 2;
  const spout: number = AutoMovieArchetypeTap.SPOUT;
  const at: number = d.outlet + spout / 2;
  builder.rod("body", r, v(0, 0, 0), v(0, d.height, 0), { color: "#c9ccd1" });
  builder.rod("spout", spout / 2, v(0, at, 0), v(0, at, d.reach), {
    color: "#c9ccd1",
  });
  builder.box("lever", v(0.015, 0.012, 0.09), v(0, d.height + 0.006, -0.02), {
    color: "#b9bcc0",
  });
  builder.affordance({
    id: "lever",
    kind: "knob",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.height + 0.012, 0),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "precision",
    aperture: 0.015,
    travel: AutoMovieArchetypeTap.TURN,
    parts: ["lever"],
  });
  builder.affordance({
    id: "spout",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, at - spout / 2, d.reach - spout / 2),
      v(0, -1, 0),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

  /** The spout's diameter, metres: an estimate. */
  export const SPOUT: number = 0.02;

  /** The lever's turn from cold to hot, degrees: an estimate. */
  export const TURN: number = 90;

  /**
   * The affordance ids:
   *
   * - `lever`: the lever's hub, a knob turned about `+Y`.
   * - `spout`: the spout's mouth, facing down.
   */
  export type Affordance = "lever" | "spout";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the body's top above the counter.
   * - `diameter`: the body's.
   * - `reach`: the spout's mouth out from the body's axis.
   * - `outlet`: the spout's mouth above the counter.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "reach" | "outlet" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    diameter: "m",
    reach: "m",
    outlet: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `tap` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(0.146, 0.169, AutoMovieArchetypeTapData.GROHE),
    diameter: AutoMovieArchetypeBand.metres(
      0.035,
      0.05,
      `the body's diameter: ${AutoMovieArchetypeTapData.UNREAD}`,
      true,
    ),
    reach: AutoMovieArchetypeBand.metres(0.106, 0.109, AutoMovieArchetypeTapData.GROHE),
    outlet: AutoMovieArchetypeBand.metres(0.056, 0.095, AutoMovieArchetypeTapData.GROHE),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.8,
      2,
      `the weight: ${AutoMovieArchetypeTapData.UNREAD}`,
      true,
    ),
  };
}
