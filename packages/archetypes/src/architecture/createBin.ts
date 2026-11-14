import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The wheeled bins read. */
const SULO: string =
  "SULO 240 and 360 litre containers: total height about 1060 and 1100 mm, bin height 990 and 1028, bin depth 660 and 770, total depth 730 and 848, width 585 and 680, handle width 400 and 520, wheels 200 and 250 mm, 12.5 and 17 kg empty (https://sulo.com.au/product/240-litre-container/, https://sulo.com.au/product/360-litre-container/)";

/** The front-load containers read. */
const WASTEQUIP: string =
  "Wastequip steel front-load containers, 2 and 3 yd flat nestable: 81 7/8 and 82 7/16 in long, 39 3/4 and 46 3/4 in deep at the lid, 34 and 42 in at the base, 40 15/16 and 48 1/2 in high at the front, 45 1/4 and 52 11/16 in at the back, 505 and 602 lb (https://www.Wastequip.com/sites/default/files/2023-06/Steel_FEL_Containers_Brochure_032017_DIGITAL_0.pdf)";

/** One container model read: its outline in metres and its mass in kilograms. */
interface IModel {
  width: number;
  depth: number;
  height: number;
  top: number;
  reach: number;
  handle: number;
  wheel: number;
  mass: number;
}

/**
 * The two models read for each kind, the smaller first. For a wheeled bin: `width`, `depth` and `height` its body's, `top` its height with the lid, `reach` its depth with the handle, `handle` the handle's width, `wheel` its wheels' diameter. For a dumpster: `width` its length across the front, `depth` its depth at the lid, `reach` at the base, `height` at the front and `top` at the back; it has no handle or wheels.
 */
const MODELS: Readonly<Record<createBin.Kind, readonly [IModel, IModel]>> = {
  wheelieBin: [
    {
      width: 0.585,
      depth: 0.66,
      height: 0.99,
      top: 1.06,
      reach: 0.73,
      handle: 0.4,
      wheel: 0.2,
      mass: 12.5,
    },
    {
      width: 0.68,
      depth: 0.77,
      height: 1.028,
      top: 1.1,
      reach: 0.848,
      handle: 0.52,
      wheel: 0.25,
      mass: 17,
    },
  ],
  dumpster: [
    {
      width: 2.0796,
      depth: 1.0097,
      height: 1.0398,
      top: 1.1494,
      reach: 0.8636,
      handle: 0,
      wheel: 0,
      mass: 229.1,
    },
    {
      width: 2.0939,
      depth: 1.1875,
      height: 1.2319,
      top: 1.3383,
      reach: 1.0668,
      handle: 0,
      wheel: 0,
      mass: 273.1,
    },
  ],
};

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `lid`, a dumpster lid's thickness; `bar`, a handle's and a wheel's width. */
const ESTIMATES: Readonly<{ lid: number; bar: number }> = {
  lid: 0.03,
  bar: 0.03,
};

