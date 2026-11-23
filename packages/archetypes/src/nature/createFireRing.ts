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

/** A maker's campground fire ring, read. */
const RING: string =
  'Belson FR-30-GNG fire ring: "3/16" steel plate, 8"H x 30" Diameter", 42 lbs without the grill grate (https://belson.com/Fire-Ring-with-Flip-Back-Campfire-Grill); the diameter, which the page does not call inside or outside, taken as the ring\'s outside';

/**
 * A campground fire ring: a steel band standing on the ground round a fire.
 *
 * It stands on the ground at the origin, `+Y` up, a ring of the read steel plate's thickness, height and diameter, drawn as `SEGMENTS` flat plates round the circle, a construction detail no act reads. `rim` is the ring's top edge on its `+Z` side, facing up, where a foot rests or a pot is set; `fire` is the ground at its centre, `+Y` up the flame, where a production places the fire. It is steel, and stands on soil, which no measured pair covers, so its body carries no friction.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The fire ring.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the ring stands, how it is drawn, its two contacts and why it carries no friction.
 * @evidence contracts/development/implementation.md#principled-implementation Plates of the read thickness and height, each as wide as its side of the polygon whose faces touch the read outside circle, turned round the vertical axis; the mass is the read weight.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, lay the plates round the circle, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The round band is drawn as a polygon of `SEGMENTS` plates and its flange is not drawn; no contact reads either.
 * @evidence contracts/development/implementation.md#efficient-algorithms `SEGMENTS` parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createFireRing(
  params: createFireRing.IParams,
  seed?: number | string,
): AutoMovieArchetype<createFireRing.Affordance, createFireRing.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createFireRing.Dimension> =
    new AutoMovieArchetypeDrawSession<createFireRing.Dimension>(
      "fireRing",
      createFireRing.UNITS,
      seed,
      params,
    );
  const kind: createFireRing.Kind = ArchetypeDraw.choice(
    "fireRing",
    "kind",
    params.kind,
    createFireRing.KINDS,
  );
  const d: Record<createFireRing.Dimension, number> = draw.dimensions(
    createFireRing.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    createFireRing.Affordance,
    createFireRing.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "fire ring",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;

  // Each plate's outer face is tangent to the outside circle, so the ring measures the read diameter across opposite plates.
  const outside: number = d.diameter / 2;
  const n: number = createFireRing.SEGMENTS;
  const chord: number = 2 * outside * Math.tan(Math.PI / n);
  const middle: number = outside - d.wall / 2;
  for (let k: number = 0; k < n; ++k) {
    const angle: number = (2 * Math.PI * k) / n;
    builder.box(
      `plate${k}`,
      v(chord, d.height, d.wall),
      v(middle * Math.sin(angle), d.height / 2, middle * Math.cos(angle)),
      {
        color: "#3a3a3a",
        surface: "steel",
        rotation: {
          x: 0,
          y: Math.sin(angle / 2),
          z: 0,
          w: Math.cos(angle / 2),
        },
      },
    );
  }
  builder.affordance({
    id: "rim",
    kind: "ledge",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.height, middle)),
    extent: null,
  });
  builder.affordance({
    id: "fire",
    kind: "socket",
    direction: "along",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createFireRing}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of rings, each band the maker's read figure through `AutoMovieArchetypeUnits`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rim a foot or a pot meets and the fire's place (#3468's N9).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every band is read; the segment count only draws the circle.
 */
export namespace createFireRing {
  /** The kinds: a 30 in campground fire ring. */
  export type Kind = "campground";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["campground"];

  /** The plates the circle is drawn with: a construction detail no act reads. */
  export const SEGMENTS: number = 16;

  /**
   * The affordance ids:
   *
   * - `rim`: the ring's top edge on its `+Z` side, facing up.
   * - `fire`: the ground at the ring's centre, `+Y` up the flame.
   */
  export type Affordance = "rim" | "fire";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `diameter`: the ring's outside.
   * - `height`: its rim above the ground.
   * - `wall`: its steel plate's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "height" | "wall" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    height: "m",
    wall: "m",
    mass: "kg",
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which ring. */
    kind: Kind;

    /** The model's id, unique in a scene; `fireRing` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    campground: {
      diameter: AutoMovieArchetypeBand.metres(
        30 * AutoMovieArchetypeUnits.INCH,
        30 * AutoMovieArchetypeUnits.INCH,
        `${RING}: taking it as the outside is a choice, not a reading, and the rim reads it; the inside reading differs by twice the plate, about 9.5 mm`,
        true,
      ),
      height: AutoMovieArchetypeBand.metres(
        8 * AutoMovieArchetypeUnits.INCH,
        8 * AutoMovieArchetypeUnits.INCH,
        RING,
      ),
      wall: AutoMovieArchetypeBand.metres(
        (3 / 16) * AutoMovieArchetypeUnits.INCH,
        (3 / 16) * AutoMovieArchetypeUnits.INCH,
        RING,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        42 * AutoMovieArchetypeUnits.POUND,
        42 * AutoMovieArchetypeUnits.POUND,
        RING,
      ),
    },
  };
}
