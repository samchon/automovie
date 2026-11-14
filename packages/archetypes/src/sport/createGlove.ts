import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Metres in an inch. */
const INCH: number = 0.0254;

/**
 * A baseball glove: a fielder's glove or a catcher's mitt.
 *
 * It lies on its back on the floor, the pocket up, the fingers toward `+Z` and the wrist opening toward `-Z`, its centre over the origin. `hand` is the wrist opening the hand slides into, its `+Y` out of the opening; `pocket` the catching face a ball comes to, facing up. A glove is worn on the hand (`IHumanProp.worn`), so a catch reads the pocket where the hand carries it.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The glove.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the glove lies, its two contacts and how it is worn.
 * @evidence contracts/development/implementation.md#principled-implementation One padded box of the drawn width and length, as thick as the kind's padding; the pocket at the palm's centre on top, the opening at the wrist's end.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one part, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fingers, webbing or lacing; the thickness is a named estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createGlove(
  params: createGlove.IParams,
  seed?: number | string,
): Archetype<createGlove.Affordance, createGlove.Dimension> {
  const kind: createGlove.Kind = ArchetypeDraw.choice(
    "glove",
    "kind",
    params.kind,
    createGlove.KINDS,
  );
  const d: Record<createGlove.Dimension, number> = ArchetypeDraw.dimensions(
    "glove",
    createGlove.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createGlove.Affordance,
    createGlove.Dimension
  > = new ArchetypeBuilder({
    archetype: "glove",
    id: params.id,
    name: kind === "fielder" ? "fielder's glove" : "catcher's mitt",
    dimensions: d,
  });
  const thick: number = createGlove.THICKNESS[kind];
  builder.box(
    "glove",
    Vector3.create(d.width, thick, d.length),
    Vector3.create(0, thick / 2, 0),
    { color: "#8b4513" },
  );
  builder.affordance({
    id: "hand",
    kind: "socket",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, thick / 2, -d.length / 2),
      Vector3.create(0, 0, -1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "pocket",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, thick, 0)),
    extent: null,
    width: d.width / 2,
    depth: d.length / 3,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createGlove}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the two gloves the rules size and one band per dimension per kind, the rules' limits at the top.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The opening a hand enters and the pocket a catch reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The sizes are the rule's limits as read, which the model takes; the rule leaves the weight free and no maker's weight was read, so the masses are provisional; the padding's thickness is a named estimate.
 */
export namespace createGlove {
  /** The kinds. */
  export type Kind = "fielder" | "catcher";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["fielder", "catcher"];

  /** The glove's thickness lying on its back, metres, by kind: estimates. */
  export const THICKNESS: Readonly<Record<Kind, number>> = {
    fielder: 0.07,
    catcher: 0.09,
  };

  /**
   * The affordance ids:
   *
   * - `hand`: the wrist opening, its `+Y` out of it toward `-Z`.
   * - `pocket`: the catching face, facing up, a half of the width and a third of the length.
   */
  export type Affordance = "hand" | "pocket";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the wrist's end to the fingers' tips.
   * - `width`: across the palm.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which glove. */
    kind: Kind;

    /** The model's id, unique in a scene; `glove` when absent. */
    id?: string;
  }

  /** The Official Baseball Rules 2024. */
  const OBR: string =
    "Official Baseball Rules 2024 (https://www.baseball.ca/uploads/files/2024%20Rules/2024%20MLB%20Official%20Rules%20-%20EN.pdf)";

  /** A band in metres at a rule's limit. */
  const m = (minimum: number, maximum: number, source: string): IArchetypeBand =>
    ArchetypeBand.metres(minimum, maximum, source);

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    fielder: {
      length: m(
        13 * INCH,
        13 * INCH,
        `${OBR}, 3.06: a fielder's glove not more than 13 in from a finger's tip to the heel, the limit the model takes`,
      ),
      width: m(
        7.75 * INCH,
        7.75 * INCH,
        `${OBR}, 3.06: not more than 7 3/4 in wide, the limit the model takes`,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.5,
        0.7,
        `${OBR}, 3.06: the glove can be of any weight; no maker's weight was read`,
        true,
      ),
    },
    catcher: {
      length: m(
        15.5 * INCH,
        15.5 * INCH,
        `${OBR}, 3.04: a catcher's mitt not more than 15 1/2 in from top to bottom, the limit the model takes`,
      ),
      width: m(
        2 * ((38 * INCH) / Math.PI - (15.5 * INCH) / 2),
        2 * ((38 * INCH) / Math.PI - (15.5 * INCH) / 2),
        `${OBR}, 3.04: not more than 38 in round and 15 1/2 in long, the width of an ellipse of that round and that length`,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.6,
        0.9,
        `${OBR}, 3.04: the rule states no weight; no maker's weight was read`,
        true,
      ),
    },
  };
}