import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The British service musket ball, seen only in search results. */
const BALL: string =
  "British service musket ball, 14 to the pound, about .693 in; 184 excavated balls .66 to .72 in across (Warwick Beacon, Bullets fit for his gun, https://warwickonline.com/stories/bullets-fit-for-his-gun-ammunition-at-the-outbreak-of-the-revolution,250683), seen only in search results";

/** Two crossbow bolts, read in museum records. */
const BOLT: string =
  "Nationaal Militair Museum inv. 11461, bolt 360 mm, head 77 mm, shaft 13.6 mm across (https://collectie.nmm.nl/nl/collectie/detail/227252/); Metropolitan Museum 33754, steel and wood (oak, ash), bolt 43.7 cm, head 6.6 by 1.9 cm, 74 g (https://collectionapi.metmuseum.org/public/collection/v1/objects/33754)";

/** War arrows, read in a bowyers' study that draws on the Mary Rose Trust's records, their shafts' thickness at its upper end seen only in search results. */
const ARROW: string =
  "Aston and Spencer, The Deane brother's Mary Rose Bow X1-3: Mary Rose arrows mostly 715 to 854 mm long, of aspen or poplar; the Westminster Abbey arrow 11 mm across at the shoulder and 50 g, Mary Rose arrow AZ472/19 62.5 g (https://keskustelu.primitiivijousi.fi/uploads/short-url/jbxr7WWexChfC3RBxRL26IK9gxF.pdf, pp. 27-29); Mary Rose shafts 12 to 13 mm at their thickest, seen only in search results";

/** Field gun round shot, read in a period manual. */
const SHOT_TABLE: string =
  'Roberts, Hand-book of Artillery (1863), solid shot "a solid sphere of cast-iron", 3.58 in across and 6.1 lb for the 6-pdr. field gun, 4.52 in and 12.3 lb for the 12-pdr. (https://gutenberg.org/cache/epub/71575/pg71575.txt)';

/** The M67 grenade, read in its Army data sheet. */
const M67: string =
  "TM 43-0001-29 (1994), M67 fragmentation grenade: a 2.5 in steel sphere, 3.53 in long at most with its fuze, 14 oz, a 4 to 5 s fuze delay (https://dn760003.eu.archive.org/0/items/milmanual-tm-43-0001-29-army-ammunition-data-sheets-for-grenades/tm-43-0001-29_army_ammunition_data_sheets_for_grenades.pdf)";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createProjectile.Kind, string>> = {
  ball: "musket ball",
  arrow: "arrow",
  bolt: "crossbow bolt",
  roundShot: "round shot",
  grenade: "hand grenade",
};

/**
 * Something a weapon launches or a hand throws: a musket ball, an arrow, a crossbow bolt, a field gun's round shot or a hand grenade.
 *
 * A ball and a shot rest on the floor of their own space on their lowest point; `body` is the ball pinched between the fingers or the shot taken in two hands. A grenade rests on its body with its fuze up, its `body` closed round in one hand; its pin and lever wait for a source of their size and pull, and its 4 to 5 s fuze delay is its data sheet's, for the throw that reads it. An arrow or a bolt stands along `+Y` from its butt at the origin to its point: `shaft` is its shaft, held anywhere along it; `nock` is its butt, facing down along it, which sits on a bow's or a crossbow's string; `tip` is its point, `+Y` along it. An arrow's and a bolt's shaft is wood, a bolt's head steel, and a shot and a grenade iron or steel, as their records state; each rests on that material, an arrow and a bolt on the wooden butt of its shaft, so its body's friction is that material's on concrete; a ball's lead has no measured pair, so its body keeps the 0.5 friction placeholder. A projectile is an ordinary archetype: it moves only by a grip or a flight, never by itself, and its flight data (drag, restitution, embedding) is the model body's that #3479 adds. The cartridge of #3482 waits for the sizes its contacts need, listed in the sources record.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The projectile.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each projectile rests or stands, how it is held, and what waits.
 * @evidence contracts/development/implementation.md#principled-implementation A ball of the drawn calibre, a pound over the service count in mass; an arrow as its read shaft at its read whole mass; a bolt as its read shaft with a head of the read length drawn round at the read head width; a grenade as the data sheet's sphere with its fuze standing to the data sheet's length; a shot of the drawn diameter whose mass is the 6-pdr.'s read 6.1 lb scaled by the cube of its diameter over 3.58 in, as a solid sphere's is, which gives the 12-pdr.'s read 12.3 lb within a tenth of a pound.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then one branch per kind: its parts and its contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An arrow's or a bolt's fletching, an arrow's head and a bolt head's facets are not drawn; no contact reads them.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createProjectile(
  params: createProjectile.IParams,
  seed?: number | string,
): Archetype<createProjectile.Affordance, createProjectile.Dimension> {
  const kind: createProjectile.Kind = ArchetypeDraw.choice(
    "projectile",
    "kind",
    params.kind,
    createProjectile.KINDS,
  );
  const d: Partial<Record<createProjectile.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "projectile",
      createProjectile.BANDS[kind],
      seed,
      params,
      createProjectile.BANDS,
    );
  const builder: ArchetypeBuilder<
    createProjectile.Affordance,
    createProjectile.Dimension
  > = new ArchetypeBuilder({
    archetype: "projectile",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;

  if (kind === "bolt" || kind === "arrow") {
    const length: number = d.length!;
    const head: number = kind === "bolt" ? d.head! : 0;
    const r: number = d.diameter! / 2;
    builder.rod("shaft", r, v(0, 0, 0), v(0, length - head, 0), {
      color: "#b98d5b",
      surface: "wood",
    });
    if (kind === "bolt")
      builder.rod(
        "head",
        createProjectile.BOLT_HEAD_WIDTH / 2,
        v(0, length - head, 0),
        v(0, length, 0),
        { color: "#55595f", density: 8, surface: "steel" },
      );
    builder.affordance({
      id: "shaft",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(0, (length - head) / 2, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: 2 * r,
      length: length - head,
    });
    builder.affordance({
      id: "nock",
      kind: "socket",
      frame: ArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
      extent: null,
    });
    builder.affordance({
      id: "tip",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.upright(v(0, length, 0)),
      extent: null,
    });
    return builder.build(d.mass!, { rests: "wood" });
  }

  // A sphere: a ball pinched, a shot taken in two hands, a grenade's body in one hand with its fuze on top.
  if (kind === "grenade") {
    const top: number = d.length!;
    builder.rod(
      "fuze",
      d.diameter! * createProjectile.FUZE,
      v(0, d.diameter!, 0),
      v(0, top, 0),
      { color: "#3f4a3a" },
    );
  }
  const r: number = d.diameter! / 2;
  builder.ball(kind, r, v(0, r, 0), {
    color: "#6f6f72",
    ...(kind === "ball" ? {} : { surface: "steel" as const }),
  });
  builder.affordance({
    id: "body",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, r, 0), v(-1, 0, 0), v(0, 1, 0)),
    extent: null,
    grip:
      kind === "ball" ? "precision" : kind === "grenade" ? "power" : "two-hand",
    aperture: d.diameter!,
  });

  // A shot's mass: the 6-pdr.'s, scaled by the cube of its diameter, as a solid iron sphere's scales.
  const mass: number =
    kind !== "roundShot"
      ? d.mass!
      : createProjectile.SHOT.mass *
        (d.diameter! / createProjectile.SHOT.diameter) ** 3;
  return builder.build(mass, kind === "ball" ? undefined : { rests: "steel" });
}

/**
 * Companion types, constants and bands of {@link createProjectile}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of projectiles, named for what they are, never for a period or a film; calibre is a dimension, and a shot's mass follows its calibre.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The body or shaft a hand takes, an arrow's and a bolt's nock and point (#3482); flight data belongs to the model body (#3479).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No kind is built whose contacts lack a source; the head's steel density factor only places the balance, as `createPolearm`'s does.
 */
