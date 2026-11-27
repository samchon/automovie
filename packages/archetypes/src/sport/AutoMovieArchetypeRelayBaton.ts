import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import * as AutoMovieArchetypeRelayBatonData from "./internal/AutoMovieArchetypeRelayBatonData";

/** Constructs the relay baton archetype from its recipe. */
export namespace AutoMovieArchetypeRelayBaton {
/**
 * A relay baton: a smooth hollow tube of round section.
 *
 * It stands on its back end at the origin along `+Y`. `grip` is the tube a hand
 * closes on, along its whole length; `front` and `back` are its two ends, each
 * `+Y` out of the tube: the incoming runner pushes one end into the outgoing
 * runner's palm (`relayPass`'s `end`).
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The baton.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeRelayBaton.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeRelayBaton.Affordance, AutoMovieArchetypeRelayBaton.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeRelayBaton.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeRelayBaton.Dimension>(
      "relayBaton",
      AutoMovieArchetypeRelayBaton.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeRelayBaton.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeRelayBaton.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeRelayBaton.Affordance,
    AutoMovieArchetypeRelayBaton.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "aluminium",
    id: params.id,
    name: "relay baton",
    draw,
  });
  builder.rod(
    "tube",
    d.diameter / 2,
    Vector3.create(0, 0, 0),
    Vector3.create(0, d.length, 0),
    { color: "#d4a017" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, d.length / 2, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.diameter,
    length: d.length,
  });
  builder.affordance({
    id: "front",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, d.length, 0),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "back",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, -1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

  /**
   * The affordance ids:
   *
   * - `grip`: the tube, taken from `-Z` along its whole length.
   * - `front`: the top end, `+Y` out of it.
   * - `back`: the bottom end at the origin, `+Y` down out of it.
   */
  export type Affordance = "grip" | "front" | "back";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: end to end.
   * - `diameter`: across the tube.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "diameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `relayBaton` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(
      0.28,
      0.3,
      `${AutoMovieArchetypeRelayBatonData.RULE}: 0.28 to 0.30 m long`,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      0.038,
      0.042,
      `${AutoMovieArchetypeRelayBatonData.RULE}: an outside diameter of 40 mm +/- 2 mm`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.05,
      0.07,
      `${AutoMovieArchetypeRelayBatonData.RULE}: not less than 50 g; the rule sets no upper end, and no maker's weight was read`,
      true,
    ),
  };
}
