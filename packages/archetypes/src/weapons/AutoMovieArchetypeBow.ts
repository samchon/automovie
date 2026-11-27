import { AutoMovieGravity } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  type AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { BOW_BANDS } from "./BOW_BANDS";
import { bowLaunchSpeed } from "./internal/bowLaunchSpeed";
import { bowLimbs } from "./internal/bowLimbs";
import { AutoMovieArchetypeStageHandBowProp } from "./AutoMovieArchetypeStageHandBowProp";
import { AutoMovieArchetypeStageStockBowProp } from "./AutoMovieArchetypeStageStockBowProp";
import type { IArchetypeDispatch } from "../core/IArchetypeDispatch";

/** The Olympic recurve's maker's chart. */
const HOYT: string =
  'Hoyt 2014 Recurve Owner\'s Manual: a 25" Grand Prix riser with medium limbs makes a 68" bow and with long limbs a 70" bow (p. 5), braced 8.5 to 9.0" and 8.75 to 9.5" (p. 15); "The weight marked on the limb is measured at a 28" standard A.T.A. ... draw length" (p. 5) (https://shop.textalk.se/shop/1439/files/manualerkataloger/Hoyt-2014-Recurve-Manual.pdf)';

/** Constructs the bow archetype from its recipe. */
export namespace AutoMovieArchetypeBow {
/**
 * A bow an archer braces, draws and looses: a longbow, an Olympic recurve or a
 * Korean horse bow.
 *
 * It stands braced on its lower tip with its back toward `-Z`, the way an arrow
 * flies, and its string toward `+Z`, the archer's side. Each limb runs straight
 * from the grip at the bow's centre to its nock, hinged at the grip, and the
 * string's two halves run from the limb tips to the nocking point, each a span
 * laid again at every pose. `grip` is the bow's centre, taken from `+Z` in one
 * hand with the stave along `+X`. `string` is the nocking point drawn back
 * along `+Z`, from brace to the kind's draw length from the grip; `upperLimb`
 * and `lowerLimb` follow it, each turned so its tip stays the string's half
 * length from the nocking point, so naming a limb in a state is refused with
 * `string` as its leader. `nock` rides the string, where an arrow's nock sits
 * and the drawing hand takes it; `rest` is the stave's side at the grip, the
 * `nockHeight` below the nocking point (Easton's half inch for a recurve,
 * borrowed and provisional for the others), where the arrow's shaft lies. Its
 * draw force at its stated draw length is a dimension, and `launchSpeed` gives
 * the speed an arrow leaves at for a draw. A longbow's limbs and grip are wood,
 * the approximations' wych elm; it stands on its wooden lower tip, so its
 * body's friction is wood's on concrete. A horse bow is braced its read brace
 * height clear of its grip, a recurve its maker's; their grips are the power
 * grip band applied, and their bow lengths are taken as their lengths nock to
 * nock, a choice the string's place reads; no maker read names their material,
 * so they declare no surface and carry no friction. A crossbow, Payne-Gallwey's
 * sporting crossbow with its cranequin (`CROSSBOW`), lies on its stock along
 * `+Z` from the butt at the origin, its bolt flying `+Z` along the stock's
 * groove: its `string` slides back toward the butt, following its `crank` by
 * the cranequin's thirty turns for the string's travel, so naming the string in
 * a state is refused with `crank` as its leader; its bow's halves follow the
 * string as a bow's limbs do; `grip` and `foreEnd` mark separate hand contacts,
 * `rail` gives the presentation line, `rest` marks the groove, `butt` the
 * stock's end against the shoulder, `trigger` the trigger under the stock and
 * `stirrup` the iron ahead of the fore-end a foot holds down while spanning.
 *
 * @param params The kind, the model and a horse bow's draw weight, and any
 *   dimension the author fixes.
 * @param seed The seed that picks the model and the draw weight left free and
 *   draws every dimension left free inside its band; absent, the first model,
 *   the first draw weight and the middle of each band.
 * @returns The bow.
 * @throws {AutoMovieArchetypeRefusal} For a model or a draw weight not of the
 *   kind, a fixed dimension outside its band, or one the model or the draw
 *   weight gives.
 */
export function create(
  params: AutoMovieArchetypeBow.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBow.Affordance, AutoMovieArchetypeBow.Dimension> {
  const kind: AutoMovieArchetypeBow.Kind = ArchetypeDraw.choice(
    "bow",
    "kind",
    params.kind,
    AutoMovieArchetypeBow.KINDS,
  );
  // Each variant admits the saved parameters with its own draw, so the table
  // holds its producers as dispatch methods.
  const variants: Readonly<
    Record<
      AutoMovieArchetypeBow.Kind,
      IArchetypeDispatch<
        Omit<AutoMovieArchetypeBow.IParams, "kind">,
        AutoMovieArchetype<AutoMovieArchetypeBow.Affordance, AutoMovieArchetypeBow.Dimension>
      >
    >
  > = {
    longbow: { build: AutoMovieArchetypeStageHandBowProp.create },
    recurve: { build: AutoMovieArchetypeStageHandBowProp.create },
    horseBow: { build: AutoMovieArchetypeStageHandBowProp.create },
    crossbow: { build: AutoMovieArchetypeStageStockBowProp.create },
  };
  return variants[kind].build(params, seed);
}

  /* Companion types, constants, bands and rules of {@link createBow}. */
  /** The canonical factories for saved kinds, read after the catalogue loads. */
  export const PRODUCERS = {
    get longbow(): typeof AutoMovieArchetypeStageHandBowProp.create {
      return AutoMovieArchetypeStageHandBowProp.create;
    },
    get recurve(): typeof AutoMovieArchetypeStageHandBowProp.create {
      return AutoMovieArchetypeStageHandBowProp.create;
    },
    get horseBow(): typeof AutoMovieArchetypeStageHandBowProp.create {
      return AutoMovieArchetypeStageHandBowProp.create;
    },
    get crossbow(): typeof AutoMovieArchetypeStageStockBowProp.create {
      return AutoMovieArchetypeStageStockBowProp.create;
    },
  } satisfies Readonly<Record<Kind, unknown>>;

  /**
   * The kinds: a longbow, after the Mary Rose bow X1-3's approximations, an
   * Olympic recurve, after Hoyt's Grand Prix bows, and a Korean traditional
   * horse bow.
   */
  export type Kind = "longbow" | "recurve" | "horseBow" | "crossbow";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "longbow",
    "recurve",
    "horseBow",
    "crossbow",
  ];

