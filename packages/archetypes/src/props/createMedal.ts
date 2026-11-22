import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** A ribbon medal's disc and weight: the recent Olympic medals. */
const MEDAL: string =
  "Olympic medals: Tokyo 2020 85 mm across and up to 556 g, Paris 2024 85 mm and 529 g (organisers' figures seen in search results); smaller ceremony medals down to 70 mm and 450 g provisional";

/** A medal ribbon's hanging length from the neck to the disc. */
const RIBBON: string =
  "a neck ribbon hanging about 0.4 to 0.5 m from the nape to the disc's ring (provisional)";

/**
 * A ribbon medal: a disc on a neck ribbon, presented by the ribbon's top
 * and worn with the disc on the breastbone.
 *
 * It hangs from the origin, the ribbon's top, down `-Y`, the disc's face
 * toward `+Z`. `hold` is where a hand takes the ribbon's top; `wear` is the
 * disc's back, facing `-Z`, the point laid on the wearer's chest.
 *
 * @param params Any dimension the author fixes inside its band, and an optional scene id.
 * @param seed The seed that draws every dimension left free inside its band; absent, the middle of each band.
 * @returns The medal.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modelled, how it hangs and its contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A ribbon of the drawn hang and a disc of the drawn diameter and mass, with the hand's hold and the worn face.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw, build the ribbon and the disc, the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ribbon is one rigid strip, marked provisional.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createMedal(
  params: createMedal.IParams = {},
  seed?: number | string,
): Archetype<createMedal.Affordance, createMedal.Dimension> {
  const draw: ArchetypeDrawSession<createMedal.Dimension> = new ArchetypeDrawSession<createMedal.Dimension>(
    "medal",
    createMedal.UNITS,
    seed,
    params,
  );
  const d: Record<createMedal.Dimension, number> = draw.dimensions(createMedal.BANDS);
  const builder: ArchetypeBuilder<createMedal.Affordance, createMedal.Dimension> = new ArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "medal",
    draw,
  });
  const thick: number = 0.008;
  builder.box("ribbon", Vector3.create(0.035, d.ribbon, 0.002), Vector3.create(0, -d.ribbon / 2, 0), {
    color: "#1f4fa3",
  });
  builder.rod(
    "disc",
    d.diameter / 2,
    Vector3.create(0, -d.ribbon - d.diameter / 2, -thick / 2),
    Vector3.create(0, -d.ribbon - d.diameter / 2, thick / 2),
    { color: "#c9a227" },
  );
  builder.affordance({
    id: "hold",
    kind: "handle",
    frame: ArchetypeFrame.facing(Vector3.create(0, -0.02, 0), Vector3.create(0, 0, 1), Vector3.create(0, 1, 0)),
    extent: null,
    grip: "pinch",
    aperture: 0.002,
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, -d.ribbon - d.diameter / 2, -thick / 2),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createMedal}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each dimension and contact states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and sourced bands.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the producer and its callers read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The bands are the organisers' figures; the ribbon's hang is provisional.
 */
export namespace createMedal {
  /** The contacts: the ribbon's top a hand takes, and the disc's worn back. */
  export type Affordance = "hold" | "wear";

  /** The dimensions the author may fix inside their bands. */
  export type Dimension = "diameter" | "ribbon" | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    diameter: "m",
    ribbon: "m",
    mass: "kg",
  };

  /** The dimensions fixed by the author, and an optional scene id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the family name. */
    id?: string;
  }

  /** The sourced bands. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    diameter: ArchetypeBand.metres(0.07, 0.085, MEDAL),
    ribbon: ArchetypeBand.metres(0.4, 0.5, RIBBON),
    mass: ArchetypeBand.of("kg", 0.45, 0.556, MEDAL),
  };
}
