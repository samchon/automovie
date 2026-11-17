import { Vector3 } from "@automovie/engine";
import type { IAutoMovieBodyMeasure } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeRefusal,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import { armourBone } from "./armourBone";

/** The plate thickness read. */
const PLATE: string =
  'Alan Williams, "What can scientific analysis tell us about the effectiveness of medieval arms and armour?", p. 172: "Breastplate thickness between 1.5 and 3 mm corresponds of course to an armour of comfortable weight. The limbs would have been protected with thinner armour." (https://wratislavia.antiqua.uwr.edu.pl/)';

/** The helmet padding read. */
const PAD: string =
  'US Army News Service, 20 April 2011, on combat helmet pads: "The current pad is three-quarters of an inch thick" (https://www.army.mil/article/55275), a modern helmet\'s padding, provisional for a medieval arming cap, whose thickness no source read gives';

/**
 * A piece of armour worn on one bone: a helmet (open, closed or brimmed), a cuirass, a mail shirt, a gauntlet, a vambrace or a greave.
 *
 * A piece is fitted to a body when the author gives the body's measure (`IAutoMovieBodyMeasure`, as the motion laws read the polygon man's): its inside follows the body part it covers, its plate the drawn thickness beyond it, a helmet's padding between the head and the plate. Without a measure it is the read piece as its museum record measures it, a box of its height, width and depth. Either way its mass is its record's. It is built centred on the body part it covers, `+Y` up the segment, and `wear` is that centre, which a worn prop rides on its bone (`createArmour.bone`); a limb piece is the same on either side, and `bone` names the side's bone. A brimmed helmet carries its brim as wide as its record's depth. A plate piece carries a provisional glance angle (`GLANCE`, as `contact.glance`); a mail shirt carries none. Performance flight and melee outcomes do not consume that angle yet.
 *
 * @param params The kind, the read piece, the body's measure, and any dimension the author fixes.
 * @param seed The seed that picks the read piece left free and draws every dimension left free inside its band; absent, the first piece and the middle of each band.
 * @returns The piece.
 * @throws {ArchetypeRefusal} For an unsupported piece or dimension, a missing or invalid body measure used by this kind, or a cuirass whose shoulders are not above its waist.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each kind covers, how it is fitted or left as read, where it is centred and how it rides its bone.
 * @evidence contracts/development/implementation.md#principled-implementation Fitted, each piece's inside is its body part's measure (the head's radius, the chest's breadth and depth between waist and shoulders, a limb's radius over its length) with plate and helmet padding outside it; unfitted, the museum box. Only measures that kind actually uses must be finite and positive, and a cuirass's shoulders must stand above its waist. The mass is the read piece's whole.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the piece, draw the thickness and padding, then one branch per kind's shape, and the `wear` contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each piece is one rigid solid on one bone: lames, a mail shirt's drape and a closed helmet's visor are not drawn, so an open and a closed helmet differ only in their records; a mail shirt is drawn on the body's surface, its rings' thickness unread. A plate piece's body carries the provisional glance angle `GLANCE`; the share of a hit passed to the body is no figure here, since a projectile that stops in the plate hands the wearer its whole momentum, which the hit's outcome computes (#3479), as Krenn, Kalaus and Hall's breastplate stopped a 907 J ball with only a bruise behind it.
 * @evidence contracts/development/implementation.md#efficient-algorithms One or two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createArmour(
  params: createArmour.IParams,
  seed?: number | string,
): Archetype<createArmour.Affordance, createArmour.Dimension> {
  const draw: ArchetypeDrawSession<createArmour.Dimension> =
    new ArchetypeDrawSession<createArmour.Dimension>(
      "armour",
      createArmour.UNITS,
      seed,
      params,
    );
  const kind: createArmour.Kind = ArchetypeDraw.choice(
    "armour",
    "kind",
    params.kind,
    createArmour.KINDS,
  );
  const model: {
    figures: Readonly<Partial<Record<createArmour.Dimension, number>>>;
  } = draw.model<createArmour.Model>(
    "model",
    params.model,
    createArmour.MODELS[kind],
  );
  const d: Partial<Record<createArmour.Dimension, number>> = {
    ...draw.dimensions(createArmour.BANDS[kind], createArmour.BANDS),
    ...model.figures,
  };
  const builder: ArchetypeBuilder<
    createArmour.Affordance,
    createArmour.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: kind,
    material: "steel",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const steel: { color: string; surface: "steel" } = {
    color: "#8f979e",
    surface: "steel",
  };
  const m: Partial<IAutoMovieBodyMeasure> | undefined = params.measure;
  if (m !== undefined) admitMeasure(kind, m);
  const t: number = d.thickness ?? 0;

  if (m === undefined)
    // The read piece as its record measures it.
    builder.box("piece", v(d.width!, d.height!, d.depth!), v(0, 0, 0), steel);
  else if (
    kind === "openHelmet" ||
    kind === "closedHelmet" ||
    kind === "brimmedHelmet"
  ) {
    const r: number = m.headRadius! + d.pad! + t;
    builder.ball("piece", r, v(0, 0, 0), steel);
    if (kind === "brimmedHelmet")
      builder.rod("brim", d.depth! / 2, v(0, 0, 0), v(0, t, 0), steel);
  } else if (kind === "cuirass" || kind === "mail") {
    const height: number =
      kind === "mail" ? d.height! : m.shoulderHeight! - m.waistHeight!;
    builder.box(
      "piece",
      v(m.chestBreadth! + 2 * t, height, m.chestDepth! + 2 * t),
      v(0, 0, 0),
      kind === "mail" ? { color: "#6f757b", surface: "steel" } : steel,
    );
  } else {
    const radius: number =
      kind === "greave" ? m.shankRadius! : m.forearmRadius!;
    const length: number =
      kind === "greave" ? m.shank! : kind === "vambrace" ? m.forearm! : m.hand!;
    builder.rod(
      "piece",
      radius + t,
      v(0, -length / 2, 0),
      v(0, length / 2, 0),
      steel,
    );
  }
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: ArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
  });
  // Plate publishes provisional glance metadata; current flight/melee outcomes do not consume it. Mail declares none.
  return builder.build(d.mass!, {
    rests: "steel",
    ...(kind === "mail" ? {} : { outcome: { glance: createArmour.GLANCE } }),
  });
}

/**
 * Companion types, bands, records and the bone rule of {@link createArmour}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, dimension, record and band states what it is and its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions of kinds and read pieces, each record whole; the thickness and padding as cited bands; a body's measure as the interface's own record, so the producer fits any body the motion laws read.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The piece, its `wear` place and the bone it rides (#3500).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No piece is sized by a guess: unfitted it is its record's box, fitted its body's measure; a helmet's padding is a modern pad's and the plate's glance angle a quoted test's, both marked provisional.
 */
