import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeCourse,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** The Mary Rose bow X1-3 and its approximations, read in the bowyers' study. */
const WARBOW: string =
  "Aston and Spencer, The Deane brother's Mary Rose Bow X1-3: the bow 1710 mm long, 42.03 mm wide and 29.79 mm deep at its centre, about 167 cm nock to nock once horned; approximation MR X1-9/S3 66 in nock to nock; approximations of wych elm, S1, S2 and S3 905, 868 and 785 g, drawing 108, 101 and 141 lb at 30 in; Mary Rose arrow nocks a median 3 mm wide (https://keskustelu.primitiivijousi.fi/uploads/short-url/jbxr7WWexChfC3RBxRL26IK9gxF.pdf, pp. 4-5, 13, 21-22, 25-26, 29, 32)";

/** Two Korean traditional horse bows, read at a dealer that states the maker's figures. */
const HORSE_BOW: string =
  "Freddie Warrior KTB 53 in: \"Brace height: 5.5 to 6\" (14 to 15 cm)\", \"Mass weight: 330 g\", \"Draw weight: 15 to 60 lbs in 5 lb steps, measured at 31\" of draw\" (https://www.bogentandler.at/en/freddie-warrior-ktb-53); Freddie Zenith KTB 48 in: brace 14 to 15 cm, 315 g, drawn at 31 in (https://www.bogentandler.at/en/freddie-zenith-ktb-48)";

/** The handle diameters hands rated most comfortable in a power grip. */
const POWER: string =
  "Kong and Lowe 2005, Int J Ind Ergon 35:495, handles of 30 to 40 mm rated most comfortable (https://stacks.cdc.gov/view/cdc/197408), applied to a horse bow's grip, whose own size no maker read gives";

