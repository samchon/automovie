import { AutoMovieEngineGravity, AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import "./constants/ADA_RANGES";
import { AutoMovieArchetypeWindowData } from "./internal/AutoMovieArchetypeWindowData";

/** Constructs a composite window with a movable glazed sash and fixed sill. */
export namespace AutoMovieArchetypeWindow {
/**
 * Selects a hinged casement, vertically hung sash or horizontally sliding sash.
 */
  export type Kind = "casement" | "hung" | "sliding";

  /**
   * Movable `sash`, its riding `handle`, fixed `sill` ledge and
   * fixed frame `aperture`.
   */
  export type Affordance = "sash" | "handle" | "sill" | "aperture";

  /**
   * Opening width and height, sill height, applicable handle height and
   * linear travel in metres. `swing` is in degrees and mass in kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "sillHeight"
    | "handleHeight"
    | "swing"
    | "travel"
    | "mass";

  /**
   * Required sash kind, optional scene ID, applicable finite measurements and optional pane fracture calibration.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects the sash structure, travel axis and applicable bands. */
    kind: Kind;

    /** Scene object ID, defaulting to `window`. */
    id?: string;

    /**
     * Optional finite positive scene-specific parameter for simulated pane fracture, in joules.
     */
    fractureEnergy?: number;
  }

  /**
   * Build a casement, hung or sliding window above its floor-level base.
   *
   * A casement turns about its right edge on the `-Y` hinge axis.
   * A hung sash slides along `+Y`, and a sliding sash moves along `-X`.
   * The `handle` travels with the sash. The `sill` and `aperture` stay fixed.
   *
   * @param params Required kind, optional scene ID, applicable finite
   *   measurements and optional simulated pane fracture calibration.
   * @param seed Numeric seed for omitted measurements. With no seed,
   *   the frame opening is 0.9 metres wide by 1.05 metres high.
   * @returns The window with its sash, moving handle, sill and aperture.
   * @throws {AutoMovieArchetypeRefusal} If a kind, fixed value or fracture calibration is inadmissible.
   */
export function create(
  params: AutoMovieArchetypeWindow.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeWindow.Affordance, AutoMovieArchetypeWindow.Dimension> {
  if (
    params.fractureEnergy !== undefined &&
    !(params.fractureEnergy > 0 && params.fractureEnergy < Infinity)
  )
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "window",
      axis: "fractureEnergy",
      value: params.fractureEnergy,
      feasible: null,
      reason:
        "a pane's authored fracture calibration must be finite and positive",
      fix: "supply a measured or explicitly authored positive energy in joules, or leave it unknown",
    });
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeWindow.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeWindow.Dimension>(
      "window",
      AutoMovieArchetypeWindow.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeWindow.Kind = ArchetypeDraw.choice(
    "window",
    "kind",
    params.kind,
    AutoMovieArchetypeWindow.KINDS,
  );
  const d: Partial<Record<AutoMovieArchetypeWindow.Dimension, number>> = draw.dimensions(
    AutoMovieArchetypeWindow.BANDS[kind],
    AutoMovieArchetypeWindow.BANDS,
  );
  const width: number = d.width!;
  const height: number = d.height!;
  const sill: number = d.sillHeight!;
  const wall: number = 0.12;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeWindow.Affordance,
    AutoMovieArchetypeWindow.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: `${kind} window`,
    material: "composite",
    draw,
  });
  builder.box(
    "wall",
    AutoMovieEngineVector3.create(width + 0.2, sill, wall),
    AutoMovieEngineVector3.create(0, sill / 2, 0),
    { color: "#d8d2c4" },
  );
  for (const side of [1, -1] as const)
    builder.box(
      side === 1 ? "jamb-left" : "jamb-right",
      AutoMovieEngineVector3.create(0.1, height + 0.1, wall),
      AutoMovieEngineVector3.create(side * (width / 2 + 0.05), sill + (height + 0.1) / 2, 0),
      { color: "#d8d2c4" },
    );
  builder.box(
    "head",
    AutoMovieEngineVector3.create(width, 0.1, wall),
    AutoMovieEngineVector3.create(0, sill + height + 0.05, 0),
    { color: "#d8d2c4" },
  );
  for (const side of [-1, 1] as const) {
    builder.box(
      side < 0 ? "sash-left" : "sash-right",
      AutoMovieEngineVector3.create(SASH.rail, height, SASH.depth),
      AutoMovieEngineVector3.create((side * (width - SASH.rail)) / 2, sill + height / 2, 0),
      { color: "#d8d2c4" },
    );
    builder.box(
      side < 0 ? "sash-bottom" : "sash-top",
      AutoMovieEngineVector3.create(width - 2 * SASH.rail, SASH.rail, SASH.depth),
      AutoMovieEngineVector3.create(
        0,
        sill + height / 2 + (side * (height - SASH.rail)) / 2,
        0,
      ),
      { color: "#d8d2c4" },
    );
  }
  builder.box(
    "pane",
    AutoMovieEngineVector3.create(width - 2 * SASH.rail, height - 2 * SASH.rail, SASH.pane),
    AutoMovieEngineVector3.create(0, sill + height / 2, 0),
    { color: "#a9c8d8" },
  );

  // Where a hand finds the handle: on a hung sash's bottom rail, or at the drawn height on the stile that leaves the frame, a casement's `-X` and a sliding sash's `+X`. The insets from the sash's edges are picture only.
  const grasp: IAutoMovieVector3 =
    kind === "hung"
      ? AutoMovieEngineVector3.create(0, sill + 0.04, 0.035)
      : AutoMovieEngineVector3.create(
          (kind === "casement" ? -1 : 1) * (width / 2 - 0.07),
          d.handleHeight!,
          0.035,
        );
  builder.rod(
    "handle",
    0.008,
    AutoMovieEngineVector3.create(grasp.x - 0.05, grasp.y, grasp.z),
    AutoMovieEngineVector3.create(grasp.x + 0.05, grasp.y, grasp.z),
    { color: "#55595f" },
  );

  builder.affordance({
    id: "sash",
    extent: null,
    parts: [
      "sash-left",
      "sash-right",
      "sash-bottom",
      "sash-top",
      "pane",
      "handle",
    ],
    ...(kind === "casement"
      ? {
          kind: "hinge",
          frame: AutoMovieArchetypeFrame.facing(
            AutoMovieEngineVector3.create(width / 2, sill + height / 2, 0),
            AutoMovieEngineVector3.create(0, -1, 0),
            AutoMovieEngineVector3.create(-1, 0, 0),
          ),
          travel: d.swing!,
        }
      : {
          kind: "slider",
          frame: AutoMovieArchetypeFrame.facing(
            grasp,
            AutoMovieEngineVector3.create(0, 0, 1),
            kind === "hung"
              ? AutoMovieEngineVector3.create(0, 1, 0)
              : AutoMovieEngineVector3.create(-1, 0, 0),
          ),
          travel: d.travel!,
        }),
  });
  builder.affordance({
    id: "handle",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      grasp,
      AutoMovieEngineVector3.create(0, 0, 1),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "precision",
    aperture: 0.016,
    length: 0.1,
    rides: "sash",
  });
  builder.affordance({
    id: "sill",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, sill, wall / 2),
      AutoMovieEngineVector3.create(0, 1, 0),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
    length: width,
  });
  builder.affordance({
    id: "aperture",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, sill, 0),
      AutoMovieEngineVector3.create(0, 1, 0),
      AutoMovieEngineVector3.create(-1, 0, 0),
    ),
    extent: null,
    width,
    height,
  });

  builder.fracture([{ id: "shards", parts: ["pane"] }]);
  return builder.build(d.mass!, {
    ...(params.fractureEnergy === undefined
      ? {}
      : {
          outcome: { fracture: params.fractureEnergy },
        }),
  });
}

  /**
   * Historical pane-test reference energy, in joules. A simulated pane
   * uses the scene's independently authored `fractureEnergy` calibration.
   *
   * @see https://iibec.org/publication-post/on-the-weakening-of-weathered-window-glass-and-its-effect-on-human-impact-resistance-two-fatality-case-studies/
   */
  export const BREAKING: number =
    25 *
    AutoMovieArchetypeUnits.FOOT *
    AutoMovieArchetypeUnits.POUND *
    AutoMovieEngineGravity.STANDARD;

  /** The three accepted sash kinds in casement, hung and sliding order. */
  export const KINDS: readonly Kind[] = ["casement", "hung", "sliding"];

  /** Units used for window sizes, sash motion and assembled mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    sillHeight: "m",
    handleHeight: "m",
    swing: "degrees",
    travel: "m",
    mass: "kg",
  };

  /**
   * Applicable dimensions by sash kind. Casements draw a swing angle and sliding kinds draw a linear travel.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    casement: {
      ...AutoMovieArchetypeWindowData.SHARED,
      handleHeight: AutoMovieArchetypeWindowData.HANDLE,
      swing: AutoMovieArchetypeBand.of(
        "degrees",
        90,
        90,
        "Truth Hardware Entrygard operator, sash opening out to 90 degrees, specification seen only in search results",
        true,
      ),
    },
    hung: {
      ...AutoMovieArchetypeWindowData.SHARED,
      travel: AutoMovieArchetypeBand.metres(
        0.4,
        0.45,
        "half the opening's height, the run of a single-hung sash, not read at a source",
        true,
      ),
    },
    sliding: {
      ...AutoMovieArchetypeWindowData.SHARED,
      handleHeight: AutoMovieArchetypeWindowData.HANDLE,
      travel: AutoMovieArchetypeBand.metres(
        0.28,
        0.3,
        "half the opening's width, the run of a sliding sash, not read at a source",
        true,
      ),
    },
  };
}

/*
 * Authored sash construction, metres; these are geometry conventions, not
 * measured window specifications.
 */
const SASH: Readonly<{ rail: number; depth: number; pane: number }> = {
  rail: 0.08,
  depth: 0.03,
  pane: 0.003175,
};
