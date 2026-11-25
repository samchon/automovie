import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";
import { LONG_GUN_BANDS } from "./LONG_GUN_BANDS";
import { LONG_GUN_MODELS } from "./LONG_GUN_MODELS";
import { LongGunLock } from "./LongGunLock";

/**
 * A long gun as a film prop: a carbine with a sliding stock, a pump shotgun, a
 * flintlock musket, a bolt-action rifle or a lever action. It models no effect;
 * the period and repeating kinds' mechanisms are `LongGunLock`'s.
 *
 * The gun lies along `+Z` from its butt plate at the origin to its muzzle, the
 * barrel's line at `y = 0`. The firing hand takes the `grip` behind the trigger
 * and the other hand the `foreEnd` from below; the `butt` goes to the shoulder.
 * The trigger's face is the length of pull ahead of the butt, as gunmakers
 * measure it. The stock ends behind the grip and a round neck joins it to the
 * receiver: a carbine's fixed buffer tube, a shotgun's wrist. A carbine's
 * `stock` slides back along its tube to lengthen the pull, carrying the butt; a
 * shotgun's `pump` slides back, carrying the fore-end.
 *
 * @param params The kind, a carbine's model and any dimension the author fixes.
 * @param seed The seed that picks the model left free and draws every dimension
 *   left free inside its band; absent, the first model and the middle of each
 *   band.
 * @returns The long gun.
 * @throws {AutoMovieArchetypeRefusal} For a model not of the kind, a fixed
 *   dimension outside its band, or one the model gives.
 */
export function createLongGun(
  params: createLongGun.IParams,
  seed?: number,
): AutoMovieArchetype<createLongGun.Affordance, createLongGun.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createLongGun.Dimension> =
    new AutoMovieArchetypeDrawSession<createLongGun.Dimension>(
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
  const builder: AutoMovieArchetypeBuilder<
    createLongGun.Affordance,
    createLongGun.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: createLongGun.NAMES[kind],
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const steel: string = "#2c2f33";
  const pull: number = d.lengthOfPull!;
  const breech: number = d.length! - d.barrel!;
  const hand: number = createLongGun.FORE_END / 2;
  // The supporting hand: a musket's at the swell, as the 1764 drill holds it (`LongGunLock.swell`); a modern gun's under the middle of its barrel.
  const fore: number =
    kind === "musket" ? LongGunLock.swell(d) : breech + d.barrel! * 0.45;

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
    frame: AutoMovieArchetypeFrame.facing(
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
    frame: AutoMovieArchetypeFrame.facing(
      v(0, -0.05, pull),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    travel: createLongGun.TRIGGER,
    parts: ["trigger"],
  });
  builder.affordance({
    id: "foreEnd",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0, fore),
      v(0, -1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * hand,
    length: 0.2,
    ...(kind === "shotgun" ? { rides: "pump" } : {}),
  });
  builder.affordance({
    id: "butt",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, -0.035, 0),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
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
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0, d.length!),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "sight",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.sightHeight!, breech)),
    extent: null,
  });
  if (kind === "musket") LongGunLock.musket(builder, d);
  else if (kind === "rifle") LongGunLock.bolt(builder, d);
  else if (kind === "leverAction") LongGunLock.lever(builder, d);
  else if (kind === "carbine")
    builder.affordance({
      id: "stock",
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, -0.035, 0),
        v(0, 1, 0),
        v(0, 0, -1),
      ),
      extent: null,
      travel: d.travel!,
      parts: ["stock"],
    });
  else
    builder.affordance({
      id: "pump",
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, 0, fore),
        v(0, -1, 0),
        v(0, 0, -1),
      ),
      extent: null,
      travel: d.travel!,
      parts: ["fore-end"],
    });
  return builder.build(d.mass!);
}

/** Companion types and bands of {@link createLongGun}. */
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

  /**
   * The fore-end's diameter where the hand holds it, metres: an estimate inside
   * the 30 to 50 mm power grip range of CCOHS
   * (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html).
   */
  export const FORE_END: number = 0.05;

  /** The trigger's pull, metres: an estimate, not published for either gun. */
  export const TRIGGER: number = 0.006;

  /**
   * The affordance ids:
   *
   * - `grip`: the firing hand's grip behind the trigger, taken from behind.
   * - `trigger`: the trigger's face.
   * - `foreEnd`: the supporting hand's hold under the barrel; on a shotgun it
   *   rides the pump.
   * - `butt`: the butt plate, which goes to the shoulder; on a carbine it rides
   *   the stock.
   * - `muzzle`: the end of the barrel, facing forward.
   * - `sight`: the rear of the sight line, above the barrel's line.
   * - `stock`: a carbine's stock, a slider drawn back to lengthen the pull.
   * - `pump`: a shotgun's fore-end slide, drawn back.
   * - `cock`, `spur`, `frizzen`, `pan`, `ramrod`, `pipe`, `bayonet`: a musket's
   *   lock, the cock's thumb piece riding it, its rod and their sockets
   *   (`LongGunLock.musket`); a musket's `muzzle` is a socket. `bayonetEntry`
   *   shares the `bayonet` socket's attitude ahead of the muzzle, where a
   *   socket bayonet starts its slide on.
   * - `bolt`, `boltSlide`, `magazine`: a bolt action's lift, its draw and its
   *   magazine (`LongGunLock.bolt`).
   * - `lever`, `hammer`: a lever action's lever and the hammer that follows it
   *   (`LongGunLock.lever`).
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
    | "spur"
    | "frizzen"
    | "pan"
    | "ramrod"
    | "pipe"
    | "bayonet"
    | "bayonetEntry"
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
   * - `lengthOfPull`: from the butt plate to the trigger's face, a carbine's with
   *   its stock in.
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
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
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

  /**
   * The read models: Colt's carbines R0977HB heavy barrel, R0979 and CR6921;
   * the Short Land musket; the M1903 and the Kar 98k.
   */
  export type Model =
    | "r0977hb"
    | "r0979"
    | "cr6921"
    | "shortLand"
    | "m1903"
    | "kar98k";

  /**
   * Each kind's models whole, the default first: the Colt sheet's weights, 6.9
   * lb (3.13 kg), 6.5 lb (2.95 kg) and 6.4 lb (2.90 kg); the Short Land
   * musket's length and barrel (Museums Victoria ST 21813); the M1903's 43.46
   * in, 8.69 lb and 2,647 ft/s with M1 ball (TM 9-1270, 1944, par. 4, pp.
   * 18-19, https://archive.org/download/1944TM9-1270/1944TM9-1270_djvu.txt),
   * and the Kar 98k's 43.5 in, 23.4 in barrel, about 9 lb and about 2,800 ft/s
   * (War Department, German Infantry Weapons, 1943, p. 23,
   * https://archive.org/download/GermanInfantryWeapons1943/GermanInfantryWeapons1943_djvu.txt,
   * a US assessment, not the maker's). A shotgun and a lever action have one
   * read gun each, their bands.
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
  > = LONG_GUN_MODELS;

  /**
   * The parameters: the kind, a carbine's model, and any free dimension fixed
   * to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which long gun. */
    kind: Kind;

    /**
     * Which of Colt's carbines; picked from the seed when absent. A shotgun has
     * none.
     */
    model?: Model;

    /** The model's id, unique in a scene; `longGun` when absent. */
    id?: string;
  }

  /** The band of each free dimension a model leaves, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = LONG_GUN_BANDS;
}