/**
 * A bow an archer braces, draws and looses: a longbow or a Korean horse bow.
 *
 * It stands braced on its lower tip with its back toward `-Z`, the way an arrow flies, and its string toward `+Z`, the archer's side. Its limbs run straight from the grip at the bow's centre to its two nocks, and the string runs straight between the nocks, its brace height clear of the belly at the grip. `grip` is the bow's centre, taken from `+Z` in one hand with the stave along `+X`. `nock` is the string level with the grip, facing `+Z`, where an arrow's nock sits and the drawing hand takes the string. Its draw force at its stated draw length is a dimension, for the draw that reads it. Its limbs and grip are wood, the approximations' wych elm; it stands on its wooden lower tip, so its body's friction is wood's on concrete. A horse bow is braced its read brace height clear of its grip, its grip the power grip band applied; the dealer's bow length is taken as its length nock to nock, a choice the string's place reads; no maker read names its material, so it declares no surface and carries no friction. A recurve and a crossbow wait for the sizes their contacts need, listed in the sources record.
 *
 * @param params The kind, the model and a horse bow's draw weight, and any dimension the author fixes.
 * @param seed The seed that picks the model and the draw weight left free and draws every dimension left free inside its band; absent, the first model, the first draw weight and the middle of each band.
 * @returns The bow.
 * @throws {ArchetypeRefusal} For a model or a draw weight not of the kind, a fixed dimension outside its band, or one the model or the draw weight gives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the bow stands, where its back and string face, where it is held and where the arrow sits.
 * @evidence contracts/development/implementation.md#principled-implementation Two limbs of the read centre section from the grip to the nocks, the read length apart, the string a twelfth of that length clear of the belly as the brace rule gives, or a horse bow's read brace height; the whole lifted so its lowest point is on the floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the model and the draw weight, draw the other dimensions, place the nocks, then the limbs, the grip, the string spanning the limb tips, and the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The limbs' taper, the bend of a braced limb and the horn nocks are not drawn; no contact reads them. The string's radius is half the read arrow nock width it fits.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The string is `ArchetypeBuilder.span`'s line between the limb tips, so it stays on them in any pose.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBow(
  params: createBow.IParams,
  seed?: number | string,
): Archetype<createBow.Affordance, createBow.Dimension> {
  const draw: ArchetypeDrawSession<createBow.Dimension> = new ArchetypeDrawSession<createBow.Dimension>("bow", createBow.UNITS, seed, params);
  const kind: createBow.Kind = ArchetypeDraw.choice(
    "bow",
    "kind",
    params.kind,
    createBow.KINDS,
  );
  // A longbow is one of the three read approximations, its mass and draw whole; a horse bow one of the two read bows, drawn at one of its maker's draw weights.
  const model: { figures: Readonly<Partial<Record<createBow.Dimension, number>>> } =
    draw.model<createBow.Model>("model", params.model, createBow.MODELS[kind]);
  const weight: { figures: Readonly<Partial<Record<createBow.Dimension, number>>> } =
    draw.model<createBow.Weight>("weight", params.weight, createBow.WEIGHTS[kind]);
  const d: Partial<Record<createBow.Dimension, number>> = {
    ...draw.dimensions(createBow.BANDS[kind], createBow.BANDS),
    ...model.figures,
    ...weight.figures,
  };
  const builder: ArchetypeBuilder<createBow.Affordance, createBow.Dimension> =
    new ArchetypeBuilder({
      id: params.id,
      name: kind === "longbow" ? "longbow" : "horse bow",
      draw,
    });
  const v: typeof Vector3.create = Vector3.create;

  // The string a brace height clear of the belly; each limb a straight rod from the grip to its nock, lifted so the lower limb's tilted collider, a capsule as long as the rod, rests on the floor.
  const length: number = d.length!;
  const r: number = d.depth! / 2;
  const string: number = r + (d.brace ?? length * createBow.BRACE);
  const limb: number = Math.hypot(length / 2, string);
  const floor: number = r * (1 - length / 2 / limb);
  const centre: number = floor + length / 2;
  const low: ReturnType<typeof v> = v(0, floor, string);
  const high: ReturnType<typeof v> = v(0, floor + length, string);
  const grip: ReturnType<typeof v> = v(0, centre, 0);
  const wood: { surface?: "wood" } = kind === "longbow" ? { surface: "wood" } : {};
  builder.rod("lowerLimb", r, low, grip, { color: "#a8743f", ...wood });
  builder.rod("upperLimb", r, grip, high, { color: "#a8743f", ...wood });
  builder.ball("grip", r, grip, { color: "#8a5a2b", ...wood });

  // The string spans the two limb tips, so a pose that bends the limbs lays it again between them.
  builder.span(
    "string",
    { part: "lowerLimb", at: v(0, -limb / 2, 0) },
    { part: "upperLimb", at: v(0, limb / 2, 0) },
    createBow.STRING,
    { color: "#e8e1cf", density: 0.5 },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(grip, v(0, 0, 1), v(0, 1, 0)),
    extent: null,
    grip: "power",
    aperture: d.depth!,
  });
  builder.affordance({
    id: "nock",
    kind: "socket",
    frame: ArchetypeFrame.facing(v(0, centre, string), v(0, 0, 1), v(0, 1, 0)),
    extent: null,
  });
  return builder.build(d.mass!, kind === "longbow" ? { rests: "wood" } : {});
}

/**
 * Companion types, constants and bands of {@link createBow}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of bows, named for what they are, and of the read models and draw weights, each whole; the brace height follows the length by the brace rule, and the draw force is a dimension of its own.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grip the bow hand takes and the string's nocking point the arrow and the drawing hand share (#3482); the arrow is `createProjectile`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every longbow figure is read; nothing between two models or two draw weights is drawn; a horse bow's grip is the power grip band applied, provisional, and its length the dealer's bow length taken as nock to nock; the string's radius is derived from the read nock width it fits.
 */
export namespace createBow {
  /** The kinds: a longbow, after the Mary Rose bow X1-3's approximations, and a Korean traditional horse bow. */
  export type Kind = "longbow" | "horseBow";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["longbow", "horseBow"];

  /** A braced longbow's brace height, belly to string, as a share of its length nock to nock: one twelfth, the brace rule (Glasgow Archers, Brace Height, https://glasgowarchers1948.co.uk/2024/08/23/brace-height/), which gives Ford's "six inches or so for a man's bow" on a six-foot bow (Theory and Practice of Archery, https://gutenberg.org/cache/epub/41643/pg41643-images.html). */
  export const BRACE: number = 1 / 12;

