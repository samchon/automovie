import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeSafeData } from "./internal/AutoMovieArchetypeSafeData";

/** Constructs a closed steel safe with a fixed front-door hinge frame. */
export namespace AutoMovieArchetypeSafe {
/**
 * Build a closed steel safe with its back at model Z zero.
 *
 * The body is centred in X and rests on the floor. The front door fills
 * the opening between the two stiles and two horizontal rails.
 *
 * @param params Optional hinge side, scene object ID and dimensions
 *   equal to their recorded band values.
 * @param seed Numeric seed for omitted dimensions. This model's bands
 *   have equal endpoints.
 * @returns The closed safe and its resting `door` hinge frame.
 * @throws {AutoMovieArchetypeRefusal} If hinge side or a fixed value is inadmissible.
 */
export function create(
  params: AutoMovieArchetypeSafe.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSafe.Affordance, AutoMovieArchetypeSafe.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSafe.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeSafe.Dimension>(
      "safe",
      AutoMovieArchetypeSafe.UNITS,
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
  const d: Record<AutoMovieArchetypeSafe.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeSafe.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSafe.Affordance,
    AutoMovieArchetypeSafe.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "gun safe",
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
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

  /**
   * `door` names the resting hinge frame on the selected side. The frame has no authored travel.
   */
  export type Affordance = "door";

  /**
   * Outside height, width and depth, door opening height and width and slab thickness in metres. `mass` is in kilograms.
   */
  export type Dimension =
    | "height"
    | "width"
    | "depth"
    | "clearHeight"
    | "clearWidth"
    | "door"
    | "mass";

  /** Metres for body and door geometry, kilograms for body mass. */
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
   * Optional scene object ID, hinge side and values equal to the model's bands.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /**
     * `left` places the hinge on `-X` and `right` on `+X`. Defaults to `right`.
     */
    hinge?: "left" | "right";

    /** Scene object ID, defaulting to `safe`. */
    id?: string;
  }

  /**
   * Fixed outside dimensions, door opening, slab thickness and mass from the BFX6030 catalogue record.
   */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(
      59.25 * AutoMovieArchetypeUnits.INCH,
      59.25 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeSafeData.AMSEC,
    ),
    width: AutoMovieArchetypeBand.metres(
      30 * AutoMovieArchetypeUnits.INCH,
      30 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeSafeData.AMSEC,
    ),
    depth: AutoMovieArchetypeBand.metres(
      26 * AutoMovieArchetypeUnits.INCH,
      26 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeSafeData.AMSEC,
    ),
    clearHeight: AutoMovieArchetypeBand.metres(
      51.75 * AutoMovieArchetypeUnits.INCH,
      51.75 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeSafeData.AMSEC,
    ),
    clearWidth: AutoMovieArchetypeBand.metres(
      (22 + 5 / 16) * AutoMovieArchetypeUnits.INCH,
      (22 + 5 / 16) * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeSafeData.AMSEC,
    ),
    door: AutoMovieArchetypeBand.metres(
      4.75 * AutoMovieArchetypeUnits.INCH,
      4.75 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeSafeData.AMSEC,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      1081 * AutoMovieArchetypeUnits.POUND,
      1081 * AutoMovieArchetypeUnits.POUND,
      AutoMovieArchetypeSafeData.AMSEC,
    ),
  };
}
