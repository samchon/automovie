import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The rules the pit's figures come from. */
const RULES: string =
  "World Athletics Technical Rules (2020 edition), TR29.2 take-off board 1.21-1.22 m long, 0.20 m wide and 0.10 m deep, flush with the runway; TR29.5 the long jump board 1-3 m from the near end of the landing area; TR29.4 at least 10 m from the take-off line to the far end; TR29.6 a landing area 2.75-3 m wide, its sand level with the board (https://athletics.lv/file/download/61151)";

/** Constructs the jump pit archetype from its recipe. */
export namespace AutoMovieArchetypeJumpPit {
/**
 * A long jump's take-off board and sand landing area, both flush with the
 * runway.
 *
 * The runway runs along `+Z` toward the pit, the jumper facing `+Z`. The
 * board's far edge, the take-off line, lies on `X` at the origin, the board
 * behind it along `-Z`. The sand begins `gap` beyond the line and runs to
 * `reach` beyond it. `board` is the board's top and `sand` the sand's, each
 * `+Y` up, both at the runway's height 0.
 *
 * @param params Any figure the author fixes.
 * @param seed The seed that draws each figure left free inside its band;
 *   absent, the middle of each band.
 * @returns The jump pit.
 * @throws {AutoMovieArchetypeRefusal} For a fixed figure outside its band.
 */
export function create(
  params: AutoMovieArchetypeJumpPit.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeJumpPit.Affordance, AutoMovieArchetypeJumpPit.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeJumpPit.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeJumpPit.Dimension>(
      "jumpPit",
      AutoMovieArchetypeJumpPit.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeJumpPit.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeJumpPit.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeJumpPit.Affordance,
    AutoMovieArchetypeJumpPit.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "long jump pit",
    draw,
  });

  // The board: its far edge the take-off line at the origin.
  builder.box(
    "board",
    Vector3.create(d.boardLength, AutoMovieArchetypeJumpPit.BOARD_DEPTH, d.boardWidth),
    Vector3.create(0, -AutoMovieArchetypeJumpPit.BOARD_DEPTH / 2, -d.boardWidth / 2),
    { color: "#f2f2ee" },
  );
  builder.affordance({
    id: "board",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create(0, 0, -d.boardWidth / 2),
    ),
    extent: null,
    width: d.boardLength,
    depth: d.boardWidth,
  });

  // The sand: from `gap` beyond the line to `reach`.
  const length: number = d.reach - d.gap;
  const centre: number = d.gap + length / 2;
  builder.box(
    "sand",
    Vector3.create(d.width, AutoMovieArchetypeJumpPit.SAND_DEPTH, length),
    Vector3.create(0, -AutoMovieArchetypeJumpPit.SAND_DEPTH / 2, centre),
    { color: "#d8c08a" },
  );
  builder.affordance({
    id: "sand",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, centre)),
    extent: null,
    width: d.width,
    depth: length,
  });
  return builder.build(d.mass);
}

  /** The board's depth below its top, metres: TR29.2's 0.10 m. */
  export const BOARD_DEPTH: number = 0.1;

  /**
   * The sand's depth drawn below its top, metres: an estimate, the rules set
   * none.
   */
  export const SAND_DEPTH: number = 0.3;

  /**
   * The affordance ids:
   *
   * - `board`: the take-off board's top; its far edge along `+Z` is the take-off
   *   line.
   * - `sand`: the landing area's top.
   */
  export type Affordance = "board" | "sand";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `boardLength`: the board across the runway, along `X`.
   * - `boardWidth`: the board along the runway, along `Z`.
   * - `gap`: the take-off line to the sand's near end.
   * - `reach`: the take-off line to the sand's far end.
   * - `width`: the sand across the runway.
   * - `mass`: kilograms, of the board alone (an estimate; the sand is part of the
   *   ground).
   */
  export type Dimension =
    | "boardLength"
    | "boardWidth"
    | "gap"
    | "reach"
    | "width"
    | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    boardLength: "m",
    boardWidth: "m",
    gap: "m",
    reach: "m",
    width: "m",
    mass: "kg",
  };

  /** The parameters: any figure fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `jumpPit` when absent. */
    id?: string;
  }

  /** The band of each figure. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    boardLength: AutoMovieArchetypeBand.metres(1.21, 1.22, RULES),
    boardWidth: AutoMovieArchetypeBand.metres(0.198, 0.202, RULES),
    gap: AutoMovieArchetypeBand.metres(1, 3, RULES),
    reach: AutoMovieArchetypeBand.metres(10, 11, RULES, true),
    width: AutoMovieArchetypeBand.metres(2.75, 3, RULES),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      10,
      20,
      "an estimate of a wooden board 1.22 x 0.20 x 0.10 m",
      true,
    ),
  };
}
