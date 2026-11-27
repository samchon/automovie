import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The quarterstaff's length, from a secondary source. */
const STAFF: string =
  "quarterstaff, a hardwood shaft 6 to 9 ft (1.8 to 2.7 m) long (Wikipedia, https://en.wikipedia.org/wiki/Quarterstaff)";

/** The spear's shaft and head, from a secondary source. */
const SPEAR: string =
  "Viking Age spears, heads of 20 to 60 cm on shafts of 2 to 3 m (Wikipedia, Viking Age arms and armour, https://en.wikipedia.org/wiki/Viking_Age_arms_and_armour)";

/** The cavalry lance, read at the Royal Armouries. */
const LANCE: string =
  "Royal Armouries, Pattern 1894 Lance: 2.76 m overall, 2.19 kg, a hide sling round the shaft's midpoint giving the hand its grip (https://royalarmouries.org/collection/first-world-war/type/rac-narrative-82.html)";

/** Lance heads, seen only in search results. */
const LANCE_HEADS: string =
  "the Pattern 1894 lance's head is not stated; the Royal Armouries' lance records VII.2860 (a 207 to 214 mm head) and VII.1433 (a 277 mm head), seen only in search results, give the range applied";

/** Catalogued spearheads' sockets, read in museum records. */
const SOCKETS: string =
  "a spearhead's socket, the shaft's end, where its record does not state it: the sockets read, Museum Wales' medieval spearhead's 23.5 mm (https://museum.wales/collections/online/object/1b6580d3-f332-34d4-a3e7-5f9b5e6080c7) and the Segontium Roman spearheads' about 19 and 16 mm (https://museum.wales/collections/online/object/06e68587-a7a8-3e9e-876d-c786513a288f, https://museum.wales/collections/online/object/ac74b18f-7c21-3b86-8546-be6de58baffa), applied";

/**
 * Two whole spears, read in museum records: later pieces than the Viking Age
 * spears whose lengths the spear's bands take.
 */
const SPEAR_MASS: string =
  "Metropolitan Museum 29.156.36, boar spear, French 1576: 1814.4 g (https://collectionapi.metmuseum.org/public/collection/v1/objects/34315); 14.25.394, spear, Western European 15th century: 2579.8 g (https://collectionapi.metmuseum.org/public/collection/v1/objects/26796); both later than the Viking Age spears the lengths come from";

/** A Pattern 1868 lance head, read at a maker of replicas, not at an original. */
const LANCE_HEAD: string =
  "A British 1868 Pattern lance head replica, not an original: Iron Gate Armory, blade 1.5 cm wide at its widest, head 180 g (https://irongatearmory.com/product/1868-pattern-lance-head-and-butt-cap/)";

/** The handle diameters hands rated most comfortable in a power grip. */
const POWER: string =
  "Kong and Lowe 2005, Int J Ind Ergon 35:495, handles of 30 to 40 mm rated most comfortable (https://stacks.cdc.gov/view/cdc/197408), applied to a lance's shaft at its grip, whose own diameter no record read gives";

