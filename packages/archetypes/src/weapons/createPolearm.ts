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
 * @evidence contracts/development/implementation.md#principled-implementation A shaft rod and, for a spear, a head box `STEEL` times as dense as the wood, so the balance point moves toward the head as a steel head's does; mass properties follow from the parts under the drawn mass.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the shaft and its bar, a lance's grip, the head, the two ends.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No socket, lugs or butt cap; the head's width and thickness are estimates named on a constant.
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
  builder.rod("shaft", d.diameter! / 2, v(0, 0, 0), v(0, length, 0), {
    color: "#b98d5b",
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
      v(createPolearm.HEAD.thickness, head, createPolearm.HEAD.width),
      v(0, length + head / 2, 0),
      { color: "#c9ccd1", density: createPolearm.STEEL },
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

  /** A spear head's width and thickness, metres. Estimates, not read at a source. */
  export const HEAD: Readonly<{ width: number; thickness: number }> = {
    width: 0.04,
    thickness: 0.005,
  };

  /** A steel head's density over an ash shaft's: about 7850 over 700 kg per cubic metre, handbook figures recalled and not read at a source. */
  export const STEEL: number = 11;

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
   * - `headLength`: a spear's head above the shaft.
   * - `diameter`: the shaft's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "headLength" | "diameter" | "mass";

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
      diameter: ArchetypeBand.metres(
        0.025,
        0.03,
        "a spear shaft's thickness, not read at a source",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        1.2,
        2.2,
        "an ash shaft with a steel head, not read at a source",
        true,
      ),
    },
    lance: {
      length: ArchetypeBand.metres(
        2.625 - 0.277,
        2.84 - 0.207,
        `${LANCE}: the shaft is the 2.625 to 2.84 m overall less the 207 to 277 mm heads`,
        true,
      ),
      headLength: ArchetypeBand.metres(0.207, 0.277, LANCE, true),
      diameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
      mass: ArchetypeBand.of("kg", 1.672, 2.19, LANCE, true),
    },
  };
}
