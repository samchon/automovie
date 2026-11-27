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

/** The rule that fixes a competition barbell. */
const IWF: string =
  "International Weightlifting Federation, Technical and Competition Rules and Regulations, the rules on the barbell: the men's bar 20 kg, 2200 mm long, 28 mm across its grip; the women's bar 15 kg, 2010 mm long, 25 mm across its grip; both 1310 mm between the inner collars with sleeves 50 mm across; the largest discs 450 mm across";

/** Constructs the barbell archetype from its recipe. */
export namespace AutoMovieArchetypeBarbell {
/** The kinds of bar. */
  export type Kind = "mens" | "womens";

  /**
   * The affordance ids:
   *
   * - `gripLeft`: where the left hand holds the shaft, on `+X`, taken from the
   *   `-Z` side.
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

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bar. */
    kind: Kind;

    /** The model's id, unique in a scene; `barbell` when absent. */
    id?: string;
  }

  /**
 * A weightlifting barbell: a steel bar with a sleeve at each end, and the discs
 * loaded on the sleeves when a load is given.
 *
 * The bar lies along `X`, its middle at the origin, its axis a disc's radius
 * above nothing: the origin is on the bar's axis, so a scene that rests it on
 * the floor places it a loaded disc's radius up. `gripLeft` (on `+X`) and
 * `gripRight` are where the two hands hold it, taken from the `-Z` side, `grip`
 * apart.
 *
 * @param params The kind, any dimension the author fixes, and the load.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The barbell.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeBarbell.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBarbell.Affordance, AutoMovieArchetypeBarbell.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeBarbell.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeBarbell.Dimension>(
      "barbell",
      AutoMovieArchetypeBarbell.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeBarbell.Kind = ArchetypeDraw.choice(
    "barbell",
    "kind",
    params.kind,
    AutoMovieArchetypeBarbell.KINDS,
  );
  const d: Partial<Record<AutoMovieArchetypeBarbell.Dimension, number>> = draw.dimensions(
    AutoMovieArchetypeBarbell.BANDS[kind],
    AutoMovieArchetypeBarbell.BANDS,
  );
  const half: number = d.length! / 2;
  const collar: number = AutoMovieArchetypeBarbell.BETWEEN / 2;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeBarbell.Affordance,
    AutoMovieArchetypeBarbell.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: kind === "mens" ? "men's barbell" : "women's barbell",
    draw,
  });
  const along: (x: number) => ReturnType<typeof Vector3.create> = (
    x: number,
  ): ReturnType<typeof Vector3.create> => Vector3.create(x, 0, 0);

  // The shaft is laid in pieces, one centred on each hand's place, so the
  // collider nearest a grip is the shaft a hand closes on and never a disc.
  const hand: number = d.grip! / 2;
  const inner: number = Math.max(0, hand - AutoMovieArchetypeBarbell.HAND);
  const outer: number = Math.min(collar, hand + AutoMovieArchetypeBarbell.HAND);
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
      AutoMovieArchetypeBarbell.SLEEVE / 2,
      along(side * collar),
      along(side * half),
      { color: "#b8bcc2" },
    );
    if (d.load! > 0)
      builder.rod(
        `discs-${name}`,
        AutoMovieArchetypeBarbell.DISC / 2,
        along(side * (collar + AutoMovieArchetypeBarbell.SHOULDER)),
        along(
          side *
            Math.min(
              half,
              collar + AutoMovieArchetypeBarbell.SHOULDER + d.load! * AutoMovieArchetypeBarbell.THICK,
            ),
        ),
        { color: "#2c2f33" },
      );
    builder.affordance({
      id: side === 1 ? "gripLeft" : "gripRight",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        along((side * d.grip!) / 2),
        Vector3.create(0, 0, -1),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      aperture: d.diameter!,
      length: AutoMovieArchetypeBarbell.HAND,
    });
  }
  return builder.build(d.mass! + 2 * d.load!);
}

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["mens", "womens"];

  /**
   * The distance between the inner collars, metres (IWF, the rules on the
   * barbell).
   */
  export const BETWEEN: number = 1.31;

  /** A sleeve's diameter, metres (IWF, the rules on the barbell). */
  export const SLEEVE: number = 0.05;

  /** The largest disc's diameter, metres (IWF, the rules on the barbell). */
  export const DISC: number = 0.45;

  /**
   * The inner collar's width, which the first disc sits against, metres (IWF,
   * the rules on the barbell: 30 mm).
   */
  export const SHOULDER: number = 0.03;

  /**
   * A disc stack's thickness per kilogram of load on its side, metres. An
   * estimate, not read at a source: a 25 kg competition disc is about 67 mm
   * thick.
   */
  export const THICK: number = 0.0027;

  /**
   * The run of the shaft one hand takes, metres. An estimate, not read at a
   * source.
   */
  export const HAND: number = 0.12;

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    mass: "kg",
    grip: "m",
    load: "kg",
  };

  /**
   * The hands' spacing: from a clean's grip to a snatch's. An estimate, not
   * read at a source.
   */
  const GRIP: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
    0.4,
    1.2,
    "an estimate: from a grip a little wider than the shoulders to a snatch grip near the collars",
    true,
  );

  /** The load on each side. An estimate of the range a film stages, not a rule. */
  const LOAD: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
    "kg",
    0,
    100,
    "an estimate of the range a scene loads; the rule's heaviest disc is 25 kg and a side takes several",
    true,
  );

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    mens: {
      length: AutoMovieArchetypeBand.metres(2.2, 2.2, IWF),
      diameter: AutoMovieArchetypeBand.metres(0.028, 0.028, IWF),
      mass: AutoMovieArchetypeBand.of("kg", 20, 20, IWF),
      grip: GRIP,
      load: LOAD,
    },
    womens: {
      length: AutoMovieArchetypeBand.metres(2.01, 2.01, IWF),
      diameter: AutoMovieArchetypeBand.metres(0.025, 0.025, IWF),
      mass: AutoMovieArchetypeBand.of("kg", 15, 15, IWF),
      grip: GRIP,
      load: LOAD,
    },
  };
}
