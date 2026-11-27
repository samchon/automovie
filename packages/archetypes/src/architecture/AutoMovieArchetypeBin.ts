import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";

/*
 * Each kind's models read, each whole, by name, the default first. The wheeled
 * bins: SULO 240 and 360 litre containers, total height about 1060 and 1100 mm,
 * bin height 990 and 1028, bin depth 660 and 770, total depth 730 and 848,
 * width 585 and 680, handle width 400 and 520, wheels 200 and 250 mm, 12.5 and
 * 17 kg empty (https://sulo.com.au/product/240-litre-container/,
 * https://sulo.com.au/product/360-litre-container/). The dumpsters: Wastequip
 * steel front-load containers, 2 and 3 yd flat nestable, 81 7/8 and 82 7/16 in
 * long, 39 3/4 and 46 3/4 in deep at the lid, 34 and 42 in at the base, 40
 * 15/16 and 48 1/2 in high at the front, 45 1/4 and 52 11/16 in at the back,
 * 505 and 602 lb
 * (https://www.Wastequip.com/sites/default/files/2023-06/Steel_FEL_Containers_Brochure_032017_DIGITAL_0.pdf).
 * For a wheeled bin: `width`, `depth` and `height` its body's, `top` its height
 * with the lid, `reach` its depth with the handle, `handle` the handle's width,
 * `wheel` its wheels' diameter. For a dumpster: `width` its length across the
 * front, `depth` its depth at the lid, `reach` at the base, `height` at the
 * front and `top` at the back; it has no handle or wheels.
 */
const BIN_MODELS: Readonly<
  Record<
    AutoMovieArchetypeBin.Kind,
    Readonly<
      Partial<
        Record<
          AutoMovieArchetypeBin.Model,
          Readonly<Partial<Record<AutoMovieArchetypeBin.Dimension, number>>>
        >
      >
    >
  >
> = {
  wheelieBin: {
    "240L": {
      width: 0.585,
      depth: 0.66,
      height: 0.99,
      top: 1.06,
      reach: 0.73,
      handle: 0.4,
      wheel: 0.2,
      mass: 12.5,
    },
    "360L": {
      width: 0.68,
      depth: 0.77,
      height: 1.028,
      top: 1.1,
      reach: 0.848,
      handle: 0.52,
      wheel: 0.25,
      mass: 17,
    },
  },
  dumpster: {
    "2yd": {
      width: (81 + 7 / 8) * AutoMovieArchetypeUnits.INCH,
      depth: (39 + 3 / 4) * AutoMovieArchetypeUnits.INCH,
      height: (40 + 15 / 16) * AutoMovieArchetypeUnits.INCH,
      top: (45 + 1 / 4) * AutoMovieArchetypeUnits.INCH,
      reach: 34 * AutoMovieArchetypeUnits.INCH,
      mass: 505 * AutoMovieArchetypeUnits.POUND,
    },
    "3yd": {
      width: (82 + 7 / 16) * AutoMovieArchetypeUnits.INCH,
      depth: (46 + 3 / 4) * AutoMovieArchetypeUnits.INCH,
      height: (48 + 1 / 2) * AutoMovieArchetypeUnits.INCH,
      top: (52 + 11 / 16) * AutoMovieArchetypeUnits.INCH,
      reach: 42 * AutoMovieArchetypeUnits.INCH,
      mass: 602 * AutoMovieArchetypeUnits.POUND,
    },
  },
};

/*
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `lid`, a dumpster lid's thickness; `bar`, a
 * handle's and a wheel's width.
 */
const ESTIMATES: Readonly<{ lid: number; bar: number }> = {
  lid: 0.03,
  bar: 0.03,
};

