import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The quarterstaff's length, from a secondary source. */
const STAFF: string =
  "quarterstaff, a hardwood shaft 6 to 9 ft (1.8 to 2.7 m) long (Wikipedia, https://en.wikipedia.org/wiki/Quarterstaff)";

/** The spear's shaft and head, from a secondary source. */
const SPEAR: string =
  "Viking Age spears, heads of 20 to 60 cm on shafts of 2 to 3 m (Wikipedia, Viking Age arms and armour, https://en.wikipedia.org/wiki/Viking_Age_arms_and_armour)";

/** The cavalry lance, read at the Royal Armouries, and its other patterns' records seen only in search results. */
const LANCE: string =
  "Royal Armouries, Pattern 1894 Lance: 2.76 m overall, 2.19 kg, a hide sling round the shaft's midpoint giving the hand its grip (https://royalarmouries.org/collection/first-world-war/type/rac-narrative-82.html); its records VII.2860 (2328 mm, 1.672 kg, a 207 to 214 mm head), VII.1433 (2625 mm, a 277 mm head) and India Pattern 1868 (2840 mm, 2.1 kg), seen only in search results";

/** Catalogued spearheads' widths, socket diameters and masses, read in museum records. */
const SPEARHEAD: string =
  "Metropolitan Museum 1989.220, European spearhead ca. 800-1000: W. 4.8 cm, 444 g (https://collectionapi.metmuseum.org/public/collection/v1/objects/24939); Museum Wales medieval iron spearhead: width 33.3 mm, 141.7 g (https://museum.wales/collections/online/object/4042a243-29ff-3c1d-803d-7c2dda0d54d6); medieval spearhead: blade 36 mm wide, socket 23.5 mm across (https://museum.wales/collections/online/object/1b6580d3-f332-34d4-a3e7-5f9b5e6080c7); Roman spearheads, Segontium: blades 37 and 32 mm wide, sockets about 19 and 16 mm across (https://museum.wales/collections/online/object/06e68587-a7a8-3e9e-876d-c786513a288f, https://museum.wales/collections/online/object/ac74b18f-7c21-3b86-8546-be6de58baffa); Roman spearhead, Loughor: blade 27 mm wide (https://museum.wales/collections/online/object/431f598b-53fd-3500-953c-30ea6e544917)";

/** Two whole spears, read in museum records: later pieces than the Viking Age spears whose lengths the spear's bands take. */
const SPEAR_MASS: string =
  "Metropolitan Museum 29.156.36, boar spear, French 1576: 1814.4 g (https://collectionapi.metmuseum.org/public/collection/v1/objects/34315); 14.25.394, spear, Western European 15th century: 2579.8 g (https://collectionapi.metmuseum.org/public/collection/v1/objects/26796); both later than the Viking Age spears the lengths come from";

/** A Pattern 1868 lance head, read at a maker of replicas, not at an original. */
const LANCE_HEAD: string =
  "A British 1868 Pattern lance head replica, not an original: Iron Gate Armory, blade 1.5 cm wide at its widest, head 180 g (https://irongatearmory.com/product/1868-pattern-lance-head-and-butt-cap/)";

/** The handle diameters hands rated most comfortable in a power grip. */
const POWER: string =
  "Kong and Lowe 2005, Int J Ind Ergon 35:495, handles of 30 to 40 mm rated most comfortable (https://stacks.cdc.gov/view/cdc/197408), applied to a lance's shaft at its grip, whose own diameter no record read gives";

