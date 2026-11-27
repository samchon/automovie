import { AutoMovieEngineRandom, Vector3 } from "@automovie/engine";

import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { irregularRockForm } from "./irregularRockForm";

/** The Udden-Wentworth size classes, read in a university textbook. */
const WENTWORTH: string =
  "Udden-Wentworth grain-size scale: cobble 64 to 256 mm, boulder 256 mm and up, its small to medium classes 256 to 1024 mm (Earle, Physical Geology 2nd ed., BCcampus, 6.1, https://opentextbc.ca/physicalgeology2ed/chapter/6-1-clastic-sedimentary-rocks/)";

/** Granite's bulk density, read. */
const GRANITE: string =
  "granite's dry bulk density, 2.66 g/cm3 with a standard deviation of 0.06 over 334 samples (Encyclopaedia Britannica, Rock: physical properties, https://www.britannica.com/science/rock-geology/Physical-properties)";

/** Constructs the rock archetype from its recipe. */
export namespace AutoMovieArchetypeRock {
/**
 * A loose stone: a cobble a hand picks up, or a boulder a person sits on, hides
 * behind or climbs.
 *
 * By default its form is `irregular`: one seeded convex hull
 * ({@link irregularRockForm}) resting on a flat base at the origin, its largest
 * horizontal extent along X and equal to the drawn diameter. `form: "ball"`
 * draws the earlier form, a ball of the drawn diameter resting on its lowest
 * point at the origin. Its mass is its volume at the drawn specific gravity, so
 * a bigger stone is heavier by the cube of its size. A cobble's `grip` closes
 * one hand round it from `-X` at its centroid, with an aperture of its whole X
 * extent; a boulder's `top` is its highest point, facing up, where a person
 * sits or stands, and its `side` is where a `+Z` ray at half height leaves it,
 * facing out, where one leans or crouches behind it. Its surface is stone,
 * granite's, and it rests on that stone, so its body's friction is stone's on
 * concrete.
 *
 * @param params The kind, the form and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band and
 *   the irregular form; absent, each dimension takes the middle of its band and
 *   the form is seed 0's.
 * @returns The stone.
 * @throws {AutoMovieArchetypeRefusal} For a kind or form it does not make, or a
 *   fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeRock.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeRock.Affordance, AutoMovieArchetypeRock.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeRock.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeRock.Dimension>(
      "rock",
      AutoMovieArchetypeRock.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeRock.Kind = ArchetypeDraw.choice(
    "rock",
    "kind",
    params.kind,
    AutoMovieArchetypeRock.KINDS,
  );
  const d: Record<AutoMovieArchetypeRock.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeRock.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeRock.Affordance,
    AutoMovieArchetypeRock.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "stone",
    id: params.id,
    name: kind,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const r: number = d.diameter / 2;
  const look: { color: string; surface: "stone" } = {
    color: "#7d7a74",
    surface: "stone",
  };
  let grip: IAutoMovieVector3 = v(0, r, 0);
  let top: IAutoMovieVector3 = v(0, d.diameter, 0);
  let side: IAutoMovieVector3 = v(0, r, r);
  let volume: number = (Math.PI / 6) * d.diameter ** 3;
  const shape: AutoMovieArchetypeRock.Form = ArchetypeDraw.choice(
    "rock",
    "form",
    params.form ?? "irregular",
    AutoMovieArchetypeRock.FORMS,
  );
  if (shape === "irregular") {
    const form: ReturnType<typeof irregularRockForm> = irregularRockForm(
      AutoMovieEngineRandom.deriveSeed(
        AutoMovieEngineRandom.deriveSeed(String(seed ?? 0), "archetype", "rock"),
        "form",
      ),
      d.diameter,
    );
    builder.convex("stone", form.cell, v(0, 0, 0), look);
    grip = form.cell.centroid;
    top = form.top;
    side = form.side;
    volume = form.cell.volume;
  } else builder.ball("stone", r, v(0, r, 0), look);
  if (kind === "cobble")
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(grip, v(-1, 0, 0), v(0, 1, 0)),
      extent: null,
      grip: "power",
      aperture: d.diameter,
    });
  else {
    builder.affordance({
      id: "top",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(top),
      extent: null,
    });
    builder.affordance({
      id: "side",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.facing(side, v(0, 0, 1), v(1, 0, 0)),
      extent: null,
    });
  }

  // Its mass: its volume times its specific gravity times water's 1000 kg per cubic metre.
  return builder.build(volume * d.gravity * 1000, { rests: "stone" });
}
}

/** Companion types, constants and bands of {@link createRock}. */
export namespace AutoMovieArchetypeRock {
  /** The kinds: the Udden-Wentworth cobble and boulder classes. */
  export type Kind = "cobble" | "boulder";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["cobble", "boulder"];

  /** The drawn forms: a seeded irregular convex stone, or the earlier ball. */
  export type Form = "ball" | "irregular";

  /** Every form, for a caller that reads one at run time. */
  export const FORMS: readonly Form[] = ["ball", "irregular"];

  /**
   * The affordance ids:
   *
   * - `grip`: a cobble, closed round from `-X`.
   * - `top`: a boulder's highest point, facing up.
   * - `side`: a boulder's `+Z` face at mid-height, facing out.
   */
  export type Affordance = "grip" | "top" | "side";

  /**
   * The free dimensions:
   *
   * - `diameter`: across, metres.
   * - `gravity`: specific gravity, its density over water's.
   */
  export type Dimension = "diameter" | "gravity";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    gravity: "",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which class. */
    kind: Kind;

    /**
     * The drawn form: `irregular`, a seeded convex stone on a flat base, by
     * default; or `ball`, the earlier sphere resting on one point.
     */
    form?: Form;

    /** The model's id, unique in a scene; `rock` when absent. */
    id?: string;
  }

  /**
   * Granite's specific gravity, its mean density plus and minus one standard
   * deviation over water's 1 g/cm3.
   */
  const GRAVITY: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
    "",
    2.6,
    2.72,
    GRANITE,
  );

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    cobble: {
      diameter: AutoMovieArchetypeBand.metres(0.064, 0.256, WENTWORTH),
      gravity: GRAVITY,
    },
    boulder: {
      diameter: AutoMovieArchetypeBand.metres(0.256, 1.024, WENTWORTH),
      gravity: GRAVITY,
    },
  };
}
