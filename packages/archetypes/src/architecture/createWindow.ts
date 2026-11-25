import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { ADA_RANGES } from "./ADA_RANGES";

/** Window sizes, for which no standard was read. */
const SIZE: string = "window opening size, not read at a source";

/**
 * The sill band between the residential and the commercial fall-protection
 * triggers.
 */
const SILL: string =
  "sill below the 36 in (914 mm) at which IBC 2021 1015.8 requires fall protection (https://up.codes/s/window-openings) and above the 24 in of IRC R312.2.1, which was not read";

/**
 * Authored sash construction, metres; these are geometry conventions, not
 * measured window specifications.
 */
const SASH: Readonly<{ rail: number; depth: number; pane: number }> = {
  rail: 0.08,
  depth: 0.03,
  pane: 0.003175,
};

/**
 * A window in a piece of wall: a casement that swings out, or a sash that
 * slides up or sideways.
 *
 * The window stands in the `XY` plane, its wall's foot at the origin and the
 * room on the `+Z` side. Four sash rails surround a separate pane and carry the
 * handle: a casement's and a sliding sash's on the stile that leaves the frame,
 * at the drawn handle height, and a hung sash's on its bottom rail. They move
 * together on `sash`. The `sill` is the ledge under the opening and the
 * `aperture` is the opening itself. Only an explicitly authored
 * `fractureEnergy` enables breakage: the pane leaves as one `shards` fragment
 * while the rails, handle and their articulation remain. Without that
 * calibration the pane's failure energy is unknown.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The window.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band or
 *   a nonpositive or non-finite fracture calibration.
 */
