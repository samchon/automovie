import { Vector3 } from "@automovie/engine";

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
import { FlintLock } from "./FlintLock";
import { LockTimes } from "./LockTimes";
import { LongGunLock } from "./LongGunLock";

/** A carbine's published data, from its maker. */
const CARBINE: string =
  "Colt M4 Carbine specification sheet 2020, R0977HB, R0979 and CR6921 (https://media.shootingsportsmedia.com/downloads/colt-2020-m4-specsheet-rnd7-web.pdf)";

/** A pump shotgun's published data. */
const SHOTGUN: string =
  "Mossberg 590A1 7-shot, product page (https://www.mossberg.com/590a1-m-lok-50765.html)";

/** A lever action's published data, from its maker. */
const LEVER: string =
  "Marlin 336 Classic 70504, product page: .30-30 Win, 20.25 in barrel, 38.625 in overall, 13.38 in length of pull, 7.5 lb, 6-round tube magazine (https://www.marlinfirearms.com/s/model_70504)";

/** The Graz firing tests of historic flintlocks. */
const GRAZ: string =
  "Krenn, Kalaus and Hall, Material History Review 42 (1995), pp. 102-107, Table 1: five flintlock muskets fired at their muzzles 451 to 494 m/s, electrically ignited (https://journals.lib.unb.ca/index.php/MCR/article/download/17669/18944)";

/** The two pulls read on the gun pages here, which a gun whose pull no record gives borrows. */
const PULLS: Readonly<{ shotgun: number; lever: number }> = {
  shotgun: 13.87 * ArchetypeUnits.INCH,
  lever: 13.38 * ArchetypeUnits.INCH,
};

/** A bead's or a front sight's height above the barrel's line, which no maker or record publishes: an estimate. */
const BEAD: IArchetypeBand = ArchetypeBand.metres(
  0.015,
  0.025,
  "a bead's or a front sight's height above the barrel's line, an estimate: no maker or record publishes it (searched: Mossberg's, Marlin's and Ruger's pages, TM 9-1270, FM 23-10, Museums Victoria's musket record; records-firearms-rifles.md, records-firearms-flintlock.md)",
  true,
);

/** Positions along the gun no maker publishes. */
const UNPUBLISHED: string = "not published by the maker; an estimate";

