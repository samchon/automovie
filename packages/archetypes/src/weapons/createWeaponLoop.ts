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

/** The wall of the loop or the sleeve round its opening, metres: an estimate. */
const WALL: number = 0.008;

/**
 * A carrier worn on the body (`IHumanProp.worn`) for a club: a belt loop a
 * baton hangs through, or a back sleeve a bat stands in.
 *
 * It stands on its lower end at the origin, its opening straight up along `+Y`:
 * a belt loop is a short square ring under a strap up to the belt, a back
 * sleeve a long square channel with the strap at its middle. `socket` is the
 * opening's top, facing up: the club stands grip up through it, drawn out
 * upward by its grip. `belt` is where the strap meets the wearer, facing the
 * body on `-X`.
 *
 * @param params The kind, a belt loop's ring and any dimension the author
 *   fixes.
 * @param seed The seed that picks the ring left free and draws every dimension
 *   left free inside its band; absent, the first ring and the middle of each
 *   band.
 * @returns The carrier.
 * @throws {AutoMovieArchetypeRefusal} For a ring not of the kind, a fixed
 *   dimension outside its band, or one the ring gives.
 */
export function createWeaponLoop(
  params: createWeaponLoop.IParams,
  seed?: number,
): AutoMovieArchetype<createWeaponLoop.Affordance, createWeaponLoop.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createWeaponLoop.Dimension> =
    new AutoMovieArchetypeDrawSession<createWeaponLoop.Dimension>(
      "weaponLoop",
      createWeaponLoop.UNITS,
      seed,
      params,
    );
  const kind: createWeaponLoop.Kind = ArchetypeDraw.choice(
    "weaponLoop",
    "kind",
    params.kind,
    createWeaponLoop.KINDS,
  );
  // A belt loop's ring is one of the three read rings whole; a back sleeve has no read model, its bands.
  const model: {
    figures: Readonly<Partial<Record<createWeaponLoop.Dimension, number>>>;
  } = draw.model<createWeaponLoop.Model>(
    "model",
    params.model,
    createWeaponLoop.MODELS[kind],
  );
  const d: Partial<Record<createWeaponLoop.Dimension, number>> = {
    ...draw.dimensions(createWeaponLoop.BANDS[kind], createWeaponLoop.BANDS),
    ...model.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    createWeaponLoop.Affordance,
    createWeaponLoop.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "leather",
    id: params.id,
    name: kind === "belt" ? "belt loop" : "back sleeve",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const half: number = (d.aperture! + WALL) / 2;
  const span: number = d.aperture! + 2 * WALL;
  for (const [id, size, at] of [
    ["wallFront", v(span, d.length!, WALL), v(0, d.length! / 2, half)],
    ["wallBack", v(span, d.length!, WALL), v(0, d.length! / 2, -half)],
    ["wallLeft", v(WALL, d.length!, d.aperture!), v(half, d.length! / 2, 0)],
    ["wallRight", v(WALL, d.length!, d.aperture!), v(-half, d.length! / 2, 0)],
  ] as const)
    builder.box(id, size, at, { color: "#3a2a1e" });
  // The strap toward the wearer: up to the belt over a loop, along the
  // middle of a sleeve.
  const strap: number = createWeaponLoop.STRAP[kind];
  const side: number = -(span / 2 + WALL / 2);
  const middle: number =
    kind === "belt" ? d.length! + strap / 2 : d.length! / 2;
  builder.box("strap", v(WALL, strap, 0.04), v(side, middle, 0), {
    color: "#3a2a1e",
  });
  builder.affordance({
    id: "socket",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.length!, 0)),
    extent: null,
  });
  builder.affordance({
    id: "belt",
    kind: "hook",
    frame: AutoMovieArchetypeFrame.facing(
      v(side - WALL / 2, kind === "belt" ? d.length! + strap : middle, 0),
      v(-1, 0, 0),
      v(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}

/** Companion types, constants and bands of {@link createWeaponLoop}. */
export namespace createWeaponLoop {
  /**
   * The kinds: a belt loop a baton hangs through, a back sleeve a bat stands
   * in.
   */
  export type Kind = "belt" | "back";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["belt", "back"];

  /** The strap's length, metres, by kind: estimates. */
  export const STRAP: Readonly<Record<Kind, number>> = {
    belt: 0.08,
    back: 0.2,
  };

  /**
   * The affordance ids:
   *
   * - `socket`: the opening's top, facing up.
   * - `belt`: where the strap meets the wearer, facing the body on `-X`.
   */
  export type Affordance = "socket" | "belt";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `aperture`: the opening across, inside the walls.
   * - `length`: the walls' height, the ring's or the sleeve's.
   * - `mass`: kilograms.
   */
  export type Dimension = "aperture" | "length" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    aperture: "m",
    length: "m",
    mass: "kg",
  };

  /** The read baton rings: Safariland's 692S, Rothco's and High Speed Gear's. */
  export type Model = "safariland692s" | "rothco" | "highSpeedGear";

  /**
   * Each kind's rings whole, the default first, by their opening inside:
   * Safariland 692S 35 mm
   * (https://varusteleka.com/en-us/products/safariland-model-692s-baton-ring-unissued),
   * Rothco 1.5 in
   * (https://rothco.com/product/rothco-two-ring-baton-flashlight-holder) and
   * High Speed Gear 1.5 in
   * (https://www.highspeedgear.com/products/duty-baton-ring-holder); a back
   * sleeve has none.
   */
  export const MODELS: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    belt: {
      safariland692s: { aperture: 0.035 },
      rothco: { aperture: 1.5 * AutoMovieArchetypeUnits.INCH },
      highSpeedGear: { aperture: 1.5 * AutoMovieArchetypeUnits.INCH },
    },
  };

  /**
   * The parameters: the kind, a belt loop's ring, and any free dimension fixed
   * to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which carrier. */
    kind: Kind;

    /**
     * Which of the read rings a belt loop is; picked from the seed when absent.
     * A back sleeve has none.
     */
    model?: Model;

    /** The model's id, unique in a scene; `weaponLoop` when absent. */
    id?: string;
  }

  /** The band of each free dimension a ring leaves, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    belt: {
      length: AutoMovieArchetypeBand.metres(
        0.025,
        0.04,
        "a ring's depth; the rings' pages read do not give it",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.05,
        0.12,
        "the rings' pages read give no weight",
        true,
      ),
    },
    back: {
      aperture: AutoMovieArchetypeBand.metres(
        0.075,
        0.09,
        "wider than a bat's barrel, at most 2.61 in across by the Official Baseball Rules 2024, 3.02(a); no bat sleeve's size was found",
        true,
      ),
      length: AutoMovieArchetypeBand.metres(
        0.25,
        0.35,
        "a sleeve holding a bat's barrel; no bat sleeve's size was found",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.2,
        0.5,
        "no bat sleeve's weight was found",
        true,
      ),
    },
  };
}
