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

/** The maker's ropes read. */
const ROGUE: string =
  "Rogue SR-1 bearing speed ropes: a coated 3/32 in cable of 120 in, or 10 and 11 ft, handles of 5.25 (SR-1S), 6.75 (SR-1) and 7.5 in (SR-1L), tapering to a 7/8 in grip (https://www.roguecanada.ca/rogue-bearing-speed-rope, https://www.roguefitness.com/ca/sr-1s-short-handle-bearing-speed-rope-color-series, https://www.rogueeurope.eu/rogue-sr-1-l-long-handle-speed-rope-eu?locale=en)";

/** One read cable's or handle's figures, metres. */
type Figures = Readonly<Partial<Record<createJumpRope.Dimension, number>>>;

/**
 * A skipping rope:two handles joined by a cord, laid straight on the floor.
 *
 * It lies along `X` centred over the origin, a handle at each end and the cord
 * between them. `leftGrip` (at `+X`) and `rightGrip` (at `-X`) are the handles,
 * taken from above, each along `X`; the cord is rigid and straight here, its
 * swing the act's.
 *
 * @param params The cable, the handle and any dimension the author fixes.
 * @param seed The seed that draws the cable and the handle when they are not
 *   given and every dimension left free inside its band; absent, the first of
 *   each and the middle of each band.
 * @returns The rope.
 * @throws {AutoMovieArchetypeRefusal} For a cable or handle Rogue does not
 *   list, or a fixed dimension outside its band.
 */
export function createJumpRope(
  params: createJumpRope.IParams = {},
  seed?: number,
): AutoMovieArchetype<createJumpRope.Affordance, createJumpRope.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createJumpRope.Dimension> =
    new AutoMovieArchetypeDrawSession<createJumpRope.Dimension>(
      "jumpRope",
      createJumpRope.UNITS,
      seed,
      params,
    );
  /** One of Rogue's lists, given or picked whole. */
  const pick = <Name extends string>(
    axis: string,
    given: Name | undefined,
    models: Readonly<Record<Name, Figures>>,
  ): { name: Name | undefined; figures: Figures } =>
    draw.model<Name>(axis, given, models);
  const cable: { name: createJumpRope.Cable | undefined; figures: Figures } =
    pick("cable", params.cable, createJumpRope.CABLES);
  const handle: { name: createJumpRope.Handle | undefined; figures: Figures } =
    pick("handle", params.handle, createJumpRope.HANDLES);
  const d: Record<createJumpRope.Dimension, number> = {
    ...draw.dimensions(createJumpRope.BANDS),
    length: cable.figures.length!,
    handleLength: handle.figures.handleLength!,
  };
  const builder: AutoMovieArchetypeBuilder<
    createJumpRope.Affordance,
    createJumpRope.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `skipping rope ${handle.name}, ${cable.name} cable`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const r: number = d.gripDiameter / 2;
  const inner: number = d.length / 2;
  const end: number = inner + d.handleLength;
  builder.rod(
    "cord",
    createJumpRope.CORD / 2,
    v(-inner, r, 0),
    v(inner, r, 0),
    {
      color: "#d4a017",
    },
  );
  for (const [id, part, sign] of [
    ["leftGrip", "leftHandle", 1],
    ["rightGrip", "rightHandle", -1],
  ] as const) {
    builder.rod(part, r, v(sign * inner, r, 0), v(sign * end, r, 0), {
      color: "#2c2f33",
    });
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.upright(
        v((sign * (inner + end)) / 2, r, 0),
      ),
      extent: null,
      grip: "power",
      aperture: d.gripDiameter,
      length: d.handleLength,
    });
  }
  return builder.build(d.mass);
}

/** Companion types, constants and bands of {@link createJumpRope}. */
export namespace createJumpRope {
  /** The cable's diameter, metres: the maker's 3/32 in (see the source). */
  export const CORD: number = (3 / 32) * AutoMovieArchetypeUnits.INCH;

  /**
   * The affordance ids:
   *
   * - `leftGrip`, `rightGrip`: the handles at `+X` and `-X`, taken from above.
   */
  export type Affordance = "leftGrip" | "rightGrip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: the cable's, between the handles.
   * - `handleLength`, `gripDiameter`: each handle's.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "handleLength" | "gripDiameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    handleLength: "m",
    gripDiameter: "m",
    mass: "kg",
  };

  /** Rogue's cable lengths. */
  export type Cable = "10ft" | "11ft";

  /**
   * Each cable's length, metres, the default first: Rogue's "cable of 120 in,
   * or 10 and 11 ft".
   */
  export const CABLES: Readonly<
    Record<Cable, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "10ft": { length: 120 * AutoMovieArchetypeUnits.INCH },
    "11ft": { length: 11 * AutoMovieArchetypeUnits.FOOT },
  };

  /** Rogue's SR-1 handles. */
  export type Handle = "SR-1" | "SR-1S" | "SR-1L";

  /**
   * Each handle's length, metres, the default first: Rogue's "handles of 5.25
   * (SR-1S), 6.75 (SR-1) and 7.5 in (SR-1L)".
   */
  export const HANDLES: Readonly<
    Record<Handle, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "SR-1": { handleLength: 6.75 * AutoMovieArchetypeUnits.INCH },
    "SR-1S": { handleLength: 5.25 * AutoMovieArchetypeUnits.INCH },
    "SR-1L": { handleLength: 7.5 * AutoMovieArchetypeUnits.INCH },
  };

  /**
   * The parameters: the cable, the handle, and any free dimension fixed to a
   * value inside its band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "length" | "handleLength">, number>
  > {
    /** Rogue's cable; drawn from the seed when absent. */
    cable?: Cable;

    /** Rogue's handle; drawn from the seed when absent. */
    handle?: Handle;

    /** The model's id, unique in a scene; `jumpRope` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<
    Record<
      Exclude<Dimension, "length" | "handleLength">,
      IAutoMovieArchetypeBand
    >
  > = {
    gripDiameter: AutoMovieArchetypeBand.metres(
      0.875 * AutoMovieArchetypeUnits.INCH,
      0.875 * AutoMovieArchetypeUnits.INCH,
      ROGUE,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.1,
      0.3,
      "the Rogue pages read give no weight",
      true,
    ),
  };
}