/**
 * A waste container standing on the ground: a two-wheeled bin or a front-load dumpster.
 *
 * Each stands on `y = 0` with its front toward `+Z` and its lid hinged along its back top edge. Its outline lies between the maker's two models read, by the drawn `size`, so every draw is one coherent container. A wheeled bin is its body, its lid and two wheels at its back's foot; `handle` is the bar behind its body by the sheet's difference of total and bin depth, at the bin's height, where it is gripped to tip the bin onto its wheels and haul it. A dumpster is its body, narrower at the base than at the lid, under a lid level at its mean height. `lid` is the lid's hinge on both; it states no travel, since no source read gives how far a lid opens. `front` is the front face a person pushes.
 *
 * A dumpster rests on its steel body, so its friction is steel on concrete (`ArchetypeFriction`); no source read names a wheeled bin's wheels, so it keeps the builder's 0.5 placeholder.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The container.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each kind stands, how its size is drawn, its contacts and why its lid does not open.
 * @evidence contracts/development/implementation.md#principled-implementation Every size interpolated between the two models read by one drawn share, so no draw mixes one model's height with the other's depth; the handle where the total depth passes the body.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the share, interpolate the outline, then the body, lid and the kind's extra parts, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bin's taper and a dumpster's sloped front and lid are boxes; the lid's and handle's sections are construction estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms At most five parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBin(
  params: createBin.IParams,
  seed?: number | string,
): Archetype<createBin.Affordance, createBin.Dimension> {
  const kind: createBin.Kind = ArchetypeDraw.choice(
    "bin",
    "kind",
    params.kind,
    createBin.KINDS,
  );
  const d: Record<createBin.Dimension, number> = ArchetypeDraw.dimensions(
    "bin",
    createBin.BANDS,
    seed,
    params,
  );
  const [small, large]: readonly [IModel, IModel] = MODELS[kind];
  const at = (key: keyof IModel): number =>
    small[key] + (large[key] - small[key]) * d.size;
  const builder: ArchetypeBuilder<createBin.Affordance, createBin.Dimension> =
    new ArchetypeBuilder({
      archetype: "bin",
      id: params.id,
      name: kind === "wheelieBin" ? "wheelie bin" : "dumpster",
      dimensions: d,
    });
  const v: typeof Vector3.create = Vector3.create;
  const E: typeof ESTIMATES = ESTIMATES;
  const width: number = at("width");
  const depth: number = at("depth");
  const height: number = at("height");
  const top: number = at("top");
  const front: number = depth / 2;
  const back: number = -depth / 2;
  let hinge: number;
  if (kind === "wheelieBin") {
    const wheel: number = at("wheel") / 2;
    hinge = top;
    builder.box("body", v(width, height, depth), v(0, height / 2, 0), {
      color: "#2f6b3a",
    });
    builder.box(
      "lid",
      v(width, top - height, depth),
      v(0, (top + height) / 2, 0),
      { color: "#2f6b3a" },
    );
    for (const [id, sign] of [
      ["wheel-left", 1],
      ["wheel-right", -1],
    ] as const)
      builder.rod(
        id,
        wheel,
        v((sign * width) / 2, wheel, back),
        v(sign * (width / 2 - E.bar), wheel, back),
        { color: "#1d1d1d" },
      );
    const behind: number = front - at("reach");
    const span: number = at("handle");
    builder.rod(
      "handle",
      E.bar / 2,
      v(-span / 2, height, behind),
      v(span / 2, height, behind),
      { color: "#2f6b3a" },
    );
    builder.affordance({
      id: "handle",
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(0, height, behind),
        v(0, 0, -1),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      length: span,
    });
  } else {
    const base: number = at("reach");
    const mean: number = (height + top) / 2;
    const body: number = mean - E.lid;
    hinge = mean;
    builder.box("body", v(width, body, base), v(0, body / 2, back + base / 2), {
      color: "#2c4f7c",
      surface: "steel",
    });
    builder.box(
      "hopper",
      v(width, body / 2, depth - base),
      v(0, (3 * body) / 4, back + base + (depth - base) / 2),
      { color: "#2c4f7c", surface: "steel" },
    );
    builder.box("lid", v(width, E.lid, depth), v(0, mean - E.lid / 2, 0), {
      color: "#1d1d1d",
    });
  }
  builder.affordance({
    id: "lid",
    kind: "hinge",
    frame: ArchetypeFrame.facing(v(0, hinge, back), v(0, 1, 0), v(-1, 0, 0)),
    extent: null,
    parts: ["lid"],
  });
  builder.affordance({
    id: "front",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      v(0, height / 2, front),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width,
    depth: height,
  });
  return builder.build(at("mass"), kind === "dumpster" ? { rests: "steel" } : {});
}

/**
 * Companion types and bands of {@link createBin}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; the band its source.
 * @evidence contracts/development/design.md#principled-representation One drawn share between two read models, so the outline stays one maker's shape.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handle a bin is hauled by, the lid it is opened at and the face it is pushed at (#3468 N2).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A lid with no source for its opening states no travel.
 */
export namespace createBin {
  /** The kinds of container. */
  export type Kind = "wheelieBin" | "dumpster";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["wheelieBin", "dumpster"];

  /**
   * The affordance ids:
   *
   * - `lid`: the lid's hinge along the back top edge, its axis along `-X`.
   * - `front`: the front face, pushed to move the container.
   * - `handle`: a wheeled bin's handle behind its back, a bar.
   */
  export type Affordance = "lid" | "front" | "handle";

  /** The free dimension: `size`, where the container lies between the maker's two models read, 0 the smaller (SULO 240 L, Wastequip 2 yd) and 1 the larger (SULO 360 L, Wastequip 3 yd). */
  export type Dimension = "size";

  /** The parameters: the kind, and the size fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which container. */
    kind: Kind;

    /** The model's id, unique in a scene; `bin` when absent. */
    id?: string;
  }

  /** The band of the free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    size: ArchetypeBand.of("", 0, 1, `${SULO}; ${WASTEQUIP}`),
  };
}