export function createWindow(
  params: createWindow.IParams,
  seed?: number,
): AutoMovieArchetype<createWindow.Affordance, createWindow.Dimension> {
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
  const draw: AutoMovieArchetypeDrawSession<createWindow.Dimension> =
    new AutoMovieArchetypeDrawSession<createWindow.Dimension>(
      "window",
      createWindow.UNITS,
      seed,
      params,
    );
  const kind: createWindow.Kind = ArchetypeDraw.choice(
    "window",
    "kind",
    params.kind,
    createWindow.KINDS,
  );
  const d: Partial<Record<createWindow.Dimension, number>> = draw.dimensions(
    createWindow.BANDS[kind],
    createWindow.BANDS,
  );
  const width: number = d.width!;
  const height: number = d.height!;
  const sill: number = d.sillHeight!;
  const wall: number = 0.12;
  const builder: AutoMovieArchetypeBuilder<
    createWindow.Affordance,
    createWindow.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: `${kind} window`,
    material: "composite",
    draw,
  });
  builder.box(
    "wall",
    Vector3.create(width + 0.2, sill, wall),
    Vector3.create(0, sill / 2, 0),
    { color: "#d8d2c4" },
  );
  for (const side of [1, -1] as const)
    builder.box(
      side === 1 ? "jamb-left" : "jamb-right",
      Vector3.create(0.1, height + 0.1, wall),
      Vector3.create(side * (width / 2 + 0.05), sill + (height + 0.1) / 2, 0),
      { color: "#d8d2c4" },
    );
  builder.box(
    "head",
    Vector3.create(width, 0.1, wall),
    Vector3.create(0, sill + height + 0.05, 0),
    { color: "#d8d2c4" },
  );
  for (const side of [-1, 1] as const) {
    builder.box(
      side < 0 ? "sash-left" : "sash-right",
      Vector3.create(SASH.rail, height, SASH.depth),
      Vector3.create((side * (width - SASH.rail)) / 2, sill + height / 2, 0),
      { color: "#d8d2c4" },
    );
    builder.box(
      side < 0 ? "sash-bottom" : "sash-top",
      Vector3.create(width - 2 * SASH.rail, SASH.rail, SASH.depth),
      Vector3.create(
        0,
        sill + height / 2 + (side * (height - SASH.rail)) / 2,
        0,
      ),
      { color: "#d8d2c4" },
    );
  }
  builder.box(
    "pane",
    Vector3.create(width - 2 * SASH.rail, height - 2 * SASH.rail, SASH.pane),
    Vector3.create(0, sill + height / 2, 0),
    { color: "#a9c8d8" },
  );

  // Where a hand finds the handle: on a hung sash's bottom rail, or at the drawn height on the stile that leaves the frame, a casement's `-X` and a sliding sash's `+X`. The insets from the sash's edges are picture only.
  const grasp: IAutoMovieVector3 =
    kind === "hung"
      ? Vector3.create(0, sill + 0.04, 0.035)
      : Vector3.create(
          (kind === "casement" ? -1 : 1) * (width / 2 - 0.07),
          d.handleHeight!,
          0.035,
        );
  builder.rod(
    "handle",
    0.008,
    Vector3.create(grasp.x - 0.05, grasp.y, grasp.z),
    Vector3.create(grasp.x + 0.05, grasp.y, grasp.z),
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
            Vector3.create(width / 2, sill + height / 2, 0),
            Vector3.create(0, -1, 0),
            Vector3.create(-1, 0, 0),
          ),
          travel: d.swing!,
        }
      : {
          kind: "slider",
          frame: AutoMovieArchetypeFrame.facing(
            grasp,
            Vector3.create(0, 0, 1),
            kind === "hung"
              ? Vector3.create(0, 1, 0)
              : Vector3.create(-1, 0, 0),
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
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
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
      Vector3.create(0, sill, wall / 2),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    length: width,
  });
  builder.affordance({
    id: "aperture",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, sill, 0),
      Vector3.create(0, 1, 0),
      Vector3.create(-1, 0, 0),
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

/** Companion types and bands of {@link createWindow}. */
export namespace createWindow {
  /**
   * Historical bag-impact reference, joules: 25 ft-lbf was the first drop
   * breaking through two of five new annealed panes in Meshulam's IIBEC 2019
   * test
   * (https://iibec.org/publication-post/on-the-weakening-of-weathered-window-glass-and-its-effect-on-human-impact-resistance-two-fatality-case-studies/).
   * It is neither a universal glass threshold nor a sash-release measurement,
   * and is never applied automatically; `fractureEnergy` is an independent
   * authored calibration.
   */
  export const BREAKING: number =
    25 *
    AutoMovieArchetypeUnits.FOOT *
    AutoMovieArchetypeUnits.POUND *
    AutoMovieGravity.STANDARD;

  /**
   * The kinds of window: a side-hung casement, a vertically sliding hung sash,
   * a horizontally sliding sash.
   */
  export type Kind = "casement" | "hung" | "sliding";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["casement", "hung", "sliding"];

  /**
   * The affordance ids:
   *
   * - `sash`: the sash's articulation: a casement's hinge on its `+X` edge
   *   swinging it out, a hung sash's slide up, a sliding sash's run toward
   *   `-X`.
   * - `handle`: the sash's handle on its room face, which rides the sash: a
   *   casement's on its `-X` stile, away from the hinge, at `handleHeight`; a
   *   sliding sash's on its `+X` stile, the edge that leaves the jamb, at
   *   `handleHeight`; a hung sash's at the middle of its bottom rail, just
   *   above the sill.
   * - `sill`: the ledge under the opening, facing into the room.
   * - `aperture`: the opening, passed through from the room toward `-Z`.
   */
  export type Affordance = "sash" | "handle" | "sill" | "aperture";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`: the opening.
   * - `sillHeight`: the sill above the floor.
   * - `handleHeight`: a casement's or a sliding sash's handle above the floor; a
   *   hung sash has none, its handle following the sill.
   * - `swing`: how far a casement opens, degrees.
   * - `travel`: how far a sliding sash runs.
   * - `mass`: the window with its piece of wall, kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "sillHeight"
    | "handleHeight"
    | "swing"
    | "travel"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
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
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which window. */
    kind: Kind;

    /** The model's id, unique in a scene; `window` when absent. */
    id?: string;

    /**
     * An explicit specimen or authored pane-failure calibration, joules, finite
     * and positive; absent means unknown and does not enable fracture.
     */
    fractureEnergy?: number;
  }

  /** The bands every window shares. */
  const SHARED: Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>> =
    {
      width: AutoMovieArchetypeBand.metres(0.6, 1.2, SIZE, true),
      height: AutoMovieArchetypeBand.metres(0.9, 1.2, SIZE, true),
      sillHeight: AutoMovieArchetypeBand.metres(
        24 * AutoMovieArchetypeUnits.INCH,
        0.914,
        SILL,
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        40,
        90,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    };

  /** The band of a handle that stands at a height of its own, on a stile. */
  const HANDLE: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
    0.95,
    ADA_RANGES.reach.high,
    `${ADA_RANGES.reach.source}; the part of the range above the sill`,
  );

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    casement: {
      ...SHARED,
      handleHeight: HANDLE,
      swing: AutoMovieArchetypeBand.of(
        "degrees",
        90,
        90,
        "Truth Hardware Entrygard operator, sash opening out to 90 degrees, specification seen only in search results",
        true,
      ),
    },
    hung: {
      ...SHARED,
      travel: AutoMovieArchetypeBand.metres(
        0.4,
        0.45,
        "half the opening's height, the run of a single-hung sash, not read at a source",
        true,
      ),
    },
    sliding: {
      ...SHARED,
      handleHeight: HANDLE,
      travel: AutoMovieArchetypeBand.metres(
        0.28,
        0.3,
        "half the opening's width, the run of a sliding sash, not read at a source",
        true,
      ),
    },
  };
}
