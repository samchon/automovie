import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** The safe read. */
const AMSEC: string =
  'AMSEC 2022 gun safe catalog, BFX6030: outside 59 1/4" x 30" x 26", "Door Clearance 51 3/4" x 22 5/16"", "Door Thickness 4 3/4"", 1,081 lb (https://s3.amazonaws.com/s3-absupply-net/pdf/amsec/amsec-gs-catalog-2022.pdf)';

/**
 * A gun safe: a steel body whose door fills the front's clear opening, hung on a hinge at one side.
 *
 * The safe stands on the floor with its back on the origin's `Z` and its front at `+Z`, centred on `X`. The door is a slab of the maker's thickness and clear opening, flush with the front and centred in it, framed by the front's stiles and rails, which leave the outside's width and height. `door` is its hinge on the side `hinge` names as seen from in front; a positive travel would swing the door out toward `+Z`, but the hinge states no travel, since no source read gives the door's swing. The dial and the handle are not built: no source read places them.
 *
 * It rests on its steel body: steel on concrete (`ArchetypeFriction`).
 *
 * @param params The hinge side and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The safe.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, how the door sits, which way it would open, why it states no travel, what is left out and its contact.
 * @evidence contracts/development/implementation.md#principled-implementation The maker's outside, door clearance, door thickness and weight; the front's frame the outside less the clearance, a derivation; the door centred in the front, the frame's sides being equal for want of a drawing.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then the body, the front's frame, the door and its hinge.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The door is drawn the clearance's size, not its larger leaf; the bolts, dial, handle and interior are not built.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Six parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSafe(
  params: createSafe.IParams = {},
  seed?: number | string,
): Archetype<createSafe.Affordance, createSafe.Dimension> {
  const draw: ArchetypeDrawSession<createSafe.Dimension> = new ArchetypeDrawSession<createSafe.Dimension>("safe", createSafe.UNITS, seed, params);
  const s: number =
    ArchetypeDraw.choice("safe", "hinge", params.hinge ?? "right", [
      "left",
      "right",
    ]) === "right"
      ? 1
      : -1;
  const d: Record<createSafe.Dimension, number> = draw.dimensions(createSafe.BANDS);
  const builder: ArchetypeBuilder<createSafe.Affordance, createSafe.Dimension> =
    new ArchetypeBuilder({
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
  const options: ArchetypeBuilder.IOptions = { color: steel, surface: "steel" };
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
    frame: ArchetypeFrame.facing(
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
 * Companion types and bands of {@link createSafe}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension, each the maker's single figure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The door's hinge, all an act can take hold of until the handle is placed (#3468 N14).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A swing, a dial or a handle no source places is left out, not invented.
 */
export namespace createSafe {
  /** The affordance id: `door`, the door's hinge on the side the parameter names, swinging toward `+Z`; it states no travel. */
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
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    height: "m",
    width: "m",
    depth: "m",
    clearHeight: "m",
    clearWidth: "m",
    door: "m",
    mass: "kg",
  };

  /** The parameters: the hinge side, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The side the hinge is on, as seen by someone in front of the safe facing it: `left` is `-X`. Right when absent. */
    hinge?: "left" | "right";

    /** The model's id, unique in a scene; `safe` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    height: ArchetypeBand.metres(
      59.25 * ArchetypeUnits.INCH,
      59.25 * ArchetypeUnits.INCH,
      AMSEC,
    ),
    width: ArchetypeBand.metres(
      30 * ArchetypeUnits.INCH,
      30 * ArchetypeUnits.INCH,
      AMSEC,
    ),
    depth: ArchetypeBand.metres(
      26 * ArchetypeUnits.INCH,
      26 * ArchetypeUnits.INCH,
      AMSEC,
    ),
    clearHeight: ArchetypeBand.metres(
      51.75 * ArchetypeUnits.INCH,
      51.75 * ArchetypeUnits.INCH,
      AMSEC,
    ),
    clearWidth: ArchetypeBand.metres(
      (22 + 5 / 16) * ArchetypeUnits.INCH,
      (22 + 5 / 16) * ArchetypeUnits.INCH,
      AMSEC,
    ),
    door: ArchetypeBand.metres(
      4.75 * ArchetypeUnits.INCH,
      4.75 * ArchetypeUnits.INCH,
      AMSEC,
    ),
    mass: ArchetypeBand.of(
      "kg",
      1081 * ArchetypeUnits.POUND,
      1081 * ArchetypeUnits.POUND,
      AMSEC,
    ),
  };
}
