import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The café doors read. */
const DOORS: string =
  'Swinging Cafe Doors, Timeless Craftsman Beadboard saloon doors: "Doors Measure 40" in Height", "3/4" Thick", for "30",32",36" Door Opening Sizes", hardware "double action" (https://swingingcafedoors.com/timeless-craftsman-beadboard-saloon-doors)';

/** The floor gap, from an unbranded sheet. */
const GAP: string =
  'an unbranded café doors installation sheet hosted by Home Depot: "a measurement of 18" to 24" from the finished floor to the bottom edge of finished doors is recommended" (https://images.homedepot-static.com/catalog/pdfImages/42/428f879b-22b1-4888-9933-013639f2e559.pdf); its maker is not named';

/**
 * A leaf's opening on its gravity hinge, degrees: Swinging Cafe Doors' standard
 * gravity hinge, which "can be locked open in either direction" at 125 degrees
 * (https://swingingcafedoors.com/hardware-info).
 */
const SWING: number = 125;

/**
 * A pair of saloon (café) doors hung in a doorway: two leaves meeting at its
 * middle, each on a double-acting gravity hinge at its jamb.
 *
 * The doorway stands in the `XY` plane with its threshold's middle at the
 * origin; the opening is one the maker sizes its doors for, given or drawn from
 * the seed, each leaf half of it, the two meeting at the middle, its foot the
 * drawn gap above the floor. `leftLeaf` and `rightLeaf` are the hinges on the
 * `+X` and `-X` jambs; a positive travel swings a leaf out toward `+Z` up to
 * the hinge's 125 degrees, and a negative one toward `-Z` as far, the hinge's
 * `reverse`, since the double-acting hinge locks open at 125 degrees in either
 * direction. `leftPush` and `rightPush` are the leaves' faces at their middles,
 * where a body pushes through, riding their hinges; `passage` is the opening
 * under the leaves' tops. The doorway's frame is the wall's, not built.
 *
 * @param params The opening and any dimension the author fixes.
 * @param seed The seed that draws the opening when it is not given and every
 *   dimension left free inside its band; absent, the first opening and the
 *   middle of each band.
 * @returns The doors.
 * @throws {AutoMovieArchetypeRefusal} For an opening the maker does not list,
 *   or a fixed dimension outside its band.
 */
export function createSaloonDoor(
  params: createSaloonDoor.IParams = {},
  seed?: number,
): AutoMovieArchetype<createSaloonDoor.Affordance, createSaloonDoor.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createSaloonDoor.Dimension> =
    new AutoMovieArchetypeDrawSession<createSaloonDoor.Dimension>(
      "saloonDoor",
      createSaloonDoor.UNITS,
      seed,
      params,
    );
  const opening: {
    name: createSaloonDoor.Opening | undefined;
    figures: Readonly<Partial<Record<createSaloonDoor.Dimension, number>>>;
  } = draw.model<createSaloonDoor.Opening>(
    "size",
    params.size,
    createSaloonDoor.OPENINGS,
  );
  const d: Record<createSaloonDoor.Dimension, number> = {
    ...draw.dimensions(createSaloonDoor.BANDS),
    opening: opening.figures.opening!,
  };
  const builder: AutoMovieArchetypeBuilder<
    createSaloonDoor.Affordance,
    createSaloonDoor.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `saloon doors for a ${opening.name} opening`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const half: number = d.opening / 2;
  const middle: number = d.gap + d.height / 2;
  for (const [hinge, push, part, sign] of [
    ["leftLeaf", "leftPush", "leaf-left", 1],
    ["rightLeaf", "rightPush", "leaf-right", -1],
  ] as const) {
    builder.box(
      part,
      v(half, d.height, d.thickness),
      v((sign * half) / 2, middle, 0),
      {
        color: "#8a5a2b",
      },
    );
    builder.affordance({
      id: hinge,
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        v(sign * half, middle, d.thickness / 2),
        v(0, sign, 0),
        v(-sign, 0, 0),
      ),
      extent: null,
      travel: SWING,
      reverse: SWING,
      parts: [part],
    });
    builder.affordance({
      id: push,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.facing(
        v((sign * half) / 2, middle, d.thickness / 2),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
      width: half,
      depth: d.height,
      rides: hinge,
    });
  }
  builder.affordance({
    id: "passage",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
    width: d.opening,
    height: d.gap + d.height,
  });
  return builder.build(d.mass);
}

/** Companion types and bands of {@link createSaloonDoor}. */
export namespace createSaloonDoor {
  /**
   * The affordance ids:
   *
   * - `leftLeaf`, `rightLeaf`: the leaves' hinges on `+X` and `-X`, swinging
   *   toward `+Z` and, by their reverse, as far toward `-Z`.
   * - `leftPush`, `rightPush`: the leaves' faces at their middles, riding their
   *   hinges.
   * - `passage`: the doorway's opening under the leaves' tops.
   */
  export type Affordance =
    | "leftLeaf"
    | "rightLeaf"
    | "leftPush"
    | "rightPush"
    | "passage";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `opening`: the doorway's width, both leaves together, its model's.
   * - `height`: a leaf's height; `thickness`: its thickness.
   * - `gap`: the leaves' feet above the floor.
   * - `mass`: both leaves, kilograms.
   */
  export type Dimension = "opening" | "height" | "thickness" | "gap" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    opening: "m",
    height: "m",
    thickness: "m",
    gap: "m",
    mass: "kg",
  };

  /**
   * The doorway openings the maker sizes its doors for: its "30",32",36" Door
   * Opening Sizes".
   */
  export type Opening = "30in" | "32in" | "36in";

  /** Each opening with its width, metres, the default first. */
  export const OPENINGS: Readonly<
    Record<Opening, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "30in": { opening: 30 * AutoMovieArchetypeUnits.INCH },
    "32in": { opening: 32 * AutoMovieArchetypeUnits.INCH },
    "36in": { opening: 36 * AutoMovieArchetypeUnits.INCH },
  };

  /**
   * The parameters: the opening, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "opening">, number>
  > {
    /**
     * The doorway's opening size, which sets `opening`; drawn from the seed
     * when absent.
     */
    size?: Opening;

    /** The model's id, unique in a scene; `saloonDoor` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "opening">, IAutoMovieArchetypeBand>
  > = {
    height: AutoMovieArchetypeBand.metres(
      40 * AutoMovieArchetypeUnits.INCH,
      40 * AutoMovieArchetypeUnits.INCH,
      DOORS,
    ),
    thickness: AutoMovieArchetypeBand.metres(
      0.75 * AutoMovieArchetypeUnits.INCH,
      0.75 * AutoMovieArchetypeUnits.INCH,
      DOORS,
    ),
    gap: AutoMovieArchetypeBand.metres(
      18 * AutoMovieArchetypeUnits.INCH,
      24 * AutoMovieArchetypeUnits.INCH,
      GAP,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      8,
      16,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