export namespace createProjectile {
  /** The kinds: a musket ball, an arrow, a crossbow bolt, a field gun's round shot and a hand grenade. */
  export type Kind = "ball" | "arrow" | "bolt" | "roundShot" | "grenade";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "ball",
    "arrow",
    "bolt",
    "roundShot",
    "grenade",
  ];

  /** A grenade fuze's radius as a share of the body's diameter: a construction estimate that no act reads and no band declares; the fuze's height is the data sheet's length less the body. */
  export const FUZE: number = 0.25;

  /** A bolt head's width, metres: the Met bolt's 1.9 cm, its head drawn round at that width. */
  export const BOLT_HEAD_WIDTH: number = 0.019;

  /** The 6-pdr. shot a round shot's mass scales from: 3.58 in and 6.1 lb, Roberts (1863). */
  export const SHOT: Readonly<{ diameter: number; mass: number }> = {
    diameter: 3.58 * 0.0254,
    mass: 6.1 * 0.4536,
  };

  /**
   * The affordance ids:
   *
   * - `body`: a ball, a shot or a grenade's body, taken from `-X`.
   * - `shaft`: an arrow's or a bolt's shaft, taken from `-Z` anywhere along it.
   * - `nock`: an arrow's or a bolt's butt, facing down along it.
   * - `tip`: an arrow's or a bolt's point, `+Y` along it.
   */
  export type Affordance = "body" | "shaft" | "nock" | "tip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `diameter`: a ball's, a shot's or a grenade's body across, an arrow's or a bolt's shaft across.
   * - `length`: an arrow's or a bolt's, butt to point; a grenade's, base to fuze top.
   * - `head`: a bolt's head along it.
   * - `mass`: a ball's, an arrow's, a bolt's or a grenade's, kilograms; a shot's follows its diameter.
   */
  export type Dimension = "diameter" | "length" | "head" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which projectile. */
    kind: Kind;

    /** The model's id, unique in a scene; `projectile` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    ball: {
      diameter: ArchetypeBand.metres(0.66 * 0.0254, 0.72 * 0.0254, BALL, true),
      mass: ArchetypeBand.of(
        "kg",
        0.4536 / 14,
        0.4536 / 14,
        `${BALL}: a pound over fourteen`,
        true,
      ),
    },
    arrow: {
      length: ArchetypeBand.metres(0.715, 0.854, ARROW),
      diameter: ArchetypeBand.metres(0.011, 0.013, ARROW, true),
      mass: ArchetypeBand.of("kg", 0.05, 0.0625, ARROW),
    },
    bolt: {
      length: ArchetypeBand.metres(0.36, 0.437, BOLT),
      head: ArchetypeBand.metres(0.066, 0.077, BOLT),
      diameter: ArchetypeBand.metres(0.0136, 0.0136, BOLT),
      mass: ArchetypeBand.of("kg", 0.074, 0.074, BOLT),
    },
    roundShot: {
      diameter: ArchetypeBand.metres(3.58 * 0.0254, 4.52 * 0.0254, SHOT_TABLE),
    },
    grenade: {
      diameter: ArchetypeBand.metres(2.5 * 0.0254, 2.5 * 0.0254, M67),
      length: ArchetypeBand.metres(3.53 * 0.0254, 3.53 * 0.0254, M67),
      mass: ArchetypeBand.of("kg", 14 * 0.02835, 14 * 0.02835, M67),
    },
  };
}
