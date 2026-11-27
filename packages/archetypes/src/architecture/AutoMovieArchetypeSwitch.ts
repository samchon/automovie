import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { ADA_RANGES } from "./ADA_RANGES";

/** The travel of a switch or a button, for which no specification was read. */
const TRAVEL: string = "switch travel, not read at a source";

/** Constructs the switch archetype from its recipe. */
export namespace AutoMovieArchetypeSwitch {
/**
 * A wall control pressed with a finger: a rocker light switch or a round call
 * button.
 *
 * The control sits on a wall plate in the `XY` plane, facing `+Z`, at its
 * mounting height above the origin on the floor. Its moving face is a part on
 * the `press` button, so pressing it sinks it into the plate.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The control.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeSwitch.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSwitch.Affordance, AutoMovieArchetypeSwitch.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSwitch.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeSwitch.Dimension>(
      "switch",
      AutoMovieArchetypeSwitch.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeSwitch.Kind = ArchetypeDraw.choice(
    "switch",
    "kind",
    params.kind,
    AutoMovieArchetypeSwitch.KINDS,
  );
  const d: Record<AutoMovieArchetypeSwitch.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeSwitch.BANDS[kind],
    AutoMovieArchetypeSwitch.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSwitch.Affordance,
    AutoMovieArchetypeSwitch.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind === "rocker" ? "light switch" : "call button",
    draw,
  });
  builder.box(
    "plate",
    Vector3.create(d.width + 0.03, d.size + 0.03, 0.004),
    Vector3.create(0, d.height, 0.002),
    { color: "#e9e6df" },
  );
  if (kind === "rocker")
    builder.box(
      "face",
      Vector3.create(d.width, d.size, 0.006),
      Vector3.create(0, d.height, 0.007),
      { color: "#f7f5f0" },
    );
  else
    builder.rod(
      "face",
      d.size / 2,
      Vector3.create(0, d.height, 0.004),
      Vector3.create(0, d.height, 0.01),
      { color: "#c9ccd1" },
    );
  builder.affordance({
    id: "press",
    kind: "button",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, d.height, 0.01),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    travel: d.travel,
    parts: ["face"],
  });
  return builder.build(d.mass);
}
}

/** Companion types and bands of {@link createSwitch}. */
export namespace AutoMovieArchetypeSwitch {
  /** The kinds of control. */
  export type Kind = "rocker" | "button";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["rocker", "button"];

  /** The affordance id: `press`, the face a finger presses into the wall. */
  export type Affordance = "press";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the control's centre above the floor.
   * - `size`: a rocker's height, or a button's diameter.
   * - `width`: a rocker's width; a button's diameter.
   * - `travel`: how far the face is pressed in.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "size" | "width" | "travel" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    size: "m",
    width: "m",
    travel: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which control. */
    kind: Kind;

    /** The model's id, unique in a scene; `switch` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    rocker: {
      height: AutoMovieArchetypeBand.metres(
        1.065,
        ADA_RANGES.reach.high,
        `${ADA_RANGES.reach.source}; the upper part of the range, where switches are mounted`,
        true,
      ),
      size: AutoMovieArchetypeBand.metres(
        0.103,
        0.107,
        "Leviton Decora rocker face, retailer listings seen only in search results",
        true,
      ),
      width: AutoMovieArchetypeBand.metres(
        0.036,
        0.045,
        "Leviton Decora rocker face, retailer listings seen only in search results",
        true,
      ),
      travel: AutoMovieArchetypeBand.metres(0.002, 0.004, TRAVEL, true),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.05,
        0.1,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    button: {
      height: AutoMovieArchetypeBand.metres(
        ADA_RANGES.reach.low,
        ADA_RANGES.reach.high,
        `2010 ADA Standards 407.2.1.1, call buttons within the reach ranges of 308 (https://www.access-board.gov/ada/chapter/ch04/); ${ADA_RANGES.reach.source}`,
      ),
      size: AutoMovieArchetypeBand.metres(
        0.019,
        0.03,
        "2010 ADA Standards 407.2.1.2, call buttons at least 3/4 in (19 mm) across (https://www.access-board.gov/ada/chapter/ch04/); the upper end is an estimate",
        true,
      ),
      width: AutoMovieArchetypeBand.metres(
        0.019,
        0.03,
        "2010 ADA Standards 407.2.1.2, as for the size",
        true,
      ),
      travel: AutoMovieArchetypeBand.metres(0.001, 0.003, TRAVEL, true),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.05,
        0.1,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
  };
}