/**
 * A weapon on a long shaft: a staff or a spear held in two hands, or a cavalry lance couched in one.
 *
 * It stands along `+Y` from its butt at the origin. The `shaft` is one bar the two hands share, so the hands' spacing and their sliding along it are the wielding act's choice of sites. A spear and a lance carry a flat head above the shaft, its edges toward `+Z` and `-Z`; `length` is the shaft alone and `headLength` the head above it. `tip` is the upper end, the way a thrust goes, and `butt` the lower. A lance also declares `grip`, the sling at the shaft's midpoint where the one hand holds it; the steel head puts the balance ahead of it, so a couched lance's point is carried forward of the hand. A thrown spear is `createJavelin`'s.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The weapon.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or a head length fixed on a staff.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the weapon stands, how the hands share the shaft, what the lengths measure and the two ends.
 * @evidence contracts/development/implementation.md#principled-implementation A shaft rod and, for a spear and a lance, a head box of the read head width carrying the drawn head mass as its share of the whole, the shaft the rest, so the balance point moves toward the head by the read masses; mass properties follow from the parts under the drawn mass.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the shaft and its bar, a lance's grip, the head, the two ends.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No socket, lugs or butt cap; the head's thickness is a construction proportion of its read width, which no act reads, since the head's mass, not its volume, places the balance.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part for a staff, two for a spear or a lance.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createPolearm(
  params: createPolearm.IParams,
  seed?: number | string,
): Archetype<createPolearm.Affordance, createPolearm.Dimension> {
  const kind: createPolearm.Kind = ArchetypeDraw.choice(
    "polearm",
    "kind",
    params.kind,
    createPolearm.KINDS,
  );
  const d: Partial<Record<createPolearm.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "polearm",
      createPolearm.BANDS[kind],
      seed,
      params,
      createPolearm.BANDS,
    );
  const builder: ArchetypeBuilder<
    createPolearm.Affordance,
    createPolearm.Dimension
  > = new ArchetypeBuilder({
    archetype: "polearm",
    id: params.id,
    name: kind,
    dimensions: d,
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
    frame: ArchetypeFrame.facing(v(0, length / 2, 0), v(0, 0, -1), v(0, 1, 0)),
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
      frame: ArchetypeFrame.facing(
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
      v(d.headWidth! * createPolearm.HEAD_THICKNESS, head, d.headWidth!),
      v(0, length + head / 2, 0),
      { color: "#c9ccd1", share },
    );
  builder.affordance({
    id: "tip",
    kind: "surface",
    direction: "along",
    frame: ArchetypeFrame.upright(v(0, length + head, 0)),
    extent: null,
  });
  builder.affordance({
    id: "butt",
    kind: "surface",
    direction: "along",
    frame: ArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createPolearm}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from or that it is an estimate.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind, in metres and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shaft with sites along it, the two ends, the lengths and the mass a two-handed strike or thrust reads (#3202's spear and staff), and the lance's grip a couched charge reads (#3466, #3482).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A staff has no head length band, so fixing one on a staff is refused.
 */
export namespace createPolearm {
  /** The kinds of polearm. */
  export type Kind = "staff" | "spear" | "lance";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["staff", "spear", "lance"];

  /** A head's thickness as a share of its read width: a construction proportion that no act reads, since the head's read mass, not its volume, places the balance. */
  export const HEAD_THICKNESS: number = 0.25;

  /**
   * The affordance ids:
   *
   * - `shaft`: the shaft as one bar for both hands, taken from the `-Z` side, its length along `+Y`.
   * - `tip`: the upper end, a spear's point, facing up along the weapon.
   * - `butt`: the lower end, facing down.
   * - `grip`: a lance's sling at the shaft's midpoint, taken from the `-Z` side.
   */
  export type Affordance = "shaft" | "tip" | "butt" | "grip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: the shaft.
   * - `headLength`: a spear's or a lance's head above the shaft.
   * - `headWidth`: the head's blade across, edge to edge.
   * - `headMass`: the head's mass, kilograms, its share of the whole placing the balance.
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which polearm. */
    kind: Kind;

    /** The model's id, unique in a scene; `polearm` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    staff: {
      length: ArchetypeBand.metres(1.8, 2.7, STAFF, true),
      diameter: ArchetypeBand.metres(
        0.03,
        0.035,
        "a staff's thickness, not read at a source",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        1,
        1.8,
        "an ash staff of these sizes at about 700 kg per cubic metre, not read at a source",
        true,
      ),
    },
    spear: {
      length: ArchetypeBand.metres(2, 3, SPEAR, true),
      headLength: ArchetypeBand.metres(0.2, 0.6, SPEAR, true),
      headWidth: ArchetypeBand.metres(0.027, 0.048, SPEARHEAD),
      headMass: ArchetypeBand.of("kg", 0.1417, 0.444, SPEARHEAD),
      diameter: ArchetypeBand.metres(
        0.016,
        0.0235,
        `${SPEARHEAD}: the shaft's end the sockets take`,
      ),
      mass: ArchetypeBand.of("kg", 1.8144, 2.5798, SPEAR_MASS),
    },
    lance: {
      length: ArchetypeBand.metres(
        2.625 - 0.277,
        2.84 - 0.207,
        `${LANCE}: the shaft is the 2.625 to 2.84 m overall less the 207 to 277 mm heads`,
        true,
      ),
      headLength: ArchetypeBand.metres(0.207, 0.277, LANCE, true),
      headWidth: ArchetypeBand.metres(0.015, 0.015, LANCE_HEAD),
      headMass: ArchetypeBand.of("kg", 0.18, 0.18, LANCE_HEAD),
      diameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
      mass: ArchetypeBand.of("kg", 1.672, 2.19, LANCE, true),
    },
  };
}