/** Constructs the bin archetype from its recipe. */
export namespace AutoMovieArchetypeBin {
/**
 * A waste container standing on the ground: a two-wheeled bin or a front-load
 * dumpster.
 *
 * Each stands on `y = 0` with its front toward `+Z` and its lid hinged along
 * its back top edge. It is one of its maker's two models read, whole: the model
 * given, or one drawn from the seed. A wheeled bin is its body, its lid and two
 * wheels at its back's foot; `handle` is the bar behind its body by the sheet's
 * difference of total and bin depth, at the bin's height, where it is gripped
 * to tip the bin onto its wheels and haul it. A dumpster is its body, narrower
 * at the base than at the lid, under a lid level at its mean height. `lid` is
 * the lid's hinge on both; it states no travel, since no source read gives how
 * far a lid opens. `front` is the front face a person pushes.
 *
 * A dumpster rests on its steel body: steel on concrete
 * (`AutoMovieArchetypeFriction`).
 *
 * @param params The kind, and the model if the author fixes it.
 * @param seed The seed that draws the model when it is not given; absent, the
 *   kind's first.
 * @returns The container.
 * @throws {AutoMovieArchetypeRefusal} For a model the kind's maker does not
 *   list.
 */
export function create(
  params: AutoMovieArchetypeBin.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBin.Affordance, AutoMovieArchetypeBin.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeBin.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeBin.Dimension>(
      "bin",
      AutoMovieArchetypeBin.UNITS,
      seed,
    );
  const kind: AutoMovieArchetypeBin.Kind = ArchetypeDraw.choice(
    "bin",
    "kind",
    params.kind,
    AutoMovieArchetypeBin.KINDS,
  );
  const model: {
    name: AutoMovieArchetypeBin.Model | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeBin.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeBin.Model>(
    "model",
    params.model,
    AutoMovieArchetypeBin.MODELS[kind],
  );
  const read: Readonly<Partial<Record<AutoMovieArchetypeBin.Dimension, number>>> =
    model.figures;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeBin.Affordance,
    AutoMovieArchetypeBin.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: kind === "wheelieBin" ? "plastic" : "steel",
    id: params.id,
    name: `${kind === "wheelieBin" ? "wheelie bin" : "dumpster"} ${model.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const E: typeof ESTIMATES = ESTIMATES;
  const width: number = read.width!;
  const depth: number = read.depth!;
  const height: number = read.height!;
  const top: number = read.top!;
  const front: number = depth / 2;
  const back: number = -depth / 2;
  let hinge: number;
  if (kind === "wheelieBin") {
    const wheel: number = read.wheel! / 2;
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
    const behind: number = front - read.reach!;
    const span: number = read.handle!;
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
      frame: AutoMovieArchetypeFrame.facing(
        v(0, height, behind),
        v(0, 0, -1),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      length: span,
    });
  } else {
    const base: number = read.reach!;
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
    frame: AutoMovieArchetypeFrame.facing(
      v(0, hinge, back),
      v(0, 1, 0),
      v(-1, 0, 0),
    ),
    extent: null,
    parts: ["lid"],
  });
  builder.affordance({
    id: "front",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, height / 2, front),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width,
    depth: height,
  });
  return builder.build(
    read.mass!,
    kind === "dumpster" ? { rests: "steel" } : {},
  );
}

  /* Companion types and constants of {@link createBin}. */
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

  /**
   * The models read: SULO's 240 and 360 litre wheeled bins and Wastequip's 2
   * and 3 yd front-load containers.
   */
  export type Model = "240L" | "360L" | "2yd" | "3yd";

  /**
   * The dimensions, each its model's, metres unless stated: `width`, `depth`
   * and `height`, a wheeled bin's body's or a dumpster's length across the
   * front, depth at the lid and height at the front; `top`, a wheeled bin's
   * height with its lid or a dumpster's height at the back; `reach`, a wheeled
   * bin's depth with its handle or a dumpster's depth at the base; `handle`, a
   * wheeled bin's handle width; `wheel`, a wheeled bin's wheels' diameter;
   * `mass`, kilograms. A dumpster has no `handle` or `wheel`.
   */
  export type Dimension =
    | "width"
    | "depth"
    | "height"
    | "top"
    | "reach"
    | "handle"
    | "wheel"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    depth: "m",
    height: "m",
    top: "m",
    reach: "m",
    handle: "m",
    wheel: "m",
    mass: "kg",
  };

  /** Each kind's models with their figures, its default first. */
  export const MODELS: typeof BIN_MODELS = BIN_MODELS;

  /** The parameters: the kind, and the model if fixed. */
  export interface IParams {
    /** Which container. */
    kind: Kind;

    /** Which of the kind's models; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `bin` when absent. */
    id?: string;
  }
}