  /** The string's radius, metres: half the Mary Rose arrow nocks' median 3 mm width, the slot the string fills. */
  export const STRING: number = 0.0015;

  /** The draw length each kind's draw force is stated at, metres: the longbow approximations' read 30 in, the horse bows' read 31 in. */
  export const DRAW_LENGTH: Readonly<Record<Kind, number>> = {
    longbow: 30 * ArchetypeUnits.INCH,
    horseBow: 31 * ArchetypeUnits.INCH,
  };

  /**
   * The affordance ids:
   *
   * - `grip`: the bow's centre, taken from `+Z` with the stave along `+X`.
   * - `nock`: the string level with the grip, facing `+Z`, where an arrow's nock sits and the drawing hand takes the string.
   */
  export type Affordance = "grip" | "nock";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: nock to nock along the string.
   * - `depth`: the stave's depth at its centre, back to belly, the grip's span.
   * - `brace`: a horse bow's brace height, belly to string; a longbow's follows its length by `BRACE`.
   * - `draw`: the force holding the string drawn the kind's `DRAW_LENGTH`, newtons.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "depth" | "brace" | "draw" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    depth: "m",
    brace: "m",
    draw: "N",
    mass: "kg",
  };

  /** The read models: the longbow approximations S1, S2 and S3, and the Freddie Warrior and Zenith horse bows. */
  export type Model = "s1" | "s2" | "s3" | "warrior" | "zenith";

  /** A horse bow's draw weights, its maker's 15 to 60 lb in 5 lb steps. */
  export type Weight = "lb15" | "lb20" | "lb25" | "lb30" | "lb35" | "lb40" | "lb45" | "lb50" | "lb55" | "lb60";

  /** Each kind's models whole, the default first: the longbow approximations' mass and draw at 30 in (Aston and Spencer, pp. 25-26, 29), the horse bows' length and mass (Bogentandler, the makers' figures; the bow length taken as nock to nock). */
  export const MODELS: Readonly<Record<Kind, Readonly<Partial<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>>>> = {
    longbow: {
      s1: { mass: 0.905, draw: 108 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY },
      s2: { mass: 0.868, draw: 101 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY },
      s3: { mass: 0.785, draw: 141 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY },
    },
    horseBow: {
      warrior: { length: 53 * ArchetypeUnits.INCH, mass: 0.33 },
      zenith: { length: 48 * ArchetypeUnits.INCH, mass: 0.315 },
    },
  };

  /** A horse bow's draw weights as forces at 31 in, both makers' pages: "15 to 60 lbs in 5 lb steps"; a longbow's draw is its model's. */
  export const WEIGHTS: Readonly<Partial<Record<Kind, Readonly<Record<Weight, Readonly<Partial<Record<Dimension, number>>>>>>>> = {
    horseBow: {
      lb15: { draw: 15 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY },
      lb20: { draw: 20 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY },
      lb25: { draw: 25 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY },
      lb30: { draw: 30 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY },
      lb35: { draw: 35 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY },
      lb40: { draw: 40 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY },
      lb45: { draw: 45 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY },
      lb50: { draw: 50 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY },
      lb55: { draw: 55 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY },
      lb60: { draw: 60 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY },
    },
  };

  /** The parameters: the kind, the model and a horse bow's draw weight, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bow. */
    kind: Kind;

    /** Which of the kind's read models; picked from the seed when absent. */
    model?: Model;

    /** A horse bow's draw weight; picked from the seed when absent. A longbow has none. */
    weight?: Weight;

    /** The model's id, unique in a scene; `bow` when absent. */
    id?: string;
  }

  /** The band of each free dimension a kind's model and draw weight leave, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    longbow: {
      length: ArchetypeBand.metres(1.67, 66 * ArchetypeUnits.INCH, WARBOW),
      depth: ArchetypeBand.metres(0.02979, 0.02979, WARBOW),
    },
    horseBow: {
      depth: ArchetypeBand.metres(0.03, 0.04, POWER, true),
      brace: ArchetypeBand.metres(0.14, 0.15, HORSE_BOW),
    },
  };
}
