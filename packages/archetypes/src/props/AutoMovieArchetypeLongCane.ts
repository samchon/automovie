import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** A rigid long cane's lengths, read at a maker's listing. */
const LENGTH: string =
  "Ambutech rigid fiberglass long cane with a pencil tip, available in lengths from 36 to 60 in (Maxi Aids listing); fitted to the sternum (Kim, Wall Emerson and Naghshineh 2017's standard length)";

/** The shaft's diameter, provisional. */
const SHAFT: string = "a 13 mm fiberglass shaft, provisional";

/** A long cane's mass, provisional. */
const MASS: string =
  "about 0.2 kg for a rigid fiberglass long cane, provisional";

/** Constructs the long cane archetype from its recipe. */
export namespace AutoMovieArchetypeLongCane {
/**
 * A long white cane: a straight rigid shaft swept ahead of a blind traveller's
 * feet, held at its grip at the top and touching the floor at its tip (#3994).
 *
 * It lies along `+Y` from its tip at the origin to its top. `tip` is the floor
 * contact facing down; `grip` is the handle below the top, its `+X` along the
 * shaft, where the hand holds it as a pencil-like extension of the index
 * finger.
 *
 * @param params Any dimension the author fixes inside its band, and an optional
 *   scene id.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, the middle of each band.
 * @returns The cane.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeLongCane.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLongCane.Affordance, AutoMovieArchetypeLongCane.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeLongCane.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeLongCane.Dimension>(
      "longCane",
      AutoMovieArchetypeLongCane.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeLongCane.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeLongCane.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeLongCane.Affordance,
    AutoMovieArchetypeLongCane.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "long cane",
    draw,
  });
  const r: number = d.diameter / 2;
  const grip: number = d.length - AutoMovieArchetypeLongCane.GRIP / 2;
  builder.rod("shaft", r, Vector3.create(0, 0, 0), Vector3.create(0, 0.25, 0), {
    color: "#c0262d",
  });
  builder.rod(
    "white",
    r,
    Vector3.create(0, 0.25, 0),
    Vector3.create(0, d.length - AutoMovieArchetypeLongCane.GRIP, 0),
    { color: "#f2f2f2" },
  );
  builder.rod(
    "handle",
    r * 1.4,
    Vector3.create(0, d.length - AutoMovieArchetypeLongCane.GRIP, 0),
    Vector3.create(0, d.length, 0),
    { color: "#202020" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, grip, 0),
      Vector3.create(0, 0, 1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 2.8 * r,
    length: AutoMovieArchetypeLongCane.GRIP,
  });
  builder.affordance({
    id: "tip",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, -1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

  /** The contacts: the grip the hand holds and the floor tip. */
  export type Affordance = "grip" | "tip";

  /** The dimensions the author may fix inside their bands. */
  export type Dimension = "length" | "diameter" | "mass";

  /** The grip's length along the shaft, metres (provisional: a hand's breadth). */
  export const GRIP: number = 0.2;

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    mass: "kg",
  };

  /** The dimensions fixed by the author, and an optional scene id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the family name. */
    id?: string;
  }

  /** The sourced bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(
      36 * AutoMovieArchetypeUnits.INCH,
      60 * AutoMovieArchetypeUnits.INCH,
      LENGTH,
    ),
    diameter: AutoMovieArchetypeBand.metres(0.013, 0.013, SHAFT),
    mass: AutoMovieArchetypeBand.of("kg", 0.2, 0.2, MASS),
  };
}
