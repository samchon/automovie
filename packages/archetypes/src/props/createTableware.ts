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

/** IKEA's dinner plate, read. */
const PLATE: string =
  "IKEA 365+ plate, 27 cm across; 3 cm high and 0.77 kg under the page's package details (https://www.ikea.com/gb/en/p/ikea-365-plate-white-70258949)";

/** IKEA's side plate, read. */
const SIDE_PLATE: string =
  "IKEA 365+ side plate, 20 cm across and 2 cm high; 0.41 kg under the page's package details (https://www.ikea.com/gb/en/p/ikea-365-side-plate-white-90621364/)";

/** IKEA's serving plates, read, and the largest one's weight seen only in search results. */
const PLATTER: string =
  "IKEA 365+ serving plates 27 by 15 cm, 3 cm high, packed at 0.52 kg (https://www.ikea.com/gb/en/p/ikea-365-serving-plate-white-70607364), and 36 by 20 cm (https://mgmt.ikea.gr/en/products/ikea-365-serving-plate-36x20-cm/00607367); the largest's 1.12 kg from dimensions.com seen only in search results";

/** IKEA's saucer, read. */
const SAUCER: string =
  "IKEA 365+ cup with saucer 13 cl: the saucer 14 cm across, packed alone at 0.18 kg; the cup 6 cm high and 7 cm on its saucer (https://www.ikea.com/gb/en/p/ikea-365-cup-with-saucer-white-70283406)";

/**
 * A plate food is served on and eaten from: a dinner plate, a side plate, a serving platter or a saucer.
 *
 * The plate lies on its foot centred over the origin, its face up; a platter's long side runs along `X`. It is two parts, the identification a still needs and no more: a thin `top` slab of the plate's full size, the face and the rim, raised on a smaller `foot`. `top` is the face food sits on and another plate stacks on, a `stack-top` whose extent is the plate's outline; `leftRim` and `rightRim` are the rim at `+X` and `-X`, pinched between a thumb on the face and the fingers beneath, for one hand or two; `underside` is the foot's base facing down, where two hands carry the plate from below. A cup stands on a saucer by the saucer's `top`.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The plate.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the plate lies, its two parts and its four contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A slab of the drawn size and the rim's thickness over a foot of the named fraction of it, round as discs or oblong as boxes; the rim pinches sit the rim's width in from each end of `X` at the slab's middle, so their aperture is the slab's thickness, and the stacking outline is a regular polygon on the plate's own outline.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, two parts, four contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The well and the rim's rise are not modelled; the slab's thickness, the foot's fraction and the rim's width are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts and an outline of a fixed number of points.
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
    name: kind === "sidePlate" ? "side plate" : kind,
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const height: number = d.height!;
  const slab: number = createTableware.SLAB;
  const ratio: number = createTableware.FOOT;
  const round: boolean = kind !== "platter";

  // The plate's size along X and Z: a diameter both ways, or a platter's length and width.
  const length: number = round ? d.diameter! : d.length!;
  const width: number = round ? d.diameter! : d.width!;
  const color: string = "#f2efe8";
  if (round) {
    builder.rod("foot", (ratio * length) / 2, v(0, 0, 0), v(0, height - slab, 0), {
      color,
    });
    builder.rod("top", length / 2, v(0, height - slab, 0), v(0, height, 0), {
      color,
    });
  } else {
    builder.box(
      "foot",
      v(ratio * length, height - slab, ratio * width),
      v(0, (height - slab) / 2, 0),
      { color },
    );
    builder.box("top", v(length, slab, width), v(0, height - slab / 2, 0), {
      color,
    });
  }

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

  // The rim at each end of X, pinched across the slab from above.
  const reach: number = length / 2 - createTableware.RIM / 2;
  for (const [id, sign] of [
    ["leftRim", 1],
    ["rightRim", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "half",
      frame: ArchetypeFrame.facing(
        v(sign * reach, height - slab / 2, 0),
        v(0, 1, 0),
        v(0, 0, sign),
      ),
      extent: null,
      grip: "precision",
      aperture: slab,
    });
  builder.affordance({
    id: "underside",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
    width: ratio * length,
    depth: ratio * width,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createTableware}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the four plates, a round plate drawn by its diameter and a platter by its length and width, one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The face food and other plates rest on, the rim a hand pinches and the underside two hands carry from (#3501); a bowl is `createVessel`'s and a cup `createDrinkware`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every plate has the same four contacts, so serving, clearing and stacking are written once; packed weights bound a plate's weight from above and are provisional; the slab, the foot and the rim's width are named estimates.
 */
export namespace createTableware {
  /** The kinds: a dinner plate, a side plate, an oblong serving platter and a cup's saucer. */
  export type Kind = "plate" | "sidePlate" | "platter" | "saucer";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "plate",
    "sidePlate",
    "platter",
    "saucer",
  ];

  /** The slab's thickness, the face and rim, metres: an estimate. */
  export const SLAB: number = 0.006;

  /** The foot's size as a fraction of the plate's: an estimate. */
  export const FOOT: number = 0.6;

  /** The rim's width in from the edge, where a pinch takes it, metres: an estimate. */
  export const RIM: number = 0.02;

  /** The number of points of a round plate's stacking outline. */
  export const OUTLINE: number = 16;

  /**
   * The affordance ids:
   *
   * - `top`: the face, a `stack-top` the plate's size, where food sits and another plate stacks.
   * - `leftRim`, `rightRim`: the rim at `+X` and `-X`, pinched from above, `+X` along the rim.
   * - `underside`: the foot's base, facing down, where two hands carry the plate.
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
      diameter: ArchetypeBand.metres(0.27, 0.27, PLATE),
      height: ArchetypeBand.metres(
        0.03,
        0.03,
        `${PLATE}; the height is given among the package's details`,
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.6,
        0.77,
        `${PLATE}; the plate alone is lighter than its packing by an unread amount`,
        true,
      ),
    },
    sidePlate: {
      diameter: ArchetypeBand.metres(0.2, 0.2, SIDE_PLATE),
      height: ArchetypeBand.metres(0.02, 0.02, SIDE_PLATE),
      mass: ArchetypeBand.of(
        "kg",
        0.33,
        0.41,
        `${SIDE_PLATE}; the plate alone is lighter than its packing by an unread amount`,
        true,
      ),
    },
    platter: {
      length: ArchetypeBand.metres(0.27, 0.36, PLATTER),
      width: ArchetypeBand.metres(0.15, 0.2, PLATTER),
      height: ArchetypeBand.metres(
        0.03,
        0.03,
        `${PLATTER}; the height is the smaller plate's, among the package's details`,
        true,
      ),
      mass: ArchetypeBand.of("kg", 0.45, 1.12, PLATTER, true),
    },
    saucer: {
      diameter: ArchetypeBand.metres(0.14, 0.14, SAUCER),
      height: ArchetypeBand.metres(
        0.01,
        0.015,
        `${SAUCER}; no height is given, and the cup's 6 cm standing 7 cm on the saucer leaves 1 cm, the cup's foot sunk in the saucer's well by an unread amount`,
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.15,
        0.18,
        `${SAUCER}; the saucer alone is lighter than its packing by an unread amount`,
        true,
      ),
    },
  };
}
