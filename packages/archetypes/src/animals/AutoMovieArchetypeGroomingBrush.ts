import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/**
 * The two body brushes read: Kerbl's Covalliero, 17 x 8 cm with 3 cm bristles
 * (kerbl.com product 13839), and Shires' EZI-Groom Premium, 200 x 85 mm with 25
 * mm bristles (equusnow.com listing).
 */
const SOURCE: string =
  "Kerbl Covalliero horse brush 17 x 8 cm, 3 cm bristles; Shires EZI-Groom Premium body brush 200 x 85 mm, 25 mm bristles";

/** The brush's back thickness, metres: authored, neither listing gives it. */
const BACK: number = 0.02;

/** The brush's mass, kilograms: authored, neither listing gives it. */
const MASS: number = 0.2;

/** Constructs the grooming brush archetype from its recipe. */
export namespace AutoMovieArchetypeGroomingBrush {
/**
 * A horse's body brush: a flat wooden back held in the palm and a block of
 * bristles under it.
 *
 * The brush lies with its back up and its bristles down, its length along `+Z`.
 * The hand holds it over its back, the palm facing down onto it, so the
 * bristles face the way the palm does: `grip` is the back's top, facing up, and
 * `face` is the bristles' working face, facing down. Its length, width and
 * bristle depth are drawn from the two body brushes read; its back thickness
 * and mass are authored.
 *
 * @param params Any dimension the author fixes, and the model's id.
 * @param seed The seed that draws each free dimension inside its band; absent,
 *   each takes its band's middle.
 * @returns The brush.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeGroomingBrush.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeGroomingBrush.Affordance,
  AutoMovieArchetypeGroomingBrush.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeGroomingBrush.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeGroomingBrush.Dimension>(
      "groomingBrush",
      AutoMovieArchetypeGroomingBrush.UNITS,
      seed,
      params,
    );
  const d: Partial<Record<AutoMovieArchetypeGroomingBrush.Dimension, number>> =
    draw.dimensions(AutoMovieArchetypeGroomingBrush.BANDS);
  const length: number = d.length!;
  const width: number = d.width!;
  const bristle: number = d.bristle!;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeGroomingBrush.Affordance,
    AutoMovieArchetypeGroomingBrush.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "body brush",
    draw,
  });
  builder.box(
    "bristles",
    Vector3.create(width, bristle, length),
    Vector3.create(0, bristle / 2, 0),
    { color: "#c9b48a" },
  );
  builder.box(
    "back",
    Vector3.create(width, BACK, length),
    Vector3.create(0, bristle + BACK / 2, 0),
    { color: "#7a4a2a" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, bristle + BACK, 0),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: BACK,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, -1, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(MASS);
}
}

/** Companion types and bands of {@link createGroomingBrush}. */
export namespace AutoMovieArchetypeGroomingBrush {
  /**
   * The contacts: `grip`, the back's top the palm lies on, facing up; `face`,
   * the bristles' working face, facing down.
   */
  export type Affordance = "grip" | "face";

  /**
   * The dimensions, metres: the brush's `length`, its `width` and its `bristle`
   * depth.
   */
  export type Dimension = "length" | "width" | "bristle";

  /** The parameters: any dimension fixed inside its band, and the model's id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `groomingBrush` when absent. */
    id?: string;
  }

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    bristle: "m",
  };

  /** Each dimension's band, between the two brushes read. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(0.17, 0.2, SOURCE),
    width: AutoMovieArchetypeBand.metres(0.08, 0.085, SOURCE),
    bristle: AutoMovieArchetypeBand.metres(0.025, 0.03, SOURCE),
  };
}
