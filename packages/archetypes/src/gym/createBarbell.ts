import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The rule that fixes a competition barbell. */
const IWF: string =
  "International Weightlifting Federation, Technical and Competition Rules and Regulations, the rules on the barbell: the men's bar 20 kg, 2200 mm long, 28 mm across its grip; the women's bar 15 kg, 2010 mm long, 25 mm across its grip; both 1310 mm between the inner collars with sleeves 50 mm across; the largest discs 450 mm across";

/**
 * A weightlifting barbell: a steel bar with a sleeve at each end, and the
 * discs loaded on the sleeves when a load is given.
 *
 * The bar lies along `X`, its middle at the origin, its axis a disc's
 * radius above nothing: the origin is on the bar's axis, so a scene that
 * rests it on the floor places it a loaded disc's radius up. `gripLeft` (on
 * `+X`) and `gripRight` are where the two hands hold it, taken from the
 * `-Z` side, `grip` apart.
 *
 * @param params The kind, any dimension the author fixes, and the load.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The barbell.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the bar lies, where its origin is and what that asks of a scene, and the two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The shaft between the collars, laid in pieces so each hand's place has its own, a sleeve each side out to the bar's length, and one disc stack per side whose thickness grows with the load; every length the rule fixes is the rule's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, lay the shaft, the sleeves and the discs, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts One solid stack stands for a side's discs, its thickness an estimate per kilogram, and the mass is spread over the shapes by volume, so the loaded bar's inertia about its length is not a measured one; no knurling and no collars' clamps.
 * @evidence contracts/development/implementation.md#efficient-algorithms Seven rods, nine when loaded.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBarbell(
  params: createBarbell.IParams,
  seed?: number | string,
): Archetype<createBarbell.Affordance, createBarbell.Dimension> {
  const kind: createBarbell.Kind = ArchetypeDraw.choice(
    "barbell",
    "kind",
    params.kind,
    createBarbell.KINDS,
  );
  const d: Partial<Record<createBarbell.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "barbell",
      createBarbell.BANDS[kind],
      seed,
      params,
      createBarbell.BANDS,
    );
  const half: number = d.length! / 2;
  const collar: number = createBarbell.BETWEEN / 2;
  const builder: ArchetypeBuilder<
    createBarbell.Affordance,
    createBarbell.Dimension
  > = new ArchetypeBuilder({
    archetype: "barbell",
    id: params.id,
    name: kind === "mens" ? "men's barbell" : "women's barbell",
    dimensions: d,
  });
  const along: (x: number) => ReturnType<typeof Vector3.create> = (
    x: number,
  ): ReturnType<typeof Vector3.create> => Vector3.create(x, 0, 0);

  // The shaft is laid in pieces, one centred on each hand's place, so the
  // collider nearest a grip is the shaft a hand closes on and never a disc.
  const hand: number = d.grip! / 2;
  const inner: number = Math.max(0, hand - createBarbell.HAND);
  const outer: number = Math.min(collar, hand + createBarbell.HAND);
  const shaft: (id: string, from: number, to: number) => void = (
    id: string,
    from: number,
    to: number,
  ): void => {
    if (to - from > 1e-6)
      builder.rod(id, d.diameter! / 2, along(from), along(to), {
        color: "#b8bcc2",
      });
  };
  shaft("shaft-middle", -inner, inner);
  for (const side of [1, -1] as const) {
    const name: string = side === 1 ? "left" : "right";
    shaft(
      `shaft-grip-${name}`,
      Math.min(side * inner, side * outer),
      Math.max(side * inner, side * outer),
    );
    shaft(
      `shaft-end-${name}`,
      Math.min(side * outer, side * collar),
      Math.max(side * outer, side * collar),
    );
    builder.rod(
      `sleeve-${name}`,
      createBarbell.SLEEVE / 2,
      along(side * collar),
      along(side * half),
      { color: "#b8bcc2" },
    );
    if (d.load! > 0)
      builder.rod(
        `discs-${name}`,
        createBarbell.DISC / 2,
        along(side * (collar + createBarbell.SHOULDER)),
        along(
          side *
            Math.min(
              half,
              collar + createBarbell.SHOULDER + d.load! * createBarbell.THICK,
            ),
        ),
        { color: "#2c2f33" },
      );
    builder.affordance({
      id: side === 1 ? "gripLeft" : "gripRight",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        along((side * d.grip!) / 2),
        Vector3.create(0, 0, -1),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      aperture: d.diameter!,
      length: createBarbell.HAND,
    });
  }
  return builder.build(d.mass! + 2 * d.load!);
}

/**
 * Companion types and bands of {@link createBarbell}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind; what the rule fixes for both bars is a named constant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bar's size and mass, the hands' spacing and the load a lift reads, and the two contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No balance point or inertia is declared: both follow from the shape.
 */
export namespace createBarbell {
  /** The kinds of bar. */
  export type Kind = "mens" | "womens";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["mens", "womens"];

  /** The distance between the inner collars, metres (IWF, the rules on the barbell). */
  export const BETWEEN: number = 1.31;

  /** A sleeve's diameter, metres (IWF, the rules on the barbell). */
  export const SLEEVE: number = 0.05;

  /** The largest disc's diameter, metres (IWF, the rules on the barbell). */
  export const DISC: number = 0.45;

  /** The inner collar's width, which the first disc sits against, metres (IWF, the rules on the barbell: 30 mm). */
  export const SHOULDER: number = 0.03;

  /** A disc stack's thickness per kilogram of load on its side, metres. An estimate, not read at a source: a 25 kg competition disc is about 67 mm thick. */
  export const THICK: number = 0.0027;

  /** The run of the shaft one hand takes, metres. An estimate, not read at a source. */
  export const HAND: number = 0.12;

  /**
   * The affordance ids:
   *
   * - `gripLeft`: where the left hand holds the shaft, on `+X`, taken from the `-Z` side.
   * - `gripRight`: where the right hand holds it, on `-X`.
   */
  export type Affordance = "gripLeft" | "gripRight";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: the whole bar, end to end.
   * - `diameter`: the shaft where it is gripped.
   * - `mass`: the bar alone, kilograms.
   * - `grip`: between the middles of the two hands.
   * - `load`: the discs and collar on each side, kilograms; 0 is the empty bar.
   */
  export type Dimension = "length" | "diameter" | "mass" | "grip" | "load";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bar. */
    kind: Kind;

    /** The model's id, unique in a scene; `barbell` when absent. */
    id?: string;
  }

  /** The hands' spacing: from a clean's grip to a snatch's. An estimate, not read at a source. */
  const GRIP: IArchetypeBand = ArchetypeBand.metres(
    0.4,
    1.2,
    "an estimate: from a grip a little wider than the shoulders to a snatch grip near the collars",
    true,
  );

  /** The load on each side. An estimate of the range a film stages, not a rule. */
  const LOAD: IArchetypeBand = ArchetypeBand.of(
    "kg",
    0,
    100,
    "an estimate of the range a scene loads; the rule's heaviest disc is 25 kg and a side takes several",
    true,
  );

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    mens: {
      length: ArchetypeBand.metres(2.2, 2.2, IWF),
      diameter: ArchetypeBand.metres(0.028, 0.028, IWF),
      mass: ArchetypeBand.of("kg", 20, 20, IWF),
      grip: GRIP,
      load: LOAD,
    },
    womens: {
      length: ArchetypeBand.metres(2.01, 2.01, IWF),
      diameter: ArchetypeBand.metres(0.025, 0.025, IWF),
      mass: ArchetypeBand.of("kg", 15, 15, IWF),
      grip: GRIP,
      load: LOAD,
    },
  };
}
