import { Quaternion, Vector3 } from "@automovie/engine";

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

/** The lectern read. */
const SAFCO: string =
  "Safco 8915 lectern specification sheet: 23 x 15 3/4 x 46 in high, the reading surface 23 in wide and 15 3/4 in deep sloping at 15 degrees (https://argo.webstaurantstore.com/documents/specsheets/328saf8915mh_specs.pdf)";

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `slab`, the reading surface's thickness. */
const ESTIMATES: Readonly<{ slab: number }> = { slab: 0.02 };

/**
 * A floor lectern: a cabinet under a reading surface that slopes down toward the speaker.
 *
 * The lectern stands on the floor at the origin, the speaker on its `+Z` side facing `-Z`. Its reading surface's back edge is the maker's height and its front edge lower by the surface's depth at the maker's slope. `top` is the reading surface, its `+Y` the tilted normal; `front` its lower front edge, a ledge the hands rest on and a book stops against.
 *
 * No source read names what it rests on, so its body's friction is the builder's 0.5 placeholder (`ArchetypeFriction`).
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The lectern.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the lectern stands, where the speaker is and its two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The maker's width, depth, height and slope; the front edge's height follows from the slope over the surface's depth.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the cabinet, the tilted surface, then the two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The cabinet is one block to the front edge's height; the surface's thickness is a construction estimate.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createLectern(
  params: createLectern.IParams = {},
  seed?: number | string,
): Archetype<createLectern.Affordance, createLectern.Dimension> {
  const d: Record<createLectern.Dimension, number> = ArchetypeDraw.dimensions(
    "lectern",
    createLectern.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createLectern.Affordance,
    createLectern.Dimension
  > = new ArchetypeBuilder({
    archetype: "lectern",
    id: params.id,
    name: "lectern",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const slope: number = (d.slope * Math.PI) / 180;
  const run: number = d.depth * Math.cos(slope);
  const front: number = d.height - d.depth * Math.sin(slope);
  builder.box("cabinet", v(d.width, front, run), v(0, front / 2, 0), {
    color: "#6b4a2f",
  });
  // The surface's middle, its slab hung below the surface's plane.
  const middle: { y: number; z: number } = {
    y: (d.height + front) / 2 - (ESTIMATES.slab / 2) * Math.cos(slope),
    z: -(ESTIMATES.slab / 2) * Math.sin(slope),
  };
  builder.box("surface", v(d.width, ESTIMATES.slab, d.depth), v(0, middle.y, middle.z), {
    color: "#7d5a3c",
    rotation: Quaternion.fromAxisAngle(v(1, 0, 0), d.slope),
  });
  const normal: ReturnType<typeof v> = v(0, Math.cos(slope), Math.sin(slope));
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(0, (d.height + front) / 2, 0), normal, v(1, 0, 0)),
    extent: null,
    width: d.width,
    depth: d.depth,
  });
  builder.affordance({
    id: "front",
    kind: "ledge",
    frame: ArchetypeFrame.facing(v(0, front, run / 2), normal, v(1, 0, 0)),
    extent: null,
    length: d.width,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createLectern}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The surface a speaker reads from and the edge the hands rest on (#3468 N6).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The mass, which the sheet does not give, is provisional.
 */
export namespace createLectern {
  /**
   * The affordance ids:
   *
   * - `top`: the sloping reading surface.
   * - `front`: its lower front edge, a ledge along `X`.
   */
  export type Affordance = "top" | "front";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `depth`: the reading surface across and up its slope.
   * - `height`: the surface's back edge above the floor.
   * - `slope`: the surface's fall toward the speaker, degrees.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "depth" | "height" | "slope" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `lectern` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    width: ArchetypeBand.metres(23 * INCH, 23 * INCH, SAFCO),
    depth: ArchetypeBand.metres(15.75 * INCH, 15.75 * INCH, SAFCO),
    height: ArchetypeBand.metres(46 * INCH, 46 * INCH, SAFCO),
    slope: ArchetypeBand.of("degrees", 15, 15, SAFCO),
    mass: ArchetypeBand.of("kg", 15, 30, ArchetypeBand.TYPICAL_MASS, true),
  };
}
