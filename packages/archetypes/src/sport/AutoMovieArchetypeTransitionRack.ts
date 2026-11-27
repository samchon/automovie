import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** No rack maker's page was read. */
const STAGED: string =
  "a triathlon transition rack bay: bar height and bay length are provisional staging estimates, no maker's page was read";

/** Frame colour. */
const STEEL: string = "#9aa1a6";

/** Constructs the transition rack archetype from its recipe. */
export namespace AutoMovieArchetypeTransitionRack {
/**
 * One bay of a triathlon transition rack: a horizontal bar on two A-frame ends.
 * Its origin is on the ground at the middle of the bay, the bar runs along X
 * and the bicycles stand along +Z and -Z of it. A bicycle racks by its saddle
 * nose on the bar's top (`bar`), the arrangement World Triathlon allows where
 * the race racks by the saddle. The bar's height is authored so the saddle
 * rests on it with both wheels on the ground.
 *
 * @param params Scene identity and dimensions within their bands.
 * @param seed Draws free dimensions within their bands.
 * @returns The bay with its bar-top surface.
 */
export function create(
  params: AutoMovieArchetypeTransitionRack.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeTransitionRack.Affordance,
  AutoMovieArchetypeTransitionRack.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeTransitionRack.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "transitionRack",
      AutoMovieArchetypeTransitionRack.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeTransitionRack.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeTransitionRack.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeTransitionRack.Affordance,
    AutoMovieArchetypeTransitionRack.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "transition rack",
    material: "steel",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const radius: number = AutoMovieArchetypeTransitionRack.BAR / 2;
  const axis: number = d.height - radius;
  builder.rod(
    "bar",
    radius,
    v(-d.length / 2, axis, 0),
    v(d.length / 2, axis, 0),
    { color: STEEL },
  );
  for (const [end, x] of [
    ["left", -d.length / 2],
    ["right", d.length / 2],
  ] as const)
    for (const [leg, z] of [
      ["front", 0.4],
      ["back", -0.4],
    ] as const)
      builder.rod(`${end}-${leg}`, radius, v(x, 0, z), v(x, axis, 0), {
        color: STEEL,
      });
  builder.affordance({
    id: "bar",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.height, 0)),
    extent: null,
    width: d.length,
    depth: AutoMovieArchetypeTransitionRack.BAR,
  });
  return builder.build(d.mass);
}
}

/** Dimensions and the bar contact of {@link createTransitionRack}. */
export namespace AutoMovieArchetypeTransitionRack {
  /** The bar's top, where a saddle nose rests. */
  export type Affordance = "bar";

  /** The bay's length, the bar top's height and the frame's mass. */
  export type Dimension = "length" | "height" | "mass";

  /** The bar's diameter, metres: an estimate. */
  export const BAR: number = 0.05;

  /** Scene identity and dimensions fixed within their bands. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }

  /** Units of each dimension. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    height: "m",
    mass: "kg",
  };

  /** Staged bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(1.5, 3, STAGED, true),
    height: AutoMovieArchetypeBand.metres(0.8, 1.3, STAGED, true),
    mass: AutoMovieArchetypeBand.of("kg", 15, 30, STAGED, true),
  };
}
