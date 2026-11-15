import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Window sizes, for which no standard was read. */
const SIZE: string = "window opening size, not read at a source";

/** The sill band between the residential and the commercial fall-protection triggers. */
const SILL: string =
  "sill below the 36 in (914 mm) at which IBC 2021 1015.8 requires fall protection (https://up.codes/s/window-openings) and above the 24 in of IRC R312.2.1, which was not read";

/** The reach range for operable parts. */
const REACH: string =
  "2010 ADA Standards 309.3 and 308.2.1, operable parts 15 to 48 in above the floor (https://www.access-board.gov/ada/chapter/ch03/)";

/**
 * A window in a piece of wall: a casement that swings out, or a sash that slides up or sideways.
 *
 * The window stands in the `XY` plane, its wall's foot at the origin and the room on the `+Z` side. The sash is a part on its articulation and carries its handle: a casement's and a sliding sash's on the stile that leaves the frame, at the drawn handle height, and a hung sash's on its bottom rail. The `sill` is the ledge under the opening, facing into the room, and the `aperture` is the opening itself.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The window.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the window's plane, which side the room is on and what moves.
 * @evidence contracts/development/implementation.md#principled-implementation A wall panel below the sill, two jambs and a head round a sash box; a casement's hinge axis points down on its `+X` edge so a positive travel swings the sash out toward `-Z`, and a sliding sash runs along its slider's `+X`, up or toward `-X`. The handle is a short level bar at the edge of the sash a hand opens it by, and a slider's frame stands at it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the surround and the sash, place the handle, then the articulation and the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts One sash, no glazing bars; the fixed half of a sliding window is left out.
 * @evidence contracts/development/implementation.md#efficient-algorithms Six parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createWindow(
  params: createWindow.IParams,
  seed?: number | string,
): Archetype<createWindow.Affordance, createWindow.Dimension> {
  const kind: createWindow.Kind = ArchetypeDraw.choice(
    "window",
    "kind",
    params.kind,
    createWindow.KINDS,
  );
  const d: Partial<Record<createWindow.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "window",
      createWindow.BANDS[kind],
      seed,
      params,
      createWindow.BANDS,
    );
  const width: number = d.width!;
  const height: number = d.height!;
  const sill: number = d.sillHeight!;
  const wall: number = 0.12;
  const builder: ArchetypeBuilder<
    createWindow.Affordance,
    createWindow.Dimension
  > = new ArchetypeBuilder({
    archetype: "window",
    id: params.id,
    name: `${kind} window`,
    dimensions: d,
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
  builder.box(
    "sash",
    Vector3.create(width, height, 0.03),
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
    parts: ["sash", "handle"],
    ...(kind === "casement"
      ? {
          kind: "hinge",
          frame: ArchetypeFrame.facing(
            Vector3.create(width / 2, sill + height / 2, 0),
            Vector3.create(0, -1, 0),
            Vector3.create(-1, 0, 0),
          ),
          travel: d.swing!,
        }
      : {
          kind: "slider",
          frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.facing(
      Vector3.create(0, sill, 0),
      Vector3.create(0, 1, 0),
      Vector3.create(-1, 0, 0),
    ),
    extent: null,
    width,
    height,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createWindow}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The sill a body leans on or climbs, the handle's height and the sash's travel (#3371).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `sash` is a hinge on one kind and a slider on the others, the articulation each really has, under one id an opening act names. A hung sash's handle sits on its bottom rail, so its height follows the sill and that kind declares no `handleHeight` it would not use; sill plus rail stays inside the cited reach range.
 */
export namespace createWindow {
  /** The kinds of window: a side-hung casement, a vertically sliding hung sash, a horizontally sliding sash. */
  export type Kind = "casement" | "hung" | "sliding";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["casement", "hung", "sliding"];

  /**
   * The affordance ids:
   *
   * - `sash`: the sash's articulation: a casement's hinge on its `+X` edge swinging it out, a hung sash's slide up, a sliding sash's run toward `-X`.
   * - `handle`: the sash's handle on its room face, which rides the sash: a casement's on its `-X` stile, away from the hinge, at `handleHeight`; a sliding sash's on its `+X` stile, the edge that leaves the jamb, at `handleHeight`; a hung sash's at the middle of its bottom rail, just above the sill.
   * - `sill`: the ledge under the opening, facing into the room.
   * - `aperture`: the opening, passed through from the room toward `-Z`.
   */
  export type Affordance = "sash" | "handle" | "sill" | "aperture";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`: the opening.
   * - `sillHeight`: the sill above the floor.
   * - `handleHeight`: a casement's or a sliding sash's handle above the floor; a hung sash has none, its handle following the sill.
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which window. */
    kind: Kind;

    /** The model's id, unique in a scene; `window` when absent. */
    id?: string;
  }

  /** The bands every window shares. */
  const SHARED: Readonly<Partial<Record<Dimension, IArchetypeBand>>> = {
    width: ArchetypeBand.metres(0.6, 1.2, SIZE, true),
    height: ArchetypeBand.metres(0.9, 1.2, SIZE, true),
    sillHeight: ArchetypeBand.metres(0.61, 0.914, SILL, true),
    mass: ArchetypeBand.of("kg", 40, 90, ArchetypeBand.TYPICAL_MASS, true),
  };

  /** The band of a handle that stands at a height of its own, on a stile. */
  const HANDLE: IArchetypeBand = ArchetypeBand.metres(
    0.95,
    1.22,
    `${REACH}; the part of the range above the sill`,
  );

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    casement: {
      ...SHARED,
      handleHeight: HANDLE,
      swing: ArchetypeBand.of(
        "degrees",
        90,
        90,
        "Truth Hardware Entrygard operator, sash opening out to 90 degrees, specification seen only in search results",
        true,
      ),
    },
    hung: {
      ...SHARED,
      travel: ArchetypeBand.metres(
        0.4,
        0.45,
        "half the opening's height, the run of a single-hung sash, not read at a source",
        true,
      ),
    },
    sliding: {
      ...SHARED,
      handleHeight: HANDLE,
      travel: ArchetypeBand.metres(
        0.28,
        0.3,
        "half the opening's width, the run of a sliding sash, not read at a source",
        true,
      ),
    },
  };
}