export namespace createArmour {
  /** The kinds of piece. */
  export type Kind =
    | "openHelmet"
    | "closedHelmet"
    | "brimmedHelmet"
    | "cuirass"
    | "mail"
    | "gauntlet"
    | "vambrace"
    | "greave";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "openHelmet",
    "closedHelmet",
    "brimmedHelmet",
    "cuirass",
    "mail",
    "gauntlet",
    "vambrace",
    "greave",
  ];

  /** The affordance id: `wear`, the centre of the body part the piece covers, `+Y` up the segment, where it rides its bone. */
  export type Affordance = "wear";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`, `width`, `depth`: the read piece's, as its record measures it; a mail shirt's height is its length.
   * - `thickness`: the plate's.
   * - `pad`: a helmet's padding inside its plate.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "height"
    | "width"
    | "depth"
    | "thickness"
    | "pad"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    height: "m",
    width: "m",
    depth: "m",
    thickness: "m",
    pad: "m",
    mass: "kg",
  };

  /** The read pieces, by their Metropolitan Museum object ids. */
  export type Model =
    | "met26453"
    | "met25388"
    | "met23232"
    | "met26508"
    | "met26512"
    | "met21972"
    | "met22359"
    | "met23084"
    | "met34324"
    | "met22415"
    | "met633538"
    | "met27635"
    | "met23255"
    | "met23256"
    | "met23199"
    | "met24896"
    | "met35850"
    | "met22970"
    | "met22276";

  /** A record's height, width, depth and mass, centimetres and grams. */
  const read = (
    height: number,
    width: number,
    depth: number,
    grams: number,
  ): Readonly<Partial<Record<Dimension, number>>> => ({
    height: height * ArchetypeUnits.CENTIMETRE,
    width: width * ArchetypeUnits.CENTIMETRE,
    depth: depth * ArchetypeUnits.CENTIMETRE,
    mass: grams / 1000,
  });

  /**
   * Each kind's read pieces whole, the default first, as the Metropolitan Museum's records give them (H, W, D, Wt.; https://collectionapi.metmuseum.org/public/collection/v1/objects/{id}):
   *
   * - open helmets: sallets 26453 (24.1, 28.6, 33.7 cm, 2984 g) and 25388 (26.7, 23.5, 39.37 cm, 2769 g);
   * - closed helmets: armet 23232 (29.2, 21.6, 28.6 cm, 2749 g) and close-helmet 26508 (29.8, 22.2, 33.7 cm, 2656 g);
   * - brimmed helmets: cabassets 26512 (27, 23.81, 34.3 cm, 1449 g) and 21972 (25.4, 23.2, 33.5 cm, 1701 g);
   * - cuirasses: 22359, breast and back 35.6 and 36.2 cm high, 30.5 cm wide, 4536 g, its depth not stated, taken as its width; 23084's breastplate 37.5 x 37.5 x 19.5 cm, 3112 g, with its backplate's 2340 g;
   * - mail shirts: 34324 (91.5 cm long, 143 cm wide, 9071.9 g), 22415 (84, 132, 9869 g), 633538 (86.4, 144.8, 7520.6 g) and 27635 (81, 137, 5562 g), their depth not stated, taken as their chest's;
   * - gauntlets: 23255 (29.4, 14.6, 15.9 cm, 793.8 g), 23256 (21, 12.7, 12.4 cm, 300.5 g), 23199 (26.7, 12.7, 11.1 cm, 581.2 g);
   * - vambraces: 24896 (21, 11.4, 8.9 cm, 351 g) and 35850 (46.1, 16.8, 13.2 cm, 1089 g);
   * - greaves: 22970 (35.3, 12.7, 11.4 cm, 669 g) and 22276 (38.3, 11.7, 14.3 cm, 854 g).
   */
  export const MODELS: Readonly<
    Record<
      Kind,
      Readonly<
        Partial<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    openHelmet: {
      met26453: read(24.1, 28.6, 33.7, 2984),
      met25388: read(26.7, 23.5, 39.37, 2769),
    },
    closedHelmet: {
      met23232: read(29.2, 21.6, 28.6, 2749),
      met26508: read(29.8, 22.2, 33.7, 2656),
    },
    brimmedHelmet: {
      met26512: read(27, 23.81, 34.3, 1449),
      met21972: read(25.4, 23.2, 33.5, 1701),
    },
    cuirass: {
      met22359: read(36.2, 30.5, 30.5, 4536),
      met23084: read(37.5, 37.5, 19.5, 3112 + 2340),
    },
    mail: {
      met34324: read(91.5, 143, 62, 9071.9),
      met22415: read(84, 132, 62, 9869),
      met633538: read(86.4, 144.8, 62, 7520.6),
      met27635: read(81, 137, 62, 5562),
    },
    gauntlet: {
      met23255: read(29.4, 14.6, 15.9, 793.8),
      met23256: read(21, 12.7, 12.4, 300.5),
      met23199: read(26.7, 12.7, 11.1, 581.2),
    },
    vambrace: {
      met24896: read(21, 11.4, 8.9, 351),
      met35850: read(46.1, 16.8, 13.2, 1089),
    },
    greave: {
      met22970: read(35.3, 12.7, 11.4, 669),
      met22276: read(38.3, 11.7, 14.3, 854),
    },
  };

  /** A plate piece's glance angle, degrees from the plate's normal, a provisional value: Peter Jones's long bodkin against 1.5 mm mild steel "penetrated perhaps 2 mm beyond the inner surface of the plate and then broke while the rest of the arrow ricocheted" at 60 degrees and ricocheted at 70 (Hardy, Longbow, as quoted at https://willscommonplacebook.blogspot.com/2007/02/glancing-blows-and-armor-penetration.html, not read at the book), the prototype publishes 60 degrees from this quoted trial, not a universal critical angle. Williams's table of the energy to defeat mild steel at an angle (The Knight and the Blast Furnace, 2003, quoted there), rising to twice the square-on energy at 60 degrees, and Hinsley's 30-degree strikes (The Historian, 2015, pp. 31-32) give no glance angle. Searched for #3500 without a primary figure: Jones 1992 (Materials Characterization 29) and the DTIC report ADA030268 on spheres ricocheting from thin plates (unreadable). Magier et al. 2017, DOI 10.5604/01.3001.0010.5152, uses two specific 96 g arrow types against 2 mm steel in finite-element simulations and reports ricochet near 52 degrees; those specimen-specific outcomes do not establish a universal cutoff (author-hosted primary PDF, https://www.researchgate.net/profile/Pawel-Zochowski/publication/320288999_NUMERICAL_ANALYSIS_OF_ENGLISH_BOWS_USED_IN_BATTLE_OF_CRECY/links/59ef29ae458515ec0c7a1284/NUMERICAL-ANALYSIS-OF-ENGLISH-BOWS-USED-IN-BATTLE-OF-CRECY.pdf). */
  export const GLANCE: number = 60;

  /** The plate's thickness band. */
  const thickness: IArchetypeBand = ArchetypeBand.metres(0.0015, 0.003, PLATE);

  /** A helmet's padding. */
  const pad: IArchetypeBand = ArchetypeBand.metres(
    0.75 * ArchetypeUnits.INCH,
    0.75 * ArchetypeUnits.INCH,
    PAD,
    true,
  );

  /** The band of each free dimension a piece's record leaves, by kind: the plate's thickness, a breastplate's band applied to the thinner limb plates, provisional for them, and a helmet's padding. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    openHelmet: { thickness, pad },
    closedHelmet: { thickness, pad },
    brimmedHelmet: { thickness, pad },
    cuirass: { thickness },
    mail: {},
    gauntlet: { thickness: { ...thickness, provisional: true } },
    vambrace: { thickness: { ...thickness, provisional: true } },
    greave: { thickness: { ...thickness, provisional: true } },
  };

  /** The parameters: the kind, the read piece, the body to fit, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which piece. */
    kind: Kind;

    /** Which read piece; picked from the seed when absent. */
    model?: Model;

    /** The body to fit, metres: each field this kind uses must be present, finite and positive, with shoulders above waist for a cuirass. Unused fields may be omitted; absent measure leaves the piece as its museum-record box. */
    measure?: Partial<IAutoMovieBodyMeasure>;

    /** The model's id, unique in a scene; `armour` when absent. */
    id?: string;
  }

  /** The bone a piece rides, by its kind and a limb piece's side: `armourBone`. */
  export const bone: typeof armourBone = armourBone;
}

/** Admit only the body's dimensions this kind actually uses, without inventing anthropometric bands. */
function admitMeasure(
  kind: createArmour.Kind,
  measure: Partial<IAutoMovieBodyMeasure>,
): void {
  const required: Readonly<
    Record<createArmour.Kind, readonly (keyof IAutoMovieBodyMeasure)[]>
  > = {
    openHelmet: ["headRadius"],
    closedHelmet: ["headRadius"],
    brimmedHelmet: ["headRadius"],
    cuirass: ["chestBreadth", "chestDepth", "shoulderHeight", "waistHeight"],
    mail: ["chestBreadth", "chestDepth"],
    gauntlet: ["forearmRadius", "hand"],
    vambrace: ["forearmRadius", "forearm"],
    greave: ["shankRadius", "shank"],
  };
  for (const field of required[kind]) {
    const value: number | undefined = measure[field];
    if (!(value !== undefined && Number.isFinite(value) && value > 0))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: "armour",
        axis: `measure.${field}`,
        value,
        feasible: null,
        reason: `${kind} needs a finite positive ${field} in metres`,
        fix: `supply the body's measured ${field} above zero`,
      });
  }
  if (kind === "cuirass" && !(measure.shoulderHeight! > measure.waistHeight!))
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "armour",
      axis: "measure.shoulderHeight",
      value: measure.shoulderHeight,
      feasible: null,
      reason:
        "a cuirass needs the shoulders above the waist to have a positive height",
      fix: "supply canonical body heights with shoulderHeight above waistHeight",
    });
}
