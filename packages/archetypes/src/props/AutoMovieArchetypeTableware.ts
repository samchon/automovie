import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeTablewareData } from "./internal/AutoMovieArchetypeTablewareData";

/** Constructs the tableware archetype from its recipe. */
export namespace AutoMovieArchetypeTableware {
/**
 * A plate food is served on and eaten from: a round plate, from a side plate to
 * a dinner plate, an oblong serving platter, or a cup's saucer.
 *
 * The plate lies flat on the origin, a slab of the drawn size and height; a
 * platter's long side runs along `X`. Its well and rim are not drawn, so its
 * face is level at its full height. `top` is that face, where food sits and
 * another plate stacks, a `stack-top` whose extent is the plate's outline;
 * `leftRim` and `rightRim` are the plate's edge at `+X` and `-X`, pinched
 * across its height between a thumb on the face and the fingers beneath;
 * `underside` is its base facing down, the whole plate's size, where two hands
 * carry it from below.
 *
 * @param params The kind, the kind's model where it has read models, and any
 *   dimension the author fixes.
 * @param seed The seed that picks the model when none is given and draws every
 *   dimension left free inside its band; absent, the first model and the middle
 *   of each band.
 * @returns The plate.
 * @throws {AutoMovieArchetypeRefusal} For a model the kind does not have, or a
 *   fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeTableware.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeTableware.Affordance, AutoMovieArchetypeTableware.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeTableware.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeTableware.Dimension>(
      "tableware",
      AutoMovieArchetypeTableware.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeTableware.Kind = ArchetypeDraw.choice(
    "tableware",
    "kind",
    params.kind,
    AutoMovieArchetypeTableware.KINDS,
  );
  const drawn: Partial<Record<AutoMovieArchetypeTableware.Dimension, number>> =
    draw.dimensions(AutoMovieArchetypeTableware.BANDS[kind], AutoMovieArchetypeTableware.BANDS);
  // A round plate or a platter is one of the read models whole: IKEA's, Rosenthal's or Thomas's.
  const model: {
    name: AutoMovieArchetypeTableware.Model | undefined;
    figures: AutoMovieArchetypeTableware.Figures;
  } = draw.model<AutoMovieArchetypeTableware.Model>(
    "model",
    params.model,
    AutoMovieArchetypeTableware.MODELS[kind],
  );
  const d: Partial<Record<AutoMovieArchetypeTableware.Dimension, number>> = {
    ...drawn,
    ...model.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeTableware.Affordance,
    AutoMovieArchetypeTableware.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "ceramic",
    id: params.id,
    name: kind,
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const height: number = d.height!;
  const round: boolean = kind !== "platter";
  const length: number = round ? d.diameter! : d.length!;
  const width: number = round ? d.diameter! : d.width!;
  const color: string = "#f2efe8";
  if (round)
    builder.rod("plate", length / 2, v(0, 0, 0), v(0, height, 0), { color });
  else
    builder.box("plate", v(length, height, width), v(0, height / 2, 0), {
      color,
    });

  // The face: the plate's own outline, a regular polygon on a round plate's circle.
  const outline: IAutoMovieVector3[] = round
    ? Array.from(
        { length: AutoMovieArchetypeTableware.OUTLINE },
        (_: unknown, k: number): IAutoMovieVector3 => {
          const angle: number = (2 * Math.PI * k) / AutoMovieArchetypeTableware.OUTLINE;
          return v(
            (length / 2) * Math.cos(angle),
            0,
            (length / 2) * Math.sin(angle),
          );
        },
      )
    : [
        v(-length / 2, 0, -width / 2),
        v(length / 2, 0, -width / 2),
        v(length / 2, 0, width / 2),
        v(-length / 2, 0, width / 2),
      ];
  builder.affordance({
    id: "top",
    kind: "stack-top",
    frame: AutoMovieArchetypeFrame.upright(v(0, height, 0)),
    extent: outline,
  });

  // The edge at each end of X, pinched across the plate's height from above.
  for (const [id, sign] of [
    ["leftRim", 1],
    ["rightRim", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "half",
      frame: AutoMovieArchetypeFrame.facing(
        v((sign * length) / 2, height / 2, 0),
        v(0, 1, 0),
        v(0, 0, sign),
      ),
      extent: null,
      grip: "precision",
      aperture: height,
    });
  builder.affordance({
    id: "underside",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
    width: length,
    depth: width,
  });
  return builder.build(d.mass!);
}

  /**
   * The kinds: a round plate, from a side plate to a dinner plate, an oblong
   * serving platter and a cup's saucer.
   */
  export type Kind = "plate" | "platter" | "saucer";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["plate", "platter", "saucer"];