  /**
   * A braced longbow's brace height, belly to string, as a share of its length
   * nock to nock: one twelfth, the brace rule (Glasgow Archers, Brace Height,
   * https://glasgowarchers1948.co.uk/2024/08/23/brace-height/), which gives
   * Ford's "six inches or so for a man's bow" on a six-foot bow (Theory and
   * Practice of Archery,
   * https://gutenberg.org/cache/epub/41643/pg41643-images.html).
   */
  export const BRACE: number = 1 / 12;

  /**
   * The string's radius, metres: half the Mary Rose arrow nocks' median 3 mm
   * width, the slot the string fills.
   */
  export const STRING: number = 0.0015;
  /**
   * The draw length each kind's draw force is stated at, metres, from the grip
   * to the drawn nock: the longbow approximations' read 30 in, the recurve
   * maker's 28 in rating draw, the horse bows' read 31 in.
   */
  export const DRAW_LENGTH: Readonly<
    Record<Exclude<Kind, "crossbow">, number>
  > = {
    longbow: 30 * AutoMovieArchetypeUnits.INCH,
    recurve: 28 * AutoMovieArchetypeUnits.INCH,
    horseBow: 31 * AutoMovieArchetypeUnits.INCH,
  };

  /**
   * The affordance ids:
   *
   * - `grip`: the bow's centre, taken from `+Z` with the stave along `+X`; a
   *   crossbow's stock contact beside the trigger.
   * - `string`: the nocking point, drawn back along `+Z` from brace to the kind's
   *   draw length.
   * - `nock`: the nocking point, facing `+Z`, where an arrow's nock sits and the
   *   drawing hand takes the string; it rides `string`.
   * - `rest`: the stave's `-X` side at the grip, square to the string
   *   `nockHeight` below the nocking point, where the arrow's shaft lies.
   * - `upperLimb`, `lowerLimb`: each limb's turn about the grip, following
   *   `string`; a crossbow's bow halves, toward `+X` and `-X`, turning about
   *   its centre.
   * - `foreEnd`, `rail`: a crossbow's supporting hand contact and fixed
   *   forward-facing presentation mark.
   * - `butt`, `trigger`, `stirrup`, `crank`: a crossbow's stock end, its trigger
   *   under the stock, the stirrup ahead of its fore-end, and the cranequin's
   *   crank the string follows.
   */
  export type Affordance =
    | "grip"
    | "string"
    | "nock"
    | "rest"
    | "upperLimb"
    | "lowerLimb"
    | "foreEnd"
    | "rail"
    | "butt"
    | "trigger"
    | "stirrup"
    | "crank";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: nock to nock along the string.
   * - `depth`: the stave's depth at its centre, back to belly, the grip's span.
   * - `brace`: a horse bow's and a recurve's brace height, belly to string; a
   *   longbow's follows its length by `BRACE`.
   * - `draw`: the force holding the string drawn the kind's `DRAW_LENGTH`,
   *   newtons.
   * - `nockHeight`: a hand-drawn bow's nocking point above square to its rest.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "depth"
    | "brace"
    | "draw"
    | "nockHeight"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    depth: "m",
    brace: "m",
    draw: "N",
    nockHeight: "m",
    mass: "kg",
  };

  /**
   * The read models: the longbow approximations S1, S2 and S3, Hoyt's 68 and 70
   * in recurves on a 25 in Grand Prix riser, and the Freddie Warrior and Zenith
   * horse bows.
   */
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

  /**
   * Each kind's models whole, the default first: the longbow approximations'
   * mass and draw at 30 in (Aston and Spencer, pp. 25-26, 29), the recurves'
   * bow lengths (Hoyt, p. 5) and the horse bows' length and mass (Bogentandler,
   * the makers' figures); a bow length is taken as nock to nock.
   */
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
        draw: 108 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
      s2: {
        mass: 0.868,
        draw: 101 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
      s3: {
        mass: 0.785,
        draw: 141 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
    },
    recurve: {
      hoyt68: { length: 68 * AutoMovieArchetypeUnits.INCH },
      hoyt70: { length: 70 * AutoMovieArchetypeUnits.INCH },
    },
    horseBow: {
      warrior: { length: 53 * AutoMovieArchetypeUnits.INCH, mass: 0.33 },
      zenith: { length: 48 * AutoMovieArchetypeUnits.INCH, mass: 0.315 },
    },
    crossbow: {},
  };

  /**
   * A recurve model's brace band, the maker's for its length on a 25 in Grand
   * Prix riser (Hoyt, p. 15).
   */
  export const BRACES: Readonly<
    Partial<
      Record<
        Model,
        Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>
      >
    >
  > = {
    hoyt68: {
      brace: AutoMovieArchetypeBand.metres(
        8.5 * AutoMovieArchetypeUnits.INCH,
        9 * AutoMovieArchetypeUnits.INCH,
        HOYT,
      ),
    },
    hoyt70: {
      brace: AutoMovieArchetypeBand.metres(
        8.75 * AutoMovieArchetypeUnits.INCH,
        9.5 * AutoMovieArchetypeUnits.INCH,
        HOYT,
      ),
    },
  };

  /**
   * A horse bow's draw weights as forces at 31 in, both makers' pages: "15 to
   * 60 lbs in 5 lb steps"; a longbow's draw is its model's.
   */
  export const WEIGHTS: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<Record<Weight, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    horseBow: {
      lb15: {
        draw: 15 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
      lb20: {
        draw: 20 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
      lb25: {
        draw: 25 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
      lb30: {
        draw: 30 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
      lb35: {
        draw: 35 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
      lb40: {
        draw: 40 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
      lb45: {
        draw: 45 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
      lb50: {
        draw: 50 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
      lb55: {
        draw: 55 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
      lb60: {
        draw: 60 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      },
    },
  };

  /**
   * The parameters: the kind, the model and a horse bow's draw weight, and any
   * free dimension fixed to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bow. */
    kind: Kind;

    /** Which of the kind's read models; picked from the seed when absent. */
    model?: Model;

    /**
     * A horse bow's draw weight; picked from the seed when absent. Other bows
     * have none.
     */
    weight?: Weight;

    /** The model's id, unique in a scene; `bow` when absent. */
    id?: string;
  }

  /**
   * The band of each free dimension a kind's model and draw weight leave, by
   * kind; a recurve's brace is its model's (`BRACES`).
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = BOW_BANDS;

  /**
   * The crossbow's places along its stock and its spanning gear, metres,
   * degrees and ratios, each Payne-Gallwey's (The Crossbow, 1903) unless marked
   * provisional: `stock`, its "Extreme length ... 3 ft." and `fore`, its depth
   * at the fore-end, 3¼ in (p. 93), its taper to the small end's 1¾ in not
   * drawn; `nut`, the nut's centre 14 in from the fore-end (p. 93); `rest`, the
   * string at rest 6 in ahead of the nut's centre (p. 116); `travel`, the
   * string's 5½ in "common distance ... along the stock to the catch of the
   * lock" (p. 134, read at the page image); `turns`, the cranequin's handle
   * "turned round in a complete circle thirty times" for it, and `handle`, that
   * handle's 9 in (p. 134); `axle`, the cranequin's pin "about seven inches
   * behind the catch" (p. 134); `trigger` and `triggerDiameter`, the trigger's
   * handle, "8¼ in. long and ⅜ in. diameter" (p. 98); `release`, the trigger's
   * point going "⅛ in. ... into the notch in the nut" (p. 98), taken as its
   * travel, provisional, since the handle's own travel is unread; `stirrup`,
   * its tread's width, the bow's 1⅝ in at its centre (p. 104); `thickness`, the
   * bow's "½ in." at its centre (p. 101), drawn as the bow's round section and
   * the stirrup's iron. The cranequin's axle direction and the stirrup's height
   * are not read: the axle is taken across the stock and the stirrup ahead of
   * the fore-end at the stock's top, provisional. The sporting crossbow's draw
   * weight is not read, so the crossbow has no `draw` and `launchSpeed` refuses
   * it: Payne-Gallwey states only his siege crossbow's 1,200 lb (p. 14), a
   * crossbow of another class; searched for #3481 without a figure: his
   * sporting types, measured reproductions of sporting and hunting crossbows
   * (makers list munition crossbows only), and German museum and research
   * catalogues of hunting crossbows ("Jagdarmbrust Zuggewicht").
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
    stock: 36 * AutoMovieArchetypeUnits.INCH,
    fore: 3.25 * AutoMovieArchetypeUnits.INCH,
    nut: 14 * AutoMovieArchetypeUnits.INCH,
    rest: 6 * AutoMovieArchetypeUnits.INCH,
    travel: 5.5 * AutoMovieArchetypeUnits.INCH,
    turns: 30,
    handle: 9 * AutoMovieArchetypeUnits.INCH,
    axle: 7 * AutoMovieArchetypeUnits.INCH,
    trigger: 8.25 * AutoMovieArchetypeUnits.INCH,
    triggerDiameter: 0.375 * AutoMovieArchetypeUnits.INCH,
    release: 0.125 * AutoMovieArchetypeUnits.INCH,
    stirrup: (13 / 8) * AutoMovieArchetypeUnits.INCH,
    thickness: 0.5 * AutoMovieArchetypeUnits.INCH,
  };

  /**
   * Reference numbers for the provisional launch model (Kooi, On the Mechanics
   * of the Bow and Arrow, 1983,
   * https://www.bio.vu.nl/thb/users/kooi/thesis.pdf): straight-end KL q=0.407
   * and efficiency=0.765 at arrow mass0.02 kg (p.117; Table4.29,p.161), and
   * modern-recurve B1 q=0.426 (Table2.6,p.46). Native q=A/(F D), with D the
   * full grip-to-nock draw; the energy integral starts at brace H (Kooi1994,
   * Eq3, https://www.bio.vu.nl/thb/users/kooi/kooi94.pdf). This prototype
   * reuses those numbers as authored stroke factors A/(F X), X=D-H, without
   * converting or calibrating their normalization. That reinterpretation, the
   * power-law curve and the borrowed efficiency are provisional for these
   * assets; launchSpeed does not reproduce native q or a measured force-draw
   * curve.
   */
  export const KOOI: Readonly<{
    straight: number;
    recurve: number;
    efficiency: number;
    arrow: number;
  }> = { straight: 0.407, recurve: 0.426, efficiency: 0.765, arrow: 0.02 };

  /**
   * Each limb's turn against the string's travel, the table `upperLimb` and
   * `lowerLimb` follow: `bowLimbs`, rows of the travel in metres and the turn
   * in degrees.
   */
  export const limbs: typeof bowLimbs = bowLimbs;

  /**
   * The provisional launch speed at a string travel, metres per second:
   * `bowLaunchSpeed`, under the explicit stroke-factor reinterpretation
   * documented by KOOI. It refuses an unread draw weight and does not
   * reconstruct a measured force-draw curve.
   */
  export const launchSpeed: typeof bowLaunchSpeed = bowLaunchSpeed;
}