/** Constructs the polearm archetype from its recipe. */
export namespace AutoMovieArchetypePolearm {
/**
 * A weapon on a long shaft: a staff or a spear held in two hands, or a cavalry
 * lance couched in one.
 *
 * It stands along `+Y` from its butt at the origin. The `shaft` is one bar the
 * two hands share, so the hands' spacing and their sliding along it are the
 * wielding act's choice of sites. A spear and a lance carry a flat head above
 * the shaft, its edges toward `+Z` and `-Z`; `length` is the shaft alone and
 * `headLength` the head above it. `tip` is the upper end, the way a thrust
 * goes, and `butt` the lower. A lance also declares `grip`, the sling at the
 * shaft's midpoint where the one hand holds it; the steel head puts the balance
 * ahead of it, so a couched lance's point is carried forward of the hand. A
 * thrown spear is `createJavelin`'s.
 *
 * @param params The kind, a spear's head and any dimension the author fixes.
 * @param seed The seed that picks the head left free and draws every dimension
 *   left free inside its band; absent, the first head and the middle of each
 *   band.
 * @returns The weapon.
 * @throws {AutoMovieArchetypeRefusal} For a head not of the kind, a fixed
 *   dimension outside its band or one the head gives, or a head length fixed on
 *   a staff, or a lance's shaft length fixed, which its head sets.
 */
export function create(
  params: AutoMovieArchetypePolearm.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypePolearm.Affordance, AutoMovieArchetypePolearm.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypePolearm.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypePolearm.Dimension>(
      "polearm",
      AutoMovieArchetypePolearm.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypePolearm.Kind = ArchetypeDraw.choice(
    "polearm",
    "kind",
    params.kind,
    AutoMovieArchetypePolearm.KINDS,
  );
  // A spear's head is one catalogued spearhead whole; a lance's shaft is the read lance's overall length less its head.
  const model: {
    figures: Readonly<Partial<Record<AutoMovieArchetypePolearm.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypePolearm.Model>(
    "model",
    params.model,
    AutoMovieArchetypePolearm.MODELS[kind],
  );
  const drawn: Partial<Record<AutoMovieArchetypePolearm.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypePolearm.BANDS[kind], AutoMovieArchetypePolearm.BANDS),
    ...model.figures,
  };
  const d: Partial<Record<AutoMovieArchetypePolearm.Dimension, number>> =
    kind === "lance"
      ? { ...drawn, length: AutoMovieArchetypePolearm.LANCE_LENGTH - drawn.headLength! }
      : drawn;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypePolearm.Affordance,
    AutoMovieArchetypePolearm.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: kind === "staff" ? "wood" : "composite",
    id: params.id,
    name: kind,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const length: number = d.length!;
  const head: number = d.headLength ?? 0;
  // The head carries its read mass as its share of the whole; the shaft carries the rest.
  const share: number = kind === "staff" ? 0 : d.headMass! / d.mass!;
  builder.rod("shaft", d.diameter! / 2, v(0, 0, 0), v(0, length, 0), {
    color: "#b98d5b",
    ...(kind === "staff" ? {} : { share: 1 - share }),
  });
  builder.affordance({
    id: "shaft",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, length / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "two-hand",
    aperture: d.diameter!,
    length,
  });
  if (kind === "lance")
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, length / 2, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: d.diameter!,
    });
  if (kind !== "staff")
    builder.box(
      "head",
      v(d.headWidth! * AutoMovieArchetypePolearm.HEAD_THICKNESS, head, d.headWidth!),
      v(0, length + head / 2, 0),
      { color: "#c9ccd1", share },
    );
  builder.affordance({
    id: "tip",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.upright(v(0, length + head, 0)),
    extent: null,
  });
  builder.affordance({
    id: "butt",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}

  /** The kinds of polearm. */
  export type Kind = "staff" | "spear" | "lance";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["staff", "spear", "lance"];

  /**
   * A head's thickness as a share of its read width: a construction proportion
   * that no act reads, since the head's read mass, not its volume, places the
   * balance.
   */
  export const HEAD_THICKNESS: number = 0.25;

  /**
   * The read lance's overall length, metres: the Pattern 1894's 2.76 m (Royal
   * Armouries).
   */
  export const LANCE_LENGTH: number = 2.76;

  /**
   * The catalogued spearheads that state their weight: Met 1989.220 and Museum
   * Wales' medieval iron head.
   */
  export type Model = "met1989" | "walesIron";

  /**
   * Each kind's heads whole, the default first, each as its record states it:
   *
   * - Met 1989.220, European ca. 800-1000: L. 54 cm, W. 4.8 cm, 444 g
   *   (https://collectionapi.metmuseum.org/public/collection/v1/objects/24939).
   * - Museum Wales, medieval iron spearhead: 362 mm long, 33.3 mm wide, 141.7 g
   *   (https://museum.wales/collections/online/object/4042a243-29ff-3c1d-803d-7c2dda0d54d6).
   *
   * The head's mass places the spear's balance, so a head whose record states
   * no weight is not a model: Museum Wales' socketed medieval head, its
   * Segontium and its Loughor Roman heads. No volume model of a head derives
   * it: a lozenge blade with its section's thickness a quarter of its width
   * gives the Met head's blade 287 g against the whole head's read 444 g and
   * the Wales head 131 g against its 141.7 g, and no weighed record gives the
   * socket that would close the gap.
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
    spear: {
      met1989: { headLength: 0.54, headWidth: 0.048, headMass: 0.444 },
      walesIron: { headLength: 0.362, headWidth: 0.0333, headMass: 0.1417 },
    },
  };

  /**
   * The affordance ids:
   *
   * - `shaft`: the shaft as one bar for both hands, taken from the `-Z` side, its
   *   length along `+Y`.
   * - `tip`: the upper end, a spear's point, facing up along the weapon.
   * - `butt`: the lower end, facing down.
   * - `grip`: a lance's sling at the shaft's midpoint, taken from the `-Z` side.
   */
  export type Affordance = "shaft" | "tip" | "butt" | "grip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: the shaft; a lance's is its overall length less its head.
   * - `headLength`: a spear's or a lance's head above the shaft.
   * - `headWidth`: the head's blade across, edge to edge.
   * - `headMass`: the head's mass, kilograms, its share of the whole placing the
   *   balance.
   * - `diameter`: the shaft's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "headLength"
    | "headWidth"
    | "headMass"
    | "diameter"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    headLength: "m",
    headWidth: "m",
    headMass: "kg",
    diameter: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, a spear's head, and any free dimension fixed to a
   * value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which polearm. */
    kind: Kind;

    /**
     * Which catalogued spearhead a spear carries; picked from the seed when
     * absent. A staff and a lance have none.
     */
    model?: Model;

    /** The model's id, unique in a scene; `polearm` when absent. */
    id?: string;
  }

  /** The band of each free dimension a head leaves, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    staff: {
      length: AutoMovieArchetypeBand.metres(1.8, 2.7, STAFF, true),
      diameter: AutoMovieArchetypeBand.metres(
        0.03,
        0.035,
        "a staff's thickness, not read at a source",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1,
        1.8,
        "an ash staff of these sizes at about 700 kg per cubic metre, not read at a source",
        true,
      ),
    },
    spear: {
      length: AutoMovieArchetypeBand.metres(2, 3, SPEAR, true),
      diameter: AutoMovieArchetypeBand.metres(0.016, 0.0235, SOCKETS, true),
      mass: AutoMovieArchetypeBand.of("kg", 1.8144, 2.5798, SPEAR_MASS),
    },
    lance: {
      headLength: AutoMovieArchetypeBand.metres(
        0.207,
        0.277,
        LANCE_HEADS,
        true,
      ),
      headWidth: AutoMovieArchetypeBand.metres(
        0.015,
        0.015,
        `${LANCE_HEAD}, applied to the Pattern 1894`,
        true,
      ),
      headMass: AutoMovieArchetypeBand.of(
        "kg",
        0.18,
        0.18,
        `${LANCE_HEAD}, applied to the Pattern 1894`,
        true,
      ),
      diameter: AutoMovieArchetypeBand.metres(0.03, 0.04, POWER, true),
      mass: AutoMovieArchetypeBand.of("kg", 2.19, 2.19, LANCE),
    },
  };
}