/**
 * A long gun as a film prop: a carbine with a sliding stock, a pump shotgun, a flintlock musket, a bolt-action rifle or a lever action. It models no effect; the period and repeating kinds' mechanisms are `LongGunLock`'s.
 *
 * The gun lies along `+Z` from its butt plate at the origin to its muzzle, the barrel's line at `y = 0`. The firing hand takes the `grip` behind the trigger and the other hand the `foreEnd` from below; the `butt` goes to the shoulder. The trigger's face is the length of pull ahead of the butt, as gunmakers measure it. The stock ends behind the grip and a round neck joins it to the receiver: a carbine's fixed buffer tube, a shotgun's wrist. A carbine's `stock` slides back along its tube to lengthen the pull, carrying the butt; a shotgun's `pump` slides back, carrying the fore-end.
 *
 * @param params The kind, a carbine's model and any dimension the author fixes.
 * @param seed The seed that picks the model left free and draws every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The long gun.
 * @throws {ArchetypeRefusal} For a model not of the kind, a fixed dimension outside its band, or one the model gives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is and is not modelled, how the gun lies and what each contact is.
 * @evidence contracts/development/implementation.md#principled-implementation Rods and boxes along the barrel's line from the published overall and barrel lengths; the trigger stands at the length of pull from the butt plate, the measure that fits a gun to an arm, and the carbine's stock travel is the difference between its published extended and retracted lengths. The stock stops short of the grip so the firing hand's hold stands clear, and the fixed tube it slides on is longer than the travel, so the drawn stock never parts from the receiver.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the model, draw the other dimensions, lay the stock, neck, receiver, barrel and fore-end, then the contacts and the one slider.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No magazine, sights' shape or sling; the sight line is a frame above the barrel.
 * @evidence contracts/development/implementation.md#efficient-algorithms Seven parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createLongGun(
  params: createLongGun.IParams,
  seed?: number | string,
): Archetype<createLongGun.Affordance, createLongGun.Dimension> {
  const draw: ArchetypeDrawSession<createLongGun.Dimension> =
    new ArchetypeDrawSession<createLongGun.Dimension>(
      "longGun",
      createLongGun.UNITS,
      seed,
      params,
    );
  const kind: createLongGun.Kind = ArchetypeDraw.choice(
    "longGun",
    "kind",
    params.kind,
    createLongGun.KINDS,
  );
  // A carbine is one of Colt's three, each weighed whole; a shotgun has one read model, its bands.
  const model: {
    figures: Readonly<Partial<Record<createLongGun.Dimension, number>>>;
  } = draw.model<createLongGun.Model>(
    "model",
    params.model,
    createLongGun.MODELS[kind],
  );
  const d: Partial<Record<createLongGun.Dimension, number>> = {
    ...draw.dimensions(createLongGun.BANDS[kind], createLongGun.BANDS),
    ...model.figures,
  };
  const builder: ArchetypeBuilder<
    createLongGun.Affordance,
    createLongGun.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: createLongGun.NAMES[kind],
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const steel: string = "#2c2f33";
  const pull: number = d.lengthOfPull!;
  const breech: number = d.length! - d.barrel!;
  const hand: number = createLongGun.FORE_END / 2;
  const fore: number = breech + d.barrel! * 0.45;

  // Where the stock ends, behind the grip by the room a hand and its mark take: picture only.
  const neck: number = pull - 0.175;

  // Butt to muzzle: the stock, the neck that joins it to the receiver, the receiver over the trigger, the barrel and the fore-end round it.
  builder.box("stock", v(0.04, 0.11, neck), v(0, -0.035, neck / 2), {
    color: steel,
    density: 0.5,
  });

  // A carbine's neck is its fixed buffer tube, reaching back far enough to stay inside the stock at full travel; a shotgun's is the wrist of its fixed stock.
  builder.rod(
    kind === "carbine" ? "buffer-tube" : "wrist",
    0.015,
    v(0, 0, kind === "carbine" ? neck - d.travel! - 0.012 : neck - 0.02),
    v(0, 0, pull - 0.08),
    { color: steel },
  );
  builder.box(
    "receiver",
    v(0.045, 0.07, breech - pull + 0.1),
    v(0, 0, (pull - 0.1 + breech) / 2),
    { color: steel },
  );
  builder.rod("barrel", 0.011, v(0, 0, breech), v(0, 0, d.length!), {
    color: steel,
  });
  builder.rod("fore-end", hand, v(0, 0, fore - 0.1), v(0, 0, fore + 0.1), {
    color: "#55595f",
    density: 0.3,
  });
  builder.rod(
    "grip",
    0.02,
    v(0, -0.035, pull - 0.055),
    v(0, -0.13, pull - 0.055),
    { color: steel },
  );
  builder.box("trigger", v(0.008, 0.02, 0.006), v(0, -0.05, pull - 0.003), {
    color: "#55595f",
  });

  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      v(0, -0.0825, pull - 0.055),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 0.04,
    length: 0.095,
  });
  builder.affordance({
    id: "trigger",
    kind: "trigger",
    frame: ArchetypeFrame.facing(v(0, -0.05, pull), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    travel: createLongGun.TRIGGER,
    parts: ["trigger"],
  });
  builder.affordance({
    id: "foreEnd",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(v(0, 0, fore), v(0, -1, 0), v(0, 0, 1)),
    extent: null,
    grip: "power",
    aperture: 2 * hand,
    length: 0.2,
    ...(kind === "shotgun" ? { rides: "pump" } : {}),
  });
  builder.affordance({
    id: "butt",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(0, -0.035, 0), v(0, 0, -1), v(1, 0, 0)),
    extent: null,
    width: 0.04,
    depth: 0.11,
    ...(kind === "carbine" ? { rides: "stock" } : {}),
  });
  // A muzzle-loader's muzzle is a socket the cartridge and the rod go into; the others' a surface along the bore.
  builder.affordance({
    id: "muzzle",
    kind: kind === "musket" ? "socket" : "surface",
    direction: "along",
    frame: ArchetypeFrame.facing(v(0, 0, d.length!), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
  });
  builder.affordance({
    id: "sight",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, d.sightHeight!, breech)),
    extent: null,
  });
  if (kind === "musket") LongGunLock.musket(builder, d);
  else if (kind === "rifle") LongGunLock.bolt(builder, d);
  else if (kind === "leverAction") LongGunLock.lever(builder, d);
  else if (kind === "carbine")
    builder.affordance({
      id: "stock",
      kind: "slider",
      frame: ArchetypeFrame.facing(v(0, -0.035, 0), v(0, 1, 0), v(0, 0, -1)),
      extent: null,
      travel: d.travel!,
      parts: ["stock"],
    });
  else
    builder.affordance({
      id: "pump",
      kind: "slider",
      frame: ArchetypeFrame.facing(v(0, 0, fore), v(0, -1, 0), v(0, 0, -1)),
      extent: null,
      travel: d.travel!,
      parts: ["fore-end"],
    });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createLongGun}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions of kinds and of a carbine's read models, each weighed whole, and one cited band per dimension a model leaves.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The length of pull, the two hands' places and the butt a shouldering act reads (#3374).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `travel` is the carbine's stock's or the shotgun's pump's slide; the period and repeating kinds' sliders are `LongGunLock`'s, their travels its derivations and estimates. No mass between two carbines is drawn, and the army manual's lengths stay out of the maker's carbines.
 */
