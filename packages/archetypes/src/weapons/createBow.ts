import { AutoMovieGravity, Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import { BOW_BANDS } from "./BOW_BANDS";
import { bowLaunchSpeed } from "./bowLaunchSpeed";
import { bowLimbs } from "./bowLimbs";
import { buildCrossbow } from "./buildCrossbow";

/** The Olympic recurve's maker's chart. */
const HOYT: string =
  'Hoyt 2014 Recurve Owner\'s Manual: a 25" Grand Prix riser with medium limbs makes a 68" bow and with long limbs a 70" bow (p. 5), braced 8.5 to 9.0" and 8.75 to 9.5" (p. 15); "The weight marked on the limb is measured at a 28" standard A.T.A. ... draw length" (p. 5) (https://shop.textalk.se/shop/1439/files/manualerkataloger/Hoyt-2014-Recurve-Manual.pdf)';

/**
 * A bow an archer braces, draws and looses: a longbow, an Olympic recurve or a Korean horse bow.
 *
 * It stands braced on its lower tip with its back toward `-Z`, the way an arrow flies, and its string toward `+Z`, the archer's side. Each limb runs straight from the grip at the bow's centre to its nock, hinged at the grip, and the string's two halves run from the limb tips to the nocking point, each a span laid again at every pose. `grip` is the bow's centre, taken from `+Z` in one hand with the stave along `+X`. `string` is the nocking point drawn back along `+Z`, from brace to the kind's draw length from the grip; `upperLimb` and `lowerLimb` follow it, each turned so its tip stays the string's half length from the nocking point, so naming a limb in a state is refused with `string` as its leader. `nock` rides the string, where an arrow's nock sits and the drawing hand takes it; `rest` is the stave's side at the grip, where the arrow's shaft lies. Its draw force at its stated draw length is a dimension, and `launchSpeed` gives the speed an arrow leaves at for a draw. A longbow's limbs and grip are wood, the approximations' wych elm; it stands on its wooden lower tip, so its body's friction is wood's on concrete. A horse bow is braced its read brace height clear of its grip, a recurve its maker's; their grips are the power grip band applied, and their bow lengths are taken as their lengths nock to nock, a choice the string's place reads; no maker read names their material, so they declare no surface and carry no friction. A crossbow, Payne-Gallwey's sporting crossbow with its cranequin (`CROSSBOW`), lies on its stock along `+Z` from the butt at the origin, its bolt flying `+Z` along the stock's groove: its `string` slides back toward the butt, following its `crank` by the cranequin's thirty turns for the string's travel, so naming the string in a state is refused with `crank` as its leader; its bow's halves follow the string as a bow's limbs do; `grip` is the fore-stock ahead of the nut, closed across its thickness by the bow hand from the stock's left, `+X`, `rest` the groove, `butt` the stock's end against the shoulder, `trigger` the trigger under the stock and `stirrup` the iron ahead of the fore-end a foot holds down while spanning.
 *
 * @param params The kind, the model and a horse bow's draw weight, and any dimension the author fixes.
 * @param seed The seed that picks the model and the draw weight left free and draws every dimension left free inside its band; absent, the first model, the first draw weight and the middle of each band.
 * @returns The bow.
 * @throws {ArchetypeRefusal} For a model or a draw weight not of the kind, a fixed dimension outside its band, or one the model or the draw weight gives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the bow stands, where its back and string face, where it is held, how the string draws and the limbs follow, and where the arrow sits and lies.
 * @evidence contracts/development/implementation.md#principled-implementation Two limbs of the read section from the grip to the nocks, the read length apart, the string a twelfth of that length clear of the belly as the brace rule gives, or a read brace height; the whole lifted so its lowest point is on the floor. The string slides from brace to the draw length; each limb's turn at a travel keeps its tip on its circle about the grip and the string's half length from the nocking point, `asin(c / R) - alpha` with `c` the tip's reach toward the drawn nock, tabulated at the travels where piecewise-linear reading keeps the half within the string's radius of its length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the model and the draw weight, draw the other dimensions, then a crossbow's own branch, or place the nocks, then the limbs, the grip, the string's slider and halves, the limbs' hinges and the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The limbs' taper and bend, a recurve's tips and the horn nocks are not drawn: each limb turns stiff about the grip; no contact reads more. The string's radius is half the read arrow nock width it fits. A crossbow's stock is a box of its fore-end's section, its taper not drawn; its cranequin's axle direction and its stirrup's height are unread and placed provisionally; its draw weight is unread, so it has none.
 * @evidence contracts/development/implementation.md#efficient-algorithms Six parts for a bow and nine for a crossbow; the limbs' table is bisected once per bow.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The string's halves are `ArchetypeBuilder.span`'s lines from the limb tips to the nock, so they stay on them in any pose.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBow(
  params: createBow.IParams,
  seed?: number | string,
): Archetype<createBow.Affordance, createBow.Dimension> {
  const draw: ArchetypeDrawSession<createBow.Dimension> =
    new ArchetypeDrawSession<createBow.Dimension>(
      "bow",
      createBow.UNITS,
      seed,
      params,
    );
  const kind: createBow.Kind = ArchetypeDraw.choice(
    "bow",
    "kind",
    params.kind,
    createBow.KINDS,
  );
  // A longbow is one of the three read approximations, its mass and draw whole; a recurve one of the maker's two lengths with its brace band; a horse bow one of the two read bows, drawn at one of its maker's draw weights.
  const model: {
    name: createBow.Model | undefined;
    figures: Readonly<Partial<Record<createBow.Dimension, number>>>;
  } = draw.model<createBow.Model>(
    "model",
    params.model,
    createBow.MODELS[kind],
  );
  const weight: {
    figures: Readonly<Partial<Record<createBow.Dimension, number>>>;
  } = draw.model<createBow.Weight>(
    "weight",
    params.weight,
    createBow.WEIGHTS[kind],
  );
  const bands: Readonly<Partial<Record<createBow.Dimension, IArchetypeBand>>> =
    {
      ...createBow.BANDS[kind],
      ...(model.name === undefined ? {} : createBow.BRACES[model.name]),
    };
  const d: Partial<Record<createBow.Dimension, number>> = {
    ...draw.dimensions(bands, createBow.BANDS),
    ...model.figures,
    ...weight.figures,
  };
  const builder: ArchetypeBuilder<createBow.Affordance, createBow.Dimension> =
    new ArchetypeBuilder({
      id: params.id,
      name:
        kind === "longbow"
          ? "longbow"
          : kind === "recurve"
            ? "recurve bow"
            : kind === "crossbow"
              ? "crossbow"
              : "horse bow",
      draw,
    });
  if (kind === "crossbow") return buildCrossbow(builder, d);
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
  const wood: { surface?: "wood" } =
    kind === "longbow" ? { surface: "wood" } : {};
  builder.rod("lowerLimb", r, low, grip, { color: "#a8743f", ...wood });
  builder.rod("upperLimb", r, grip, high, { color: "#a8743f", ...wood });
  builder.ball("grip", r, grip, { color: "#8a5a2b", ...wood });
  builder.ball("nockingPoint", createBow.STRING, v(0, centre, string), {
    color: "#c9a227",
  });

  // The string: its nocking point slides back along `+Z` from brace to the draw length from the grip.
  const travel: number = createBow.DRAW_LENGTH[kind] - string;
  builder.affordance({
    id: "string",
    kind: "slider",
    frame: ArchetypeFrame.facing(v(0, centre, string), v(0, 1, 0), v(0, 0, 1)),
    extent: null,
    travel,
    parts: ["nockingPoint"],
  });
  builder.affordance({
    id: "nock",
    kind: "socket",
    frame: ArchetypeFrame.facing(v(0, centre, string), v(0, 0, 1), v(0, 1, 0)),
    extent: null,
    rides: "string",
  });

  // Each limb turns about the grip's sideways axis, the upper's positive turn and the lower's bringing its tip back toward the string, by the table that keeps the tip the string's half length from the nocking point.
  const table: [number, number][] = createBow.limbs(length / 2, string, travel);
  for (const [id, sign] of [
    ["upperLimb", 1],
    ["lowerLimb", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "hinge",
      frame: ArchetypeFrame.facing(grip, v(sign, 0, 0), v(0, 0, 1)),
      extent: null,
      travel: table[table.length - 1]![1],
      parts: [id],
      follows: { id: "string", table },
    });

  // The string's halves, each from a limb tip to the nocking point, laid again at every pose.
  for (const [id, part, at] of [
    ["string-upper", "upperLimb", limb / 2],
    ["string-lower", "lowerLimb", -limb / 2],
  ] as const)
    builder.span(
      id,
      { part, at: v(0, at, 0) },
      { affordance: "nock" },
      createBow.STRING,
      { color: "#e8e1cf" },
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
    id: "rest",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(-r, centre, 0), v(-1, 0, 0), v(0, 0, 1)),
    extent: null,
    width: d.depth!,
    depth: d.depth!,
  });
  return builder.build(d.mass!, kind === "longbow" ? { rests: "wood" } : {});
}

/**
 * Companion types, constants, bands and rules of {@link createBow}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension, constant and rule states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of bows, named for what they are, and of the read models and draw weights, each whole; the brace height follows the length by the brace rule or is read; the draw force is a dimension of its own, and the launch reads the bow's own dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grip the bow hand takes, the string the drawing hand pulls, the nock and rest the arrow uses and the limbs that follow (#3481); the arrow is `createProjectile`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing between two models or two draw weights is drawn; the grips' power band, the recurve's estimated upper weight and riser masses, and the launch's curve and efficiency are marked provisional.
 */
export namespace createBow {
  /** The kinds: a longbow, after the Mary Rose bow X1-3's approximations, an Olympic recurve, after Hoyt's Grand Prix bows, and a Korean traditional horse bow. */
  export type Kind = "longbow" | "recurve" | "horseBow" | "crossbow";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "longbow",
    "recurve",
    "horseBow",
    "crossbow",
  ];

  /** A braced longbow's brace height, belly to string, as a share of its length nock to nock: one twelfth, the brace rule (Glasgow Archers, Brace Height, https://glasgowarchers1948.co.uk/2024/08/23/brace-height/), which gives Ford's "six inches or so for a man's bow" on a six-foot bow (Theory and Practice of Archery, https://gutenberg.org/cache/epub/41643/pg41643-images.html). */
  export const BRACE: number = 1 / 12;

  /** The string's radius, metres: half the Mary Rose arrow nocks' median 3 mm width, the slot the string fills. */
  export const STRING: number = 0.0015;

  /** The draw length each kind's draw force is stated at, metres, from the grip to the drawn nock: the longbow approximations' read 30 in, the recurve maker's 28 in rating draw, the horse bows' read 31 in. */
  export const DRAW_LENGTH: Readonly<
    Record<Exclude<Kind, "crossbow">, number>
  > = {
    longbow: 30 * ArchetypeUnits.INCH,
    recurve: 28 * ArchetypeUnits.INCH,
    horseBow: 31 * ArchetypeUnits.INCH,
  };

  /**
   * The affordance ids:
   *
   * - `grip`: the bow's centre, taken from `+Z` with the stave along `+X`; a crossbow's fore-stock, closed across its thickness from `+X` with the stock along it.
   * - `string`: the nocking point, drawn back along `+Z` from brace to the kind's draw length.
   * - `nock`: the nocking point, facing `+Z`, where an arrow's nock sits and the drawing hand takes the string; it rides `string`.
   * - `rest`: the stave's `-X` side at the grip, where the arrow's shaft lies.
   * - `upperLimb`, `lowerLimb`: each limb's turn about the grip, following `string`; a crossbow's bow halves, toward `+X` and `-X`, turning about its centre.
   * - `butt`, `trigger`, `stirrup`, `crank`: a crossbow's stock end, its trigger under the stock, the stirrup ahead of its fore-end, and the cranequin's crank the string follows.
   */
  export type Affordance =
    | "grip"
    | "string"
    | "nock"
    | "rest"
    | "upperLimb"
    | "lowerLimb"
    | "butt"
    | "trigger"
    | "stirrup"
    | "crank";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: nock to nock along the string.
   * - `depth`: the stave's depth at its centre, back to belly, the grip's span.
   * - `brace`: a horse bow's and a recurve's brace height, belly to string; a longbow's follows its length by `BRACE`.
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

  /** The read models: the longbow approximations S1, S2 and S3, Hoyt's 68 and 70 in recurves on a 25 in Grand Prix riser, and the Freddie Warrior and Zenith horse bows. */
  export type Model =
    | "s1"
    | "s2"
    | "s3"
    | "hoyt68"
    | "hoyt70"
    | "warrior"
    | "zenith";

  /** A horse bow's draw weights, its maker's 15 to 60 lb in 5 lb steps. */
  export type Weight =
    | "lb15"
    | "lb20"
    | "lb25"
    | "lb30"
    | "lb35"
    | "lb40"
    | "lb45"
    | "lb50"
    | "lb55"
    | "lb60";

  /** Each kind's models whole, the default first: the longbow approximations' mass and draw at 30 in (Aston and Spencer, pp. 25-26, 29), the recurves' bow lengths (Hoyt, p. 5) and the horse bows' length and mass (Bogentandler, the makers' figures); a bow length is taken as nock to nock. */
  export const MODELS: Readonly<
    Record<
      Kind,
      Readonly<
        Partial<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    longbow: {
      s1: {
        mass: 0.905,
        draw: 108 * ArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
      s2: {
        mass: 0.868,
        draw: 101 * ArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
      s3: {
        mass: 0.785,
        draw: 141 * ArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
    },
    recurve: {
      hoyt68: { length: 68 * ArchetypeUnits.INCH },
      hoyt70: { length: 70 * ArchetypeUnits.INCH },
    },
    horseBow: {
      warrior: { length: 53 * ArchetypeUnits.INCH, mass: 0.33 },
      zenith: { length: 48 * ArchetypeUnits.INCH, mass: 0.315 },
    },
    crossbow: {},
  };

  /** A recurve model's brace band, the maker's for its length on a 25 in Grand Prix riser (Hoyt, p. 15). */
  export const BRACES: Readonly<
    Partial<Record<Model, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>>
  > = {
    hoyt68: {
      brace: ArchetypeBand.metres(
        8.5 * ArchetypeUnits.INCH,
        9 * ArchetypeUnits.INCH,
        HOYT,
      ),
    },
    hoyt70: {
      brace: ArchetypeBand.metres(
        8.75 * ArchetypeUnits.INCH,
        9.5 * ArchetypeUnits.INCH,
        HOYT,
      ),
    },
  };

  /** A horse bow's draw weights as forces at 31 in, both makers' pages: "15 to 60 lbs in 5 lb steps"; a longbow's draw is its model's. */
  export const WEIGHTS: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<Record<Weight, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    horseBow: {
      lb15: { draw: 15 * ArchetypeUnits.POUND * AutoMovieGravity.STANDARD },
      lb20: { draw: 20 * ArchetypeUnits.POUND * AutoMovieGravity.STANDARD },
      lb25: { draw: 25 * ArchetypeUnits.POUND * AutoMovieGravity.STANDARD },
      lb30: { draw: 30 * ArchetypeUnits.POUND * AutoMovieGravity.STANDARD },
      lb35: { draw: 35 * ArchetypeUnits.POUND * AutoMovieGravity.STANDARD },
      lb40: { draw: 40 * ArchetypeUnits.POUND * AutoMovieGravity.STANDARD },
      lb45: { draw: 45 * ArchetypeUnits.POUND * AutoMovieGravity.STANDARD },
      lb50: { draw: 50 * ArchetypeUnits.POUND * AutoMovieGravity.STANDARD },
      lb55: { draw: 55 * ArchetypeUnits.POUND * AutoMovieGravity.STANDARD },
      lb60: { draw: 60 * ArchetypeUnits.POUND * AutoMovieGravity.STANDARD },
    },
  };

  /** The parameters: the kind, the model and a horse bow's draw weight, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bow. */
    kind: Kind;

    /** Which of the kind's read models; picked from the seed when absent. */
    model?: Model;

    /** A horse bow's draw weight; picked from the seed when absent. Other bows have none. */
    weight?: Weight;

    /** The model's id, unique in a scene; `bow` when absent. */
    id?: string;
  }

  /** The band of each free dimension a kind's model and draw weight leave, by kind; a recurve's brace is its model's (`BRACES`). */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = BOW_BANDS;

  /**
   * The crossbow's places along its stock and its spanning gear, metres, degrees and ratios, each Payne-Gallwey's (The Crossbow, 1903) unless marked provisional: `stock`, its "Extreme length ... 3 ft." and `fore`, its depth at the fore-end, 3¼ in (p. 93), its taper to the small end's 1¾ in not drawn; `nut`, the nut's centre 14 in from the fore-end (p. 93); `rest`, the string at rest 6 in ahead of the nut's centre (p. 116); `travel`, the string's 5½ in "common distance ... along the stock to the catch of the lock" (p. 134, read at the page image); `turns`, the cranequin's handle "turned round in a complete circle thirty times" for it, and `handle`, that handle's 9 in (p. 134); `axle`, the cranequin's pin "about seven inches behind the catch" (p. 134); `trigger` and `triggerDiameter`, the trigger's handle, "8¼ in. long and ⅜ in. diameter" (p. 98); `release`, the trigger's point going "⅛ in. ... into the notch in the nut" (p. 98), taken as its travel, provisional, since the handle's own travel is unread; `stirrup`, its tread's width, the bow's 1⅝ in at its centre (p. 104); `thickness`, the bow's "½ in." at its centre (p. 101), drawn as the bow's round section and the stirrup's iron. The cranequin's axle direction and the stirrup's height are not read: the axle is taken across the stock and the stirrup ahead of the fore-end at the stock's top, provisional. The sporting crossbow's draw weight is not read, so the crossbow has no `draw` and `launchSpeed` refuses it: Payne-Gallwey states only his siege crossbow's 1,200 lb (p. 14), a crossbow of another class; searched for #3481 without a figure: his sporting types, measured reproductions of sporting and hunting crossbows (makers list munition crossbows only), and German museum and research catalogues of hunting crossbows ("Jagdarmbrust Zuggewicht").
   */
  export const CROSSBOW: Readonly<{
    stock: number;
    fore: number;
    nut: number;
    rest: number;
    travel: number;
    turns: number;
    handle: number;
    axle: number;
    trigger: number;
    triggerDiameter: number;
    release: number;
    stirrup: number;
    thickness: number;
  }> = {
    stock: 36 * ArchetypeUnits.INCH,
    fore: 3.25 * ArchetypeUnits.INCH,
    nut: 14 * ArchetypeUnits.INCH,
    rest: 6 * ArchetypeUnits.INCH,
    travel: 5.5 * ArchetypeUnits.INCH,
    turns: 30,
    handle: 9 * ArchetypeUnits.INCH,
    axle: 7 * ArchetypeUnits.INCH,
    trigger: 8.25 * ArchetypeUnits.INCH,
    triggerDiameter: 0.375 * ArchetypeUnits.INCH,
    release: 0.125 * ArchetypeUnits.INCH,
    stirrup: (13 / 8) * ArchetypeUnits.INCH,
    thickness: 0.5 * ArchetypeUnits.INCH,
  };

  /** Kooi's figures for the launch, each provisional for a kind he did not compute (B. W. Kooi, On the Mechanics of the Bow and Arrow, thesis, Groningen 1983, https://www.bio.vu.nl/thb/users/kooi/thesis.pdf): `straight`, the KL straight-end bow's energy factor `q`, 0.407, the stored energy over the full draw force times the power stroke, and its efficiency 0.765 with a 0.02 kg arrow (p. 117; Table 4.29, p. 161), taken for a longbow; `recurve`, the B1 "normal modern recurve bow for target shooting"'s `q`, 0.426 (Table 2.6, p. 46), taken for a recurve and, provisionally, a horse bow, whose efficiency no read gives, so the KL bow's is taken. */
  export const KOOI: Readonly<{
    straight: number;
    recurve: number;
    efficiency: number;
    arrow: number;
  }> = { straight: 0.407, recurve: 0.426, efficiency: 0.765, arrow: 0.02 };

  /** Each limb's turn against the string's travel, the table `upperLimb` and `lowerLimb` follow: `bowLimbs`, rows of the travel in metres and the turn in degrees. */
  export const limbs: typeof bowLimbs = bowLimbs;

  /** The speed an arrow leaves a bow at, drawn to a travel of its string, metres per second, by Kooi's energy balance: `bowLaunchSpeed`, which refuses a bow whose draw weight is unread. */
  export const launchSpeed: typeof bowLaunchSpeed = bowLaunchSpeed;
}
