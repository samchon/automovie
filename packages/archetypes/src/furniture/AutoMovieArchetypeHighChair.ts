import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeHighChairData } from "./internal/AutoMovieArchetypeHighChairData";

/** Constructs the high chair archetype from its recipe. */
export namespace AutoMovieArchetypeHighChair {
/**
 * A child's high chair: a seat shell on four splayed legs, its back rising to
 * the chair's height.
 *
 * The chair stands on the floor at the origin, facing `+Z`. Its legs run from
 * the corners of the maker's footprint up to the seat's corners; the seat lies
 * at the maker's seat height and its back stands at the seat's rear edge up to
 * the chair's height. `seat` is the seat a child is set on and lifted from,
 * facing `+Z`. The tray is not built, since no source read sizes or places it;
 * setting a child in and lifting one out is a two-body act with no motion law
 * yet (#3440).
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The chair.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeHighChair.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeHighChair.Affordance, AutoMovieArchetypeHighChair.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeHighChair.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeHighChair.Dimension>(
      "highChair",
      AutoMovieArchetypeHighChair.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeHighChair.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeHighChair.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeHighChair.Affordance,
    AutoMovieArchetypeHighChair.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "high chair",
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const E: typeof ESTIMATES = ESTIMATES;
  const seat: number = d.seatHeight;
  const half: { x: number; z: number } = {
    x: d.seatWidth / 2,
    z: d.seatDepth / 2,
  };
  const foot: { x: number; z: number } = {
    x: d.width / 2 - E.leg / 2,
    z: d.depth / 2 - E.leg / 2,
  };
  for (const [id, sx, sz] of [
    ["leg-1", 1, 1],
    ["leg-2", -1, 1],
    ["leg-3", 1, -1],
    ["leg-4", -1, -1],
  ] as const)
    builder.rod(
      id,
      E.leg / 2,
      v(sx * foot.x, E.leg / 2, sz * foot.z),
      v(sx * half.x, seat - E.shell, sz * half.z),
      { color: "#d9c7a7", round: true },
    );
  builder.box(
    "seat",
    v(d.seatWidth, E.shell, d.seatDepth),
    v(0, seat - E.shell / 2, 0),
    { color: "#f2f2f2" },
  );
  builder.box(
    "back",
    v(d.seatWidth, d.height - seat, E.shell),
    v(0, (d.height + seat) / 2, -half.z - E.shell / 2),
    { color: "#f2f2f2" },
  );
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, seat, half.z),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    width: d.seatWidth,
    depth: d.seatDepth,
  });
  return builder.build(d.mass);
}

  /** The affordance id: `seat`, the seat, facing `+Z`. */
  export type Affordance = "seat";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `depth`: the footprint.
   * - `height`: the chair's top.
   * - `seatHeight`, `seatWidth`, `seatDepth`: the seat.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "width"
    | "depth"
    | "height"
    | "seatHeight"
    | "seatWidth"
    | "seatDepth"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    depth: "m",
    height: "m",
    seatHeight: "m",
    seatWidth: "m",
    seatDepth: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `highChair` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.metres(0.56, 0.56, AutoMovieArchetypeHighChairData.ANTILOP),
    depth: AutoMovieArchetypeBand.metres(0.59, 0.59, AutoMovieArchetypeHighChairData.ANTILOP),
    height: AutoMovieArchetypeBand.metres(0.9, 0.9, AutoMovieArchetypeHighChairData.ANTILOP),
    seatHeight: AutoMovieArchetypeBand.metres(0.54, 0.54, AutoMovieArchetypeHighChairData.ANTILOP),
    seatWidth: AutoMovieArchetypeBand.metres(0.25, 0.25, AutoMovieArchetypeHighChairData.ANTILOP),
    seatDepth: AutoMovieArchetypeBand.metres(0.22, 0.22, AutoMovieArchetypeHighChairData.ANTILOP),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      2.5,
      4,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}

/*
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `leg`, a leg's diameter; `shell`, the seat
 * shell's thickness.
 */
const ESTIMATES: Readonly<{ leg: number; shell: number }> = {
  leg: 0.025,
  shell: 0.02,
};
