import { Vector3 } from "@automovie/engine";

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
import * as AutoMovieArchetypeThrowingCircleData from "./internal/AutoMovieArchetypeThrowingCircleData";

/** Constructs the throwing circle archetype from its recipe. */
export namespace AutoMovieArchetypeThrowingCircle {
/** The events. */
  export type Event = "shot" | "discus" | "hammer" | "javelin";

  /**
   * The affordance ids: `circle`, a circle's top; `arc`, the javelin arc's
   * middle.
   */
  export type Affordance = "circle" | "arc";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `diameter`: a circle's inside diameter.
   * - `width`: the javelin runway's width.
   * - `radius`: the javelin arc's radius.
   * - `mass`: kilograms, of the marking (an estimate).
   */
  export type Dimension = "diameter" | "width" | "radius" | "mass";

  /** The parameters: the event and any figure fixed inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The event the place serves. */
    event: Event;

    /** The model's id, unique in a scene; `throwingCircle` when absent. */
    id?: string;
  }

  /**
 * A field event's throwing place: a throwing circle for the shot, the discus or
 * the hammer, or the end of the javelin's runway with its arc.
 *
 * The throw goes along `+Z`. A circle stands on the floor centred on the
 * origin; `circle` is its top, `+Y` up, its width and depth the inside
 * diameter. A javelin runway ends at the origin, where the middle of its arc
 * crosses the runway's axis; `arc` is that point on the floor, `+Y` up, its
 * width the runway's and its depth the arc's radius, whose centre lies that far
 * back along `-Z`.
 *
 * @param params The event and any figure the author fixes.
 * @param seed The seed that draws each figure left free inside its band;
 *   absent, the middle of each band.
 * @returns The throwing place.
 * @throws {AutoMovieArchetypeRefusal} For an unknown event or a fixed figure
 *   outside its band.
 */
export function create(
  params: AutoMovieArchetypeThrowingCircle.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeThrowingCircle.Affordance,
  AutoMovieArchetypeThrowingCircle.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeThrowingCircle.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeThrowingCircle.Dimension>(
      "throwingCircle",
      AutoMovieArchetypeThrowingCircle.UNITS,
      seed,
      params,
    );
  const event: AutoMovieArchetypeThrowingCircle.Event = ArchetypeDraw.choice(
    "throwingCircle",
    "event",
    params.event,
    AutoMovieArchetypeThrowingCircle.EVENTS,
  );
  const d: Partial<Record<AutoMovieArchetypeThrowingCircle.Dimension, number>> =
    draw.dimensions(
      AutoMovieArchetypeThrowingCircle.BANDS[event],
      AutoMovieArchetypeThrowingCircle.BANDS,
    );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeThrowingCircle.Affordance,
    AutoMovieArchetypeThrowingCircle.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `${event} throwing ${event === "javelin" ? "runway" : "circle"}`,
    draw,
  });
  if (event === "javelin") {
    const width: number = d.width!;
    const radius: number = d.radius!;
    builder.box(
      "runway",
      Vector3.create(width, AutoMovieArchetypeThrowingCircle.LINE, 4 * width),
      Vector3.create(0, AutoMovieArchetypeThrowingCircle.LINE / 2, -2 * width),
      { color: "#b5553a" },
    );
    builder.affordance({
      id: "arc",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, 0)),
      extent: null,
      width,
      depth: radius,
    });
    return builder.build(d.mass!);
  }
  const diameter: number = d.diameter!;
  builder.box(
    "circle",
    Vector3.create(diameter, AutoMovieArchetypeThrowingCircle.LINE, diameter),
    Vector3.create(0, AutoMovieArchetypeThrowingCircle.LINE / 2, 0),
    { color: "#9a9ea3" },
  );
  builder.affordance({
    id: "circle",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, 0)),
    extent: null,
    width: diameter,
    depth: diameter,
  });
  return builder.build(d.mass!);
}

  /**
   * The marking's height above the floor, metres: an estimate drawn so the
   * place shows.
   */
  export const LINE: number = 0.005;

  /** Every event, for a caller that reads one at run time. */
  export const EVENTS: readonly Event[] = [
    "shot",
    "discus",
    "hammer",
    "javelin",
  ];

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    width: "m",
    radius: "m",
    mass: "kg",
  };

  /** The bands of each event. */
  export const BANDS: Readonly<
    Record<Event, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    shot: {
      diameter: AutoMovieArchetypeBand.metres(2.13, 2.14, AutoMovieArchetypeThrowingCircleData.RULES),
      mass: AutoMovieArchetypeThrowingCircleData.MASS,
    },
    hammer: {
      diameter: AutoMovieArchetypeBand.metres(2.13, 2.14, AutoMovieArchetypeThrowingCircleData.RULES),
      mass: AutoMovieArchetypeThrowingCircleData.MASS,
    },
    discus: {
      diameter: AutoMovieArchetypeBand.metres(2.495, 2.505, AutoMovieArchetypeThrowingCircleData.RULES),
      mass: AutoMovieArchetypeThrowingCircleData.MASS,
    },
    javelin: {
      width: AutoMovieArchetypeBand.metres(4, 4, AutoMovieArchetypeThrowingCircleData.RULES),
      radius: AutoMovieArchetypeBand.metres(8, 8, AutoMovieArchetypeThrowingCircleData.RULES),
      mass: AutoMovieArchetypeThrowingCircleData.MASS,
    },
  };
}