export namespace createLongGun {
  /** The kinds of long gun. */
  export type Kind = "carbine" | "shotgun" | "musket" | "rifle" | "leverAction";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "carbine",
    "shotgun",
    "musket",
    "rifle",
    "leverAction",
  ];

  /** Each kind's model name. */
  export const NAMES: Readonly<Record<Kind, string>> = {
    carbine: "carbine",
    shotgun: "pump shotgun",
    musket: "flintlock musket",
    rifle: "bolt-action rifle",
    leverAction: "lever-action rifle",
  };

  /** The fore-end's diameter where the hand holds it, metres: an estimate inside the 30 to 50 mm power grip range of CCOHS (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html). */
  export const FORE_END: number = 0.05;

  /** The trigger's pull, metres: an estimate, not published for either gun. */
  export const TRIGGER: number = 0.006;

  /**
   * The affordance ids:
   *
   * - `grip`: the firing hand's grip behind the trigger, taken from behind.
   * - `trigger`: the trigger's face.
   * - `foreEnd`: the supporting hand's hold under the barrel; on a shotgun it rides the pump.
   * - `butt`: the butt plate, which goes to the shoulder; on a carbine it rides the stock.
   * - `muzzle`: the end of the barrel, facing forward.
   * - `sight`: the rear of the sight line, above the barrel's line.
   * - `stock`: a carbine's stock, a slider drawn back to lengthen the pull.
   * - `pump`: a shotgun's fore-end slide, drawn back.
   * - `cock`, `frizzen`, `pan`, `ramrod`, `pipe`, `bayonet`: a musket's lock, its rod and their sockets (`LongGunLock.musket`); a musket's `muzzle` is a socket.
   * - `bolt`, `boltSlide`, `magazine`: a bolt action's lift, its draw and its magazine (`LongGunLock.bolt`).
   * - `lever`, `hammer`: a lever action's lever and the hammer that follows it (`LongGunLock.lever`).
   */
  export type Affordance =
    | "grip"
    | "trigger"
    | "foreEnd"
    | "butt"
    | "muzzle"
    | "sight"
    | "stock"
    | "pump"
    | "cock"
    | "frizzen"
    | "pan"
    | "ramrod"
    | "pipe"
    | "bayonet"
    | "bolt"
    | "boltSlide"
    | "magazine"
    | "lever"
    | "hammer";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: overall, a carbine's with its stock in.
   * - `barrel`: the barrel.
   * - `lengthOfPull`: from the butt plate to the trigger's face, a carbine's with its stock in.
   * - `travel`: how far the carbine's stock or the shotgun's pump slides.
   * - `sightHeight`: the sight line above the barrel's line.
   * - `muzzleVelocity`: the shot's speed leaving the muzzle, metres per second.
   * - `lockTime`: seconds from the trigger's break to the discharge.
   * - `ball`: a musket's ball's diameter, the calibre of the projectile it fires.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "barrel"
    | "lengthOfPull"
    | "travel"
    | "sightHeight"
    | "muzzleVelocity"
    | "lockTime"
    | "ball"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    barrel: "m",
    lengthOfPull: "m",
    travel: "m",
    sightHeight: "m",
    muzzleVelocity: "m/s",
    lockTime: "s",
    ball: "m",
    mass: "kg",
  };

  /** The read models: Colt's carbines R0977HB heavy barrel, R0979 and CR6921; the Short Land musket; the M1903 and the Kar 98k. */
  export type Model =
    | "r0977hb"
    | "r0979"
    | "cr6921"
    | "shortLand"
    | "m1903"
    | "kar98k";

  /**
   * Each kind's models whole, the default first: the Colt sheet's weights, 6.9 lb (3.13 kg), 6.5 lb (2.95 kg) and 6.4 lb (2.90 kg); the Short Land musket's length and barrel (Museums Victoria ST 21813); the M1903's 43.46 in, 8.69 lb and 2,647 ft/s with M1 ball (TM 9-1270, 1944, par. 4, pp. 18-19, https://archive.org/download/1944TM9-1270/1944TM9-1270_djvu.txt), and the Kar 98k's 43.5 in, 23.4 in barrel, about 9 lb and about 2,800 ft/s (War Department, German Infantry Weapons, 1943, p. 23, https://archive.org/download/GermanInfantryWeapons1943/GermanInfantryWeapons1943_djvu.txt, a US assessment, not the maker's). A shotgun and a lever action have one read gun each, their bands.
   */
  export const MODELS: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<
          Partial<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>
        >
      >
    >
  > = {
    carbine: {
      r0977hb: { mass: 3.13 },
      r0979: { mass: 2.95 },
      cr6921: { mass: 2.9 },
    },
    musket: {
      shortLand: {
        length: 147.3 * ArchetypeUnits.CENTIMETRE,
        barrel: 106.8 * ArchetypeUnits.CENTIMETRE,
      },
    },
    rifle: {
      m1903: {
        length: 43.46 * ArchetypeUnits.INCH,
        mass: 8.69 * ArchetypeUnits.POUND,
        muzzleVelocity: 2647 * ArchetypeUnits.FOOT,
      },
      kar98k: {
        length: 43.5 * ArchetypeUnits.INCH,
        barrel: 23.4 * ArchetypeUnits.INCH,
        mass: 9 * ArchetypeUnits.POUND,
        muzzleVelocity: 2800 * ArchetypeUnits.FOOT,
      },
    },
  };

  /** The parameters: the kind, a carbine's model, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which long gun. */
    kind: Kind;

    /** Which of Colt's carbines; picked from the seed when absent. A shotgun has none. */
    model?: Model;

    /** The model's id, unique in a scene; `longGun` when absent. */
    id?: string;
  }

  /** The band of each free dimension a model leaves, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    carbine: {
      length: ArchetypeBand.metres(
        30.5 * ArchetypeUnits.INCH,
        30.5 * ArchetypeUnits.INCH,
        `${CARBINE}: 30.5 in with the stock retracted, all three`,
      ),
      barrel: ArchetypeBand.metres(
        14.5 * ArchetypeUnits.INCH,
        14.5 * ArchetypeUnits.INCH,
        `${CARBINE}: 14.5 in`,
      ),
      lengthOfPull: ArchetypeBand.metres(
        10.75 * ArchetypeUnits.INCH,
        0.29,
        `a collapsed adjustable stock's 10.75 in pull, seen only in retailer listings; ${UNPUBLISHED} for this carbine`,
        true,
      ),
      travel: ArchetypeBand.metres(
        (33.75 - 30.5) * ArchetypeUnits.INCH,
        (33.75 - 30.5) * ArchetypeUnits.INCH,
        `${CARBINE}: 33.75 in extended less 30.5 in retracted`,
      ),
      sightHeight: ArchetypeBand.metres(
        2.6 * ArchetypeUnits.INCH,
        2.6 * ArchetypeUnits.INCH,
        "a 2.6 in sight plane above the bore, seen only in search results",
        true,
      ),
      muzzleVelocity: ArchetypeBand.of(
        "m/s",
        2970 * ArchetypeUnits.FOOT,
        2970 * ArchetypeUnits.FOOT,
        "FM 3-22.9, Rifle Marksmanship M16-/M4-Series Weapons (2008), Table 2-1, M4-series muzzle velocity 2,970 fps (https://archive.org/details/fm-3-22.9-rifle-marksmanship-m-16-m-4-series-weapons)",
      ),
      lockTime: ArchetypeBand.of(
        "s",
        LockTimes.AR15,
        LockTimes.AR15,
        "an AR-15's standard hammer's 10 ms, Geissele's Hi-Speed National Match trigger instruction sheet, p. 2, the maker's figure, its method not stated",
        true,
      ),
    },
    shotgun: {
      length: ArchetypeBand.metres(
        39.5 * ArchetypeUnits.INCH,
        39.5 * ArchetypeUnits.INCH,
        `${SHOTGUN}: 39.5 in`,
      ),
      barrel: ArchetypeBand.metres(
        18.5 * ArchetypeUnits.INCH,
        18.5 * ArchetypeUnits.INCH,
        `${SHOTGUN}: 18.5 in`,
      ),
      lengthOfPull: ArchetypeBand.metres(
        13.87 * ArchetypeUnits.INCH,
        13.87 * ArchetypeUnits.INCH,
        `${SHOTGUN}: 13.87 in`,
      ),
      muzzleVelocity: ArchetypeBand.of(
        "m/s",
        1325 * ArchetypeUnits.FOOT,
        1325 * ArchetypeUnits.FOOT,
        "Federal Premium Buckshot P154, 2 3/4 in 00 buck, 1325 fps, its test barrel not stated (https://le.vistaoutdoor.com/ammunition/federal/buckshot/details.aspx?id=472)",
        true,
      ),
      lockTime: LockTimes.BORROWED,
      travel: ArchetypeBand.metres(
        0.08,
        0.1,
        `pump stroke, ${UNPUBLISHED}`,
        true,
      ),
      sightHeight: BEAD,
      mass: ArchetypeBand.of(
        "kg",
        3.18,
        3.18,
        `${SHOTGUN}: 7, the unit not stated on the page and taken as pounds`,
        true,
      ),
    },
    musket: {
      lengthOfPull: ArchetypeBand.metres(
        PULLS.lever,
        PULLS.shotgun,
        "borrowed from the Marlin 336's and the Mossberg 590A1's read pulls because no record gives the Short Land's length of pull (searched: Museums Victoria, the London Museum, Colonial Williamsburg, Griffiths 1856; records-firearms-flintlock.md)",
        true,
      ),
      sightHeight: BEAD,
      mass: ArchetypeBand.of(
        "kg",
        10 * ArchetypeUnits.POUND,
        10 * ArchetypeUnits.POUND,
        "borrowed from Griffiths, The Artillerist's Manual (1856), p. 1, \"the flintlock musket\" of 10 lb, a US musket's (https://www.gutenberg.org/ebooks/73341.txt.utf-8), because no record gives a Short Land's weight (searched: Museums Victoria, the London Museum, the Royal Armouries, the National Army Museum; records-firearms-flintlock.md)",
        true,
      ),
      muzzleVelocity: ArchetypeBand.of(
        "m/s",
        451,
        494,
        `borrowed from ${GRAZ}, because no measured velocity of a British service musket at its service charge was found (searched: Robins 1805, Griffiths 1856, Graz 1995; records-firearms-flintlock.md)`,
        true,
      ),
      lockTime: FlintLock.TIME,
      ball: ArchetypeBand.metres(
        0.689 * ArchetypeUnits.INCH,
        0.689 * ArchetypeUnits.INCH,
        "borrowed from Griffiths, The Artillerist's Manual (1856), p. 1: the .753 in bore musket of 1842 fires a .689 in ball (https://www.gutenberg.org/ebooks/73341.txt.utf-8), because no record gives the Short Land's ball; the same bore as its nominal .75 (searched: Museums Victoria, the London Museum; records-firearms-flintlock.md)",
        true,
      ),
    },
    rifle: {
      barrel: ArchetypeBand.metres(
        20 * ArchetypeUnits.INCH,
        MODELS.rifle!.kar98k!.barrel!,
        "borrowed from Ruger's American Gen II 46902's 20 in barrel (https://ruger.com/products/americanRifleGenII/specSheets/46902.html) to the Kar 98k's, because neither M1903 manual gives its barrel's length (searched: TM 9-1270, FM 23-10; records-firearms-rifles.md)",
        true,
      ),
      lengthOfPull: ArchetypeBand.metres(
        12 * ArchetypeUnits.INCH,
        13.75 * ArchetypeUnits.INCH,
        "borrowed from Ruger's American Gen II 46902's 12 to 13.75 in pull (https://ruger.com/products/americanRifleGenII/specSheets/46902.html), because neither service rifle's manual gives its pull (searched: TM 9-1270, FM 23-10, German Infantry Weapons 1943; records-firearms-rifles.md)",
        true,
      ),
      sightHeight: BEAD,
      lockTime: ArchetypeBand.of(
        "s",
        LockTimes.M1903,
        LockTimes.M1903,
        "borrowed from the M1903's service firing pin's 5.7 ms (Garand, US Patent 1,780,521, https://patents.google.com/patent/US1780521A/en) because no measured Mauser 98 lock time was found (searched: records-firearms-locktime.md)",
        true,
      ),
    },
    leverAction: {
      length: ArchetypeBand.metres(
        38.625 * ArchetypeUnits.INCH,
        38.625 * ArchetypeUnits.INCH,
        LEVER,
      ),
      barrel: ArchetypeBand.metres(
        20.25 * ArchetypeUnits.INCH,
        20.25 * ArchetypeUnits.INCH,
        LEVER,
      ),
      lengthOfPull: ArchetypeBand.metres(PULLS.lever, PULLS.lever, LEVER),
      sightHeight: BEAD,
      mass: ArchetypeBand.of(
        "kg",
        7.5 * ArchetypeUnits.POUND,
        7.5 * ArchetypeUnits.POUND,
        LEVER,
      ),
      muzzleVelocity: ArchetypeBand.of(
        "m/s",
        2390 * ArchetypeUnits.FOOT,
        2390 * ArchetypeUnits.FOOT,
        "Winchester .30-30 Win 150 gr Power-Point, 2390 fps, its test barrel not stated (https://winchester.com/Products/Ammunition/Rifle/Power-Point)",
        true,
      ),
      lockTime: LockTimes.BORROWED,
    },
  };
}
