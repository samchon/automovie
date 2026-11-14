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

/** IKEA's plates, read. */
const PLATES: string =
  "IKEA 365+ side plate, 20 cm across and 2 cm high, 0.41 kg under the page's package details (https://www.ikea.com/gb/en/p/ikea-365-side-plate-white-90621364/), and plate, 27 cm across, 3 cm high and 0.77 kg under the package details (https://www.ikea.com/gb/en/p/ikea-365-plate-white-70258949)";

/** IKEA's serving plates, read, and the largest one's weight seen only in search results. */
const PLATTER: string =
  "IKEA 365+ serving plates 27 by 15 cm, 3 cm high, packed at 0.52 kg (https://www.ikea.com/gb/en/p/ikea-365-serving-plate-white-70607364), and 36 by 20 cm (https://mgmt.ikea.gr/en/products/ikea-365-serving-plate-36x20-cm/00607367); the largest's 1.12 kg from dimensions.com seen only in search results";

/** What a packed weight means for a plate's own. */
const PACKED: string =
  "the page's packed weight, which the plate alone is lighter than by an amount no page gives";

/**
 * A plate food is served on and eaten from: a round plate, from a side plate to a dinner plate, or an oblong serving platter.
 *
 * The plate lies flat on the origin, a slab of the drawn size and height; a platter's long side runs along `X`. Its well and rim are not drawn, so its face is level at its full height. `top` is that face, where food sits and another plate stacks, a `stack-top` whose extent is the plate's outline; `leftRim` and `rightRim` are the plate's edge at `+X` and `-X`, pinched across its height between a thumb on the face and the fingers beneath; `underside` is its base facing down, the whole plate's size, where two hands carry it from below.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The plate.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the plate lies, that its well is not drawn, and its four contacts.
 * @evidence contracts/development/implementation.md#principled-implementation One slab of the read diameter or length and width and the read height, round as a disc or oblong as a box; every contact is on that slab's own faces and edges, and the stacking outline is a regular polygon on the plate's circle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one part, four contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No foot, well or rim lip is drawn, since no page read sizes them; the pinch is therefore the plate's whole height.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part and an outline of a fixed number of points.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createTableware(
  params: createTableware.IParams,
  seed?: number | string,
): Archetype<createTableware.Affordance, createTableware.Dimension> {
  const kind: createTableware.Kind = ArchetypeDraw.choice(
    "tableware",
    "kind",
    params.kind,
    createTableware.KINDS,
  );
  const d: Partial<Record<createTableware.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "tableware",
      createTableware.BANDS[kind],
      seed,
      params,
      createTableware.BANDS,
    );
  const builder: ArchetypeBuilder<
    createTableware.Affordance,
    createTableware.Dimension
  > = new ArchetypeBuilder({
    archetype: "tableware",
    id: params.id,
    name: kind,
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const height: number = d.height!;
  const round: boolean = kind === "plate";
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
        { length: createTableware.OUTLINE },
        (_: unknown, k: number): IAutoMovieVector3 => {
          const angle: number = (2 * Math.PI * k) / createTableware.OUTLINE;
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
    frame: ArchetypeFrame.upright(v(0, height, 0)),
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
      frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
    width: length,
    depth: width,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createTableware}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the round plate and the platter, the round plate drawn by its diameter and the platter by its length and width, one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The face food and other plates rest on, the edge a hand pinches and the underside two hands carry from (#3501); a bowl is `createVessel`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every plate has the same four contacts, so serving, clearing and stacking are written once; the bands run between the plates read, the masses between their packed weights.
 */
export namespace createTableware {
  /** The kinds: a round plate, from a side plate to a dinner plate, and an oblong serving platter. */
  export type Kind = "plate" | "platter";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["plate", "platter"];

  /** The number of points of a round plate's stacking outline. */
  export const OUTLINE: number = 16;

  /**
   * The affordance ids:
   *
   * - `top`: the face, a `stack-top` the plate's size, where food sits and another plate stacks.
   * - `leftRim`, `rightRim`: the edge at `+X` and `-X`, pinched from above, `+X` along the edge.
   * - `underside`: the base, facing down, where two hands carry the plate.
   */
  export type Affordance = "top" | "leftRim" | "rightRim" | "underside";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `diameter`: a round plate's, across.
   * - `length`, `width`: a platter's, along `X` and `Z`.
   * - `height`: the face above the base.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "length" | "width" | "height" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which plate. */
    kind: Kind;

    /** The model's id, unique in a scene; `tableware` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    plate: {
      diameter: ArchetypeBand.metres(0.2, 0.27, PLATES),
      height: ArchetypeBand.metres(0.02, 0.03, PLATES),
      mass: ArchetypeBand.of("kg", 0.41, 0.77, `${PLATES}; ${PACKED}`, true),
    },
    platter: {
      length: ArchetypeBand.metres(0.27, 0.36, PLATTER),
      width: ArchetypeBand.metres(0.15, 0.2, PLATTER),
      height: ArchetypeBand.metres(0.03, 0.03, PLATTER),
      mass: ArchetypeBand.of("kg", 0.52, 1.12, `${PLATTER}; ${PACKED}`, true),
    },
  };
}
