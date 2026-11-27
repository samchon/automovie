import { AutoMovieEngineVector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeBinData } from "./internal/AutoMovieArchetypeBinData";

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
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
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
  export const MODELS: typeof AutoMovieArchetypeBinData.BIN_MODELS = AutoMovieArchetypeBinData.BIN_MODELS;

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

/*
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `lid`, a dumpster lid's thickness; `bar`, a
 * handle's and a wheel's width.
 */
const ESTIMATES: Readonly<{ lid: number; bar: number }> = {
  lid: 0.03,
  bar: 0.03,
};
