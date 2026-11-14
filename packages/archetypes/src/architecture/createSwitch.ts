import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The reach range for operable parts. */
const REACH: string =
  "2010 ADA Standards 308.2.1 and 309.3, operable parts 15 to 48 in above the floor (https://www.access-board.gov/ada/chapter/ch03/)";

/** The travel of a switch or a button, for which no specification was read. */
const TRAVEL: string = "switch travel, not read at a source";

/**
 * A wall control pressed with a finger: a rocker light switch or a round call button.
 *
 * The control sits on a wall plate in the `XY` plane, facing `+Z`, at its mounting height above the origin on the floor. Its moving face is a part on the `press` button, so pressing it sinks it into the plate.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The control.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where the control is, which way it faces and what moves.
 * @evidence contracts/development/implementation.md#principled-implementation A plate box and one moving face bound to a `button` whose frame faces out of the wall.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the plate and the face, declare the button.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rocker is pressed like a button, straight in; its tilt is not modelled.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSwitch(
  params: createSwitch.IParams,
  seed?: number | string,
): Archetype<createSwitch.Affordance, createSwitch.Dimension> {
  const kind: createSwitch.Kind = ArchetypeDraw.choice(
    "switch",
    "kind",
    params.kind,
    createSwitch.KINDS,
  );
  const d: Record<createSwitch.Dimension, number> = ArchetypeDraw.dimensions(
    "switch",
    createSwitch.BANDS[kind],
    seed,
    params,
    createSwitch.BANDS,
  );
  const builder: ArchetypeBuilder<
    createSwitch.Affordance,
    createSwitch.Dimension
  > = new ArchetypeBuilder({
    archetype: "switch",
    id: params.id,
    name: kind === "rocker" ? "light switch" : "call button",
    dimensions: d,
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
    frame: ArchetypeFrame.facing(
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

/**
 * Companion types and bands of {@link createSwitch}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The height a finger reaches to, the size it aims at and the travel it presses (#3371).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Both kinds share one affordance and one set of dimensions.
 */
export namespace createSwitch {
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which control. */
    kind: Kind;

    /** The model's id, unique in a scene; `switch` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    rocker: {
      height: ArchetypeBand.metres(
        1.065,
        1.22,
        `${REACH}; the upper part of the range, where switches are mounted`,
        true,
      ),
      size: ArchetypeBand.metres(
        0.103,
        0.107,
        "Leviton Decora rocker face, retailer listings seen only in search results",
        true,
      ),
      width: ArchetypeBand.metres(
        0.036,
        0.045,
        "Leviton Decora rocker face, retailer listings seen only in search results",
        true,
      ),
      travel: ArchetypeBand.metres(0.002, 0.004, TRAVEL, true),
      mass: ArchetypeBand.of("kg", 0.05, 0.1, ArchetypeBand.TYPICAL_MASS, true),
    },
    button: {
      height: ArchetypeBand.metres(
        0.38,
        1.22,
        `2010 ADA Standards 407.2.1.1, call buttons within the reach ranges of 308 (https://www.access-board.gov/ada/chapter/ch04/)`,
      ),
      size: ArchetypeBand.metres(
        0.019,
        0.03,
        "2010 ADA Standards 407.2.1.2, call buttons at least 3/4 in (19 mm) across (https://www.access-board.gov/ada/chapter/ch04/); the upper end is an estimate",
        true,
      ),
      width: ArchetypeBand.metres(
        0.019,
        0.03,
        "2010 ADA Standards 407.2.1.2, as for the size",
        true,
      ),
      travel: ArchetypeBand.metres(0.001, 0.003, TRAVEL, true),
      mass: ArchetypeBand.of("kg", 0.05, 0.1, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
