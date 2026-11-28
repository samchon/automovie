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

/**
 * Constructs flat ceramic plates, platters and saucers with stacking and carrying contacts.
 */
export namespace AutoMovieArchetypeTableware {
/**
 * Build a level ceramic plate, platter or saucer with its base at model Y zero.
 *
 * Round forms use a 16-point stacking outline. A platter's rectangular
 * outline has its long side along X. The model uses a level slab across
 * the whole face, including the rim and centre.
 *
 * @param params Shape, optional scene ID, applicable finite fixed values
 *   and a model where the shape uses catalogue figures. The ID defaults
 *   to `tableware`.
 * @param seed Numeric seed for an omitted model or band value. Omit it
 *   for the side plate, 27 cm serving platter or recorded saucer.
 * @returns The slab with `top` at full height, rim pinches at opposite X
 *   edges and a downward `underside` at its base.
 * @throws {AutoMovieArchetypeRefusal} If the shape, model or fixed value is inadmissible.
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

  /** Selects a round plate, rectangular serving platter or round saucer. */
  export type Kind = "plate" | "platter" | "saucer";

  /** Admitted shapes in plate, platter and saucer gallery order. */
  export const KINDS: readonly Kind[] = ["plate", "platter", "saucer"];

  /** Vertex count of the inscribed stacking outline for round forms. */
  export const OUTLINE: number = 16;

  /**
   * Names the upper stacking region, opposed X-side pinches and downward support.
   * The `leftRim` is on `+X` and the `rightRim` is on `-X`, at half height.
   */
  export type Affordance = "top" | "leftRim" | "rightRim" | "underside";

  /**
   * Geometry in metres and mass in kilograms. Round forms use `diameter`.
   * Platters use `length` along X and `width` along Z. `height` is top Y.
   */
  export type Dimension = "diameter" | "length" | "width" | "height" | "mass";

  /** Unit table shared by plate catalogue figures and the saucer bands. */
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
   * Shape and optional scene ID, model and applicable finite fixed measurements.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects the body footprint and the applicable measurement table. */
    kind: Kind;

    /**
     * Catalogue ID for a round plate or platter. A saucer uses its fixed bands.
     */
    model?: Model;

    /** Scene object ID, defaulting to `tableware`. */
    id?: string;
  }

  /** Correlated dimensions and mass of one round plate or platter model. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /**
   * Round plates `sidePlate`, `dinnerPlate`, `joyn27` and `sunnyDay27`,
   * and platters `serving27`, `loft34` and `midas33`.
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
   * Whole round-plate and platter measurements. Each row keeps one
   * model's dimensions with its recorded mass. The first entry by shape
   * is the seedless default. IKEA masses use the recorded packed weights.
   *
   * @see https://www.ikea.com/gb/en/p/ikea-365-side-plate-white-90621364/
   * @see https://www.ikea.com/gb/en/p/ikea-365-plate-white-70258949
   * @see https://www.ikea.com/gb/en/p/ikea-365-serving-plate-white-70607364
   * @see https://www.rosenthal.de/en-gb/plate-27-cm-flat/44020-640202-10867.html
   * @see https://thomas-porzellan.de/de-at/speiseteller-27-cm/10850-800001-10227.html
   * @see https://thomas-porzellan.de/fr-fr/plat-34-cm/11900-800001-12734.html
   * @see https://www.rosenthal.de/en-gb/platter-33-cm/10480-408684-12733.html
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

  /**
   * The saucer's 0.12 metre diameter, 0.014 metre height and 0.106 kilogram mass. Plate and platter use complete catalogue rows.
   */
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
