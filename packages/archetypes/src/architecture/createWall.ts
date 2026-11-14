import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Wall thickness and length, which no act reads. */
const PICTURE: string = "a piece of wall for the picture, not read at a source";

/**
 * A piece of wall: a full-height wall to lean on, or a low wall to sit on, vault or mantle.
 *
 * The wall stands in the `XY` plane on the floor, centred on the origin, its front face toward `+Z`. `face` is that front face, leaned or pushed on; `top` is the front edge of its top, a ledge a body climbs or hangs from; a low wall's top is also a `seat` facing `+Z`.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The wall.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the wall's plane and what each contact is for.
 * @evidence contracts/development/implementation.md#principled-implementation One box; the face, the top edge and the seat follow the `surface`, `ledge` and `seat` conventions on it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one part, its contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coping, skirting or texture.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createWall(
  params: createWall.IParams,
  seed?: number | string,
): Archetype<createWall.Affordance, createWall.Dimension> {
  const kind: createWall.Kind = ArchetypeDraw.choice(
    "wall",
    "kind",
    params.kind,
    createWall.KINDS,
  );
  const d: Record<createWall.Dimension, number> = ArchetypeDraw.dimensions(
    "wall",
    createWall.BANDS[kind],
    seed,
    params,
    createWall.BANDS,
  );
  const { height, length, thickness }: Record<createWall.Dimension, number> = d;
  const builder: ArchetypeBuilder<createWall.Affordance, createWall.Dimension> =
    new ArchetypeBuilder({
      archetype: "wall",
      id: params.id,
      name: kind === "full" ? "wall" : "low wall",
      dimensions: d,
    });
  builder.box(
    "wall",
    Vector3.create(length, height, thickness),
    Vector3.create(0, height / 2, 0),
    { color: "#d8d2c4" },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, height / 2, thickness / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    width: length,
    depth: height,
  });
  builder.affordance({
    id: "top",
    kind: "ledge",
    frame: ArchetypeFrame.upright(Vector3.create(0, height, thickness / 2)),
    extent: null,
    length,
  });
  if (kind === "low")
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: ArchetypeFrame.upright(Vector3.create(0, height, thickness / 2)),
      extent: null,
      width: length,
      depth: thickness,
    });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createWall}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The height a lean, a sit, a vault or a mantle reads (#3371, #3363).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only a low wall declares a seat.
 */
export namespace createWall {
  /** The kinds of wall: `full` rises to a ceiling, `low` ends between seat height and guard height. */
  export type Kind = "full" | "low";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["full", "low"];

  /**
   * The affordance ids:
   *
   * - `face`: the `+Z` face.
   * - `top`: the front edge of the top, facing `+Z`.
   * - `seat`: a low wall's top as a seat facing `+Z`.
   */
  export type Affordance = "face" | "top" | "seat";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the top above the floor.
   * - `length`: along `+X`.
   * - `thickness`: along `+Z`.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "length" | "thickness" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which wall. */
    kind: Kind;

    /** The model's id, unique in a scene; `wall` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    full: {
      height: ArchetypeBand.metres(
        2.286,
        2.7,
        "IBC 2021 1208.2, ceilings at least 7 ft 6 in (2286 mm) (https://up.codes/viewer/illinois/ibc-2021/chapter/12/interior-environment); the upper end is an estimate",
        true,
      ),
      length: ArchetypeBand.metres(2, 4, PICTURE, true),
      thickness: ArchetypeBand.metres(0.1, 0.2, PICTURE, true),
      mass: ArchetypeBand.of("kg", 500, 2000, ArchetypeBand.TYPICAL_MASS, true),
    },
    low: {
      height: ArchetypeBand.metres(
        0.43,
        1.067,
        "from the 17 in (430 mm) bench seat of 2010 ADA Standards 903.5 (https://www.access-board.gov/ada/) to the 42 in (1067 mm) guard of IBC 2021 1015.3, the latter seen only in search results",
        true,
      ),
      length: ArchetypeBand.metres(1.5, 3, PICTURE, true),
      thickness: ArchetypeBand.metres(0.2, 0.4, PICTURE, true),
      mass: ArchetypeBand.of("kg", 200, 1000, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
