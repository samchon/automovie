import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** A carbine's published data, from its maker and from the army's manual. */
const CARBINE: string =
  "Colt M4 Carbine specification sheet 2020 (https://media.shootingsportsmedia.com/downloads/colt-2020-m4-specsheet-rnd7-web.pdf) and TM 9-1005-319-10 (https://tiropratico.com/manuali-pdf/T/tm9-1005-319-10.pdf)";

/** A pump shotgun's published data. */
const SHOTGUN: string =
  "Mossberg 590A1 7-shot, product page (https://www.mossberg.com/590a1-m-lok-50765.html)";

/** Positions along the gun no maker publishes. */
const UNPUBLISHED: string = "not published by the maker; an estimate";

/**
 * A long gun as a film prop: a carbine with a sliding stock, or a pump shotgun. It models no mechanism and no effect.
 *
 * The gun lies along `+Z` from its butt plate at the origin to its muzzle, the barrel's line at `y = 0`. The firing hand takes the `grip` behind the trigger and the other hand the `foreEnd` from below; the `butt` goes to the shoulder. The trigger's face is the length of pull ahead of the butt, as gunmakers measure it. The stock ends behind the grip and a round neck joins it to the receiver: a carbine's fixed buffer tube, a shotgun's wrist. A carbine's `stock` slides back along its tube to lengthen the pull, carrying the butt; a shotgun's `pump` slides back, carrying the fore-end.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The long gun.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is and is not modelled, how the gun lies and what each contact is.
 * @evidence contracts/development/implementation.md#principled-implementation Rods and boxes along the barrel's line from the published overall and barrel lengths; the trigger stands at the length of pull from the butt plate, the measure that fits a gun to an arm, and the carbine's stock travel is the difference between its published extended and retracted lengths. The stock stops short of the grip so the firing hand's hold stands clear, and the fixed tube it slides on is longer than the travel, so the drawn stock never parts from the receiver.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, lay the stock, neck, receiver, barrel and fore-end, then the contacts and the one slider.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No magazine, sights' shape or sling; the sight line is a frame above the barrel.
 * @evidence contracts/development/implementation.md#efficient-algorithms Seven parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createLongGun(
  params: createLongGun.IParams,
  seed?: number | string,
): Archetype<createLongGun.Affordance, createLongGun.Dimension> {
  const kind: createLongGun.Kind = ArchetypeDraw.choice(
    "longGun",
    "kind",
    params.kind,
    createLongGun.KINDS,
  );
  const d: Record<createLongGun.Dimension, number> = ArchetypeDraw.dimensions(
    "longGun",
    createLongGun.BANDS[kind],
    seed,
    params,
    createLongGun.BANDS,
  );
  const builder: ArchetypeBuilder<
    createLongGun.Affordance,
    createLongGun.Dimension
  > = new ArchetypeBuilder({
    archetype: "longGun",
    id: params.id,
    name: kind === "carbine" ? "carbine" : "pump shotgun",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const steel: string = "#2c2f33";
  const pull: number = d.lengthOfPull;
  const breech: number = d.length - d.barrel;
  const hand: number = createLongGun.FORE_END / 2;
  const fore: number = breech + d.barrel * 0.45;

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
    v(0, 0, kind === "carbine" ? neck - d.travel - 0.012 : neck - 0.02),
    v(0, 0, pull - 0.08),
    { color: steel },
  );
  builder.box(
    "receiver",
    v(0.045, 0.07, breech - pull + 0.1),
    v(0, 0, (pull - 0.1 + breech) / 2),
    { color: steel },
  );
  builder.rod("barrel", 0.011, v(0, 0, breech), v(0, 0, d.length), {
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
  builder.affordance({
    id: "muzzle",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(0, 0, d.length), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
  });
  builder.affordance({
    id: "sight",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, d.sightHeight, breech)),
    extent: null,
  });
  if (kind === "carbine")
    builder.affordance({
      id: "stock",
      kind: "slider",
      frame: ArchetypeFrame.facing(v(0, -0.035, 0), v(0, 1, 0), v(0, 0, -1)),
      extent: null,
      travel: d.travel,
      parts: ["stock"],
    });
  else
    builder.affordance({
      id: "pump",
      kind: "slider",
      frame: ArchetypeFrame.facing(v(0, 0, fore), v(0, -1, 0), v(0, 0, -1)),
      extent: null,
      travel: d.travel,
      parts: ["fore-end"],
    });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createLongGun}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The length of pull, the two hands' places and the butt a shouldering act reads (#3374).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `travel` is the one slider each kind has: the carbine's stock or the shotgun's pump.
 */
export namespace createLongGun {
  /** The kinds of long gun. */
  export type Kind = "carbine" | "shotgun";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["carbine", "shotgun"];

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
   */
  export type Affordance =
    | "grip"
    | "trigger"
    | "foreEnd"
    | "butt"
    | "muzzle"
    | "sight"
    | "stock"
    | "pump";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: overall, a carbine's with its stock in.
   * - `barrel`: the barrel.
   * - `lengthOfPull`: from the butt plate to the trigger's face, a carbine's with its stock in.
   * - `travel`: how far the carbine's stock or the shotgun's pump slides.
   * - `sightHeight`: the sight line above the barrel's line.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "barrel"
    | "lengthOfPull"
    | "travel"
    | "sightHeight"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which long gun. */
    kind: Kind;

    /** The model's id, unique in a scene; `longGun` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    carbine: {
      length: ArchetypeBand.metres(
        0.7557,
        0.7747,
        `${CARBINE}: 29.75 and 30.5 in with the stock retracted`,
      ),
      barrel: ArchetypeBand.metres(0.3683, 0.3683, `${CARBINE}: 14.5 in`),
      lengthOfPull: ArchetypeBand.metres(
        0.273,
        0.29,
        `a collapsed adjustable stock's 10.75 in pull, seen only in retailer listings; ${UNPUBLISHED} for this carbine`,
        true,
      ),
      travel: ArchetypeBand.metres(
        0.0825,
        0.0825,
        `${CARBINE}: 33.75 in extended less 30.5 in retracted (the manual's 33.0 less 29.75 in agrees)`,
      ),
      sightHeight: ArchetypeBand.metres(
        0.066,
        0.066,
        "a 2.6 in sight plane above the bore, seen only in search results",
        true,
      ),
      mass: ArchetypeBand.of("kg", 2.885, 3.13, CARBINE),
    },
    shotgun: {
      length: ArchetypeBand.metres(1.0033, 1.0033, `${SHOTGUN}: 39.5 in`),
      barrel: ArchetypeBand.metres(0.4699, 0.4699, `${SHOTGUN}: 18.5 in`),
      lengthOfPull: ArchetypeBand.metres(
        0.3523,
        0.3523,
        `${SHOTGUN}: 13.87 in`,
      ),
      travel: ArchetypeBand.metres(
        0.08,
        0.1,
        `pump stroke, ${UNPUBLISHED}`,
        true,
      ),
      sightHeight: ArchetypeBand.metres(
        0.015,
        0.025,
        `bead sight height, ${UNPUBLISHED}`,
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        3.18,
        3.18,
        `${SHOTGUN}: 7, the unit not stated on the page and taken as pounds`,
        true,
      ),
    },
  };
}
