import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The safe read. */
const AMSEC: string =
  'AMSEC 2022 gun safe catalog, BFX6030: outside 59 1/4" x 30" x 26", "Door Clearance 51 3/4" x 22 5/16"", "Door Thickness 4 3/4"", 1,081 lb (https://s3.amazonaws.com/s3-absupply-net/pdf/amsec/amsec-gs-catalog-2022.pdf)';

/**
 * A gun safe: a steel body whose door fills the front's clear opening, hung on
 * a hinge at one side.
 *
 * The safe stands on the floor with its back on the origin's `Z` and its front
 * at `+Z`, centred on `X`. The door is a slab of the maker's thickness and
 * clear opening, flush with the front and centred in it, framed by the front's
 * stiles and rails, which leave the outside's width and height. `door` is its
 * hinge on the side `hinge` names as seen from in front; a positive travel
 * would swing the door out toward `+Z`, but the hinge states no travel, since
 * no source read gives the door's swing. The dial and the handle are not built:
 * no source read places them.
 *
 * It rests on its steel body: steel on concrete (`AutoMovieArchetypeFriction`).
 *
 * @param params The hinge side and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The safe.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createSafe(
  params: createSafe.IParams = {},
  seed?: number,
): AutoMovieArchetype<createSafe.Affordance, createSafe.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createSafe.Dimension> =
    new AutoMovieArchetypeDrawSession<createSafe.Dimension>(
      "safe",
      createSafe.UNITS,
      seed,
      params,
    );
  const s: number =
    ArchetypeDraw.choice("safe", "hinge", params.hinge ?? "right", [
      "left",
      "right",
    ]) === "right"
      ? 1
      : -1;
  const d: Record<createSafe.Dimension, number> = draw.dimensions(
    createSafe.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createSafe.Affordance,
    createSafe.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "gun safe",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const steel: string = "#2f3236";
  const door: number = d.door;
  const back: number = d.depth - door;
  const front: number = d.depth - door / 2;
  const middle: number = d.height / 2;
  const stile: number = (d.width - d.clearWidth) / 2;
  const rail: number = (d.height - d.clearHeight) / 2;
  const options: AutoMovieArchetypeBuilder.IOptions = {
    color: steel,
    surface: "steel",
  };
  builder.box(
    "body",
    v(d.width, d.height, back),
    v(0, middle, back / 2),
    options,
  );
  for (const [id, sign] of [
    ["stile-left", 1],
    ["stile-right", -1],
  ] as const)
    builder.box(
      id,
      v(stile, d.height, door),
      v((sign * (d.width - stile)) / 2, middle, front),
      options,
    );
  for (const [id, y] of [
    ["rail-top", d.height - rail / 2],
    ["rail-bottom", rail / 2],
  ] as const)
    builder.box(id, v(d.clearWidth, rail, door), v(0, y, front), options);
  builder.box(
    "door",
    v(d.clearWidth, d.clearHeight, door),
    v(0, middle, front),
    {
      color: "#3a3e43",
    },
  );
  builder.affordance({
    id: "door",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(
      v((s * d.clearWidth) / 2, middle, d.depth),
      v(0, s, 0),
      v(-s, 0, 0),
    ),
    extent: null,
    parts: ["door"],
  });
  return builder.build(d.mass, { rests: "steel" });
}

/** Companion types and bands of {@link createSafe}. */
export namespace createSafe {
  /**
   * The affordance id: `door`, the door's hinge on the side the parameter
   * names, swinging toward `+Z`; it states no travel.
   */
  export type Affordance = "door";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`, `width`, `depth`: outside.
   * - `clearHeight`, `clearWidth`: the door's clear opening.
   * - `door`: the door's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "height"
    | "width"
    | "depth"
    | "clearHeight"
    | "clearWidth"
    | "door"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    width: "m",
    depth: "m",
    clearHeight: "m",
    clearWidth: "m",
    door: "m",
    mass: "kg",
  };

  /**
   * The parameters: the hinge side, and any free dimension fixed to a value
   * inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /**
     * The side the hinge is on, as seen by someone in front of the safe facing
     * it: `left` is `-X`. Right when absent.
     */
    hinge?: "left" | "right";

    /** The model's id, unique in a scene; `safe` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(
      59.25 * AutoMovieArchetypeUnits.INCH,
      59.25 * AutoMovieArchetypeUnits.INCH,
      AMSEC,
    ),
    width: AutoMovieArchetypeBand.metres(
      30 * AutoMovieArchetypeUnits.INCH,
      30 * AutoMovieArchetypeUnits.INCH,
      AMSEC,
    ),
    depth: AutoMovieArchetypeBand.metres(
      26 * AutoMovieArchetypeUnits.INCH,
      26 * AutoMovieArchetypeUnits.INCH,
      AMSEC,
    ),
    clearHeight: AutoMovieArchetypeBand.metres(
      51.75 * AutoMovieArchetypeUnits.INCH,
      51.75 * AutoMovieArchetypeUnits.INCH,
      AMSEC,
    ),
    clearWidth: AutoMovieArchetypeBand.metres(
      (22 + 5 / 16) * AutoMovieArchetypeUnits.INCH,
      (22 + 5 / 16) * AutoMovieArchetypeUnits.INCH,
      AMSEC,
    ),
    door: AutoMovieArchetypeBand.metres(
      4.75 * AutoMovieArchetypeUnits.INCH,
      4.75 * AutoMovieArchetypeUnits.INCH,
      AMSEC,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      1081 * AutoMovieArchetypeUnits.POUND,
      1081 * AutoMovieArchetypeUnits.POUND,
      AMSEC,
    ),
  };
}