  /** The number of points of a round plate's stacking outline. */
  export const OUTLINE: number = 16;

  /**
   * The affordance ids:
   *
   * - `top`: the face, a `stack-top` the plate's size, where food sits and
   *   another plate stacks.
   * - `leftRim`, `rightRim`: the edge at `+X` and `-X`, pinched from above, `+X`
   *   along the edge.
   * - `underside`: the base, facing down, where two hands carry the plate.
   */
  export type Affordance = "top" | "leftRim" | "rightRim" | "underside";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `diameter`: a round plate's or a saucer's, across.
   * - `length`, `width`: a platter's, along `X` and `Z`.
   * - `height`: the face above the base.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "length" | "width" | "height" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    length: "m",
    width: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which plate. */
    kind: Kind;

    /** A round plate's or a platter's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `tableware` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /**
   * The models read: IKEA 365+'s side plate and plate, and its 27 by 15 cm
   * serving plate (the 36 by 20 cm one is not built, since its page gives no
   * height); Rosenthal's Joyn and Thomas's Sunny Day 27 cm plates; Thomas's
   * Loft 34 cm and Rosenthal's Heritage Midas 33 cm platters.
   */
  export type Model =
    | "sidePlate"
    | "dinnerPlate"
    | "serving27"
    | "joyn27"
    | "sunnyDay27"
    | "loft34"
    | "midas33";

  /**
   * Each kind's models whole, the default first. A round plate, diameter and
   * height: the side plate 20 x 2 cm and the plate 27 x 3 cm
   * (https://www.ikea.com/gb/en/p/ikea-365-side-plate-white-90621364/,
   * https://www.ikea.com/gb/en/p/ikea-365-plate-white-70258949). A platter,
   * length, width and height: 27 x 15 x 3 cm
   * (https://www.ikea.com/gb/en/p/ikea-365-serving-plate-white-70607364).
   *
   * Their masses are provisional: the pages' packed weights, 0.41, 0.77 and
   * 0.52 kg, which the plate alone is lighter than by an amount no page gives.
   *
   * The makers' plates and platters, with each article's own weight: Rosenthal
   * Joyn Plate 27 cm flat, 27.00 cm across, 2.50 cm high, 710 g
   * (https://www.rosenthal.de/en-gb/plate-27-cm-flat/44020-640202-10867.html);
   * Thomas Sunny Day Plate 27 cm, 27.00 cm, 2.80 cm, 590 g
   * (https://thomas-porzellan.de/de-at/speiseteller-27-cm/10850-800001-10227.html);
   * Thomas Loft Platter 34 cm, 33.80 by 24.00 cm, 3.10 cm high, 965 g
   * (https://thomas-porzellan.de/fr-fr/plat-34-cm/11900-800001-12734.html);
   * Rosenthal Heritage Midas Platter 33 cm, 33.20 by 21.20 cm, 3.80 cm high,
   * 780 g
   * (https://www.rosenthal.de/en-gb/platter-33-cm/10480-408684-12733.html).
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Partial<Record<Model, Figures>>>>>
  > = {
    plate: {
      sidePlate: { diameter: 0.2, height: 0.02, mass: 0.41 },
      dinnerPlate: { diameter: 0.27, height: 0.03, mass: 0.77 },
      joyn27: { diameter: 0.27, height: 0.025, mass: 0.71 },
      sunnyDay27: { diameter: 0.27, height: 0.028, mass: 0.59 },
    },
    platter: {
      serving27: { length: 0.27, width: 0.15, height: 0.03, mass: 0.52 },
      loft34: { length: 0.338, width: 0.24, height: 0.031, mass: 0.965 },
      midas33: { length: 0.332, width: 0.212, height: 0.038, mass: 0.78 },
    },
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    plate: {},
    platter: {},
    saucer: {
      diameter: AutoMovieArchetypeBand.metres(0.12, 0.12, AutoMovieArchetypeTablewareData.SAUCER),
      height: AutoMovieArchetypeBand.metres(0.014, 0.014, AutoMovieArchetypeTablewareData.SAUCER),
      mass: AutoMovieArchetypeBand.of("kg", 0.106, 0.106, AutoMovieArchetypeTablewareData.SAUCER),
    },
  };
}
