import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core";
import { createScenicContainer } from "./createScenicContainer";

/** Readable names for the five scene props. */
const NAMES: Readonly<Record<createScenicContainer.Kind, string>> = {
  coilBasket: "coil basket",
  woodenFishBasket: "wooden fish basket",
  plankCoffer: "plank coffer",
  moldedCrate: "molded crate",
  cargoPod: "cargo pod",
};

/**
 * Eight outline points whose opposite cardinal vertices meet the drawn width
 * and depth.
 */
const OCTAGON: readonly (readonly [number, number])[] = [
  [1, 0],
  [Math.SQRT1_2, Math.SQRT1_2],
  [0, 1],
  [-Math.SQRT1_2, Math.SQRT1_2],
  [-1, 0],
  [-Math.SQRT1_2, -Math.SQRT1_2],
  [0, -1],
  [Math.SQRT1_2, -Math.SQRT1_2],
];

/** Shorthand for constructing a point or box size in model coordinates. */
const v: typeof Vector3.create = Vector3.create;

/**
 * A selected scenic support construction, with all dimensions in the saved
 * units.
 */
type Builder<Id extends createScenicContainer.Affordance | "mount"> =
  AutoMovieArchetypeBuilder<Id, createScenicContainer.Dimension>;

/**
 * Shape writers consume their contact IDs without exposing a fluent builder
 * result.
 */
type ShapeWriter<Id extends createScenicContainer.Affordance> = {
  [Method in "affordance" | "box" | "convex"]: (
    ...args: Parameters<Builder<Id>[Method]>
  ) => void;
};

/** The contact ids {@link draw} can type its builder with. */
type DrawContact = createScenicContainer.Affordance | "mount";

/** What {@link draw} prepares for its caller. */
interface IDrawResult<Id extends DrawContact> {
  /** The prepared `builder` this call returns. */
  builder: Builder<Id>;

  /** The prepared `dimensions` this call returns. */
  dimensions: Record<createScenicContainer.Dimension, number>;
}

/** Draw the four dimensions for the selected shape before building its solids. */
function draw<Id extends DrawContact>(
  kind: createScenicContainer.Kind,
  params: Omit<createScenicContainer.IParams, "kind">,
  seed?: number,
): IDrawResult<Id> {
  const session: AutoMovieArchetypeDrawSession<createScenicContainer.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "scenicContainer",
      createScenicContainer.UNITS,
      seed,
      params,
    );
  const dimensions: Record<createScenicContainer.Dimension, number> =
    session.dimensions(createScenicContainer.BANDS[kind]);
  const builder: Builder<Id> = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: NAMES[kind],
    draw: session,
  });

  return { builder, dimensions };
}

/** Points on one horizontal polygon at the given height and full diameters. */
function outline(width: number, depth: number, y: number): IAutoMovieVector3[] {
  return OCTAGON.map(
    ([x, z]: readonly [number, number]): IAutoMovieVector3 =>
      v((x * width) / 2, y, (z * depth) / 2),
  );
}

/**
 * An upward rectangle in the model's X and Z axes, supported at the specified
 * height.
 */
function surface<Id extends createScenicContainer.Affordance>(
  builder: Pick<ShapeWriter<Id>, "affordance">,
  id: Id,
  y: number,
  width: number,
  depth: number,
): void {
  builder.affordance({
    id,
    kind: "stack-top",
    frame: AutoMovieArchetypeFrame.upright(v(0, y, 0)),
    extent: [
      v(-width / 2, 0, -depth / 2),
      v(width / 2, 0, -depth / 2),
      v(width / 2, 0, depth / 2),
      v(-width / 2, 0, depth / 2),
    ],
  });
}

/** The builder methods {@link coilBasket} uses to add its parts and contacts. */
type CoilBasketWriter = "convex" | "affordance";

/**
 * Fixed stacked sections suggest a coiled body and fitted lid in the guide
 * render.
 */
function coilBasket(
  builder: Pick<ShapeWriter<"top">, CoilBasketWriter>,
  width: number,
  depth: number,
  height: number,
): void {
  const shoulder: number = height * 0.22;
  const seam: number = height * 0.86;
  builder.convex(
    "foot",
    [
      ...outline(width * 0.82, depth * 0.82, 0),
      ...outline(width, depth, shoulder),
    ],
    undefined,
    { color: "#a87947" },
  );
  builder.convex(
    "body",
    [...outline(width, depth, shoulder), ...outline(width, depth, seam)],
    undefined,
    { color: "#c49a61" },
  );
  builder.convex(
    "lid",
    [
      ...outline(width, depth, seam),
      ...outline(width * 0.88, depth * 0.88, height),
    ],
    undefined,
    { color: "#b58a50" },
  );
  surface(
    builder,
    "top",
    height,
    width * 0.88 * Math.SQRT1_2,
    depth * 0.88 * Math.SQRT1_2,
  );
}

/** The builder methods {@link fishBasket} uses to add its parts and contacts. */
type FishBasketWriter = "convex" | "box" | "affordance";

/**
 * Willow-colored panels widen toward the rim while leaving the open interior
 * clear.
 */
function fishBasket(
  builder: Pick<ShapeWriter<"inside">, FishBasketWriter>,
  width: number,
  depth: number,
  height: number,
): void {
  const floor: number = height * 0.1;
  const baseScale: number = 0.62;
  const insideScale: number = 0.88;
  const bottom: IAutoMovieVector3[] = outline(
    width * baseScale,
    depth * baseScale,
    floor,
  );
  const innerBottom: IAutoMovieVector3[] = outline(
    width * baseScale * insideScale,
    depth * baseScale * insideScale,
    floor,
  );
  const rim: IAutoMovieVector3[] = outline(width, depth, height);
  const innerRim: IAutoMovieVector3[] = outline(
    width * insideScale,
    depth * insideScale,
    height,
  );

  builder.convex(
    "floor",
    [...outline(width * baseScale, depth * baseScale, 0), ...bottom],
    undefined,
    { color: "#806342" },
  );
  for (let index: number = 0; index < OCTAGON.length; index++) {
    const next: number = (index + 1) % OCTAGON.length;
    builder.convex(
      `willow-panel-${index}`,
      [
        bottom[index]!,
        bottom[next]!,
        innerBottom[index]!,
        innerBottom[next]!,
        rim[index]!,
        rim[next]!,
        innerRim[index]!,
        innerRim[next]!,
      ],
      undefined,
      { color: index % 2 === 0 ? "#a68752" : "#967744" },
    );
  }
  surface(
    builder,
    "inside",
    floor,
    width * baseScale * insideScale * Math.SQRT1_2,
    depth * baseScale * insideScale * Math.SQRT1_2,
  );
}

/** The builder methods {@link coffer} uses to add its parts and contacts. */
type CofferWriter = "box" | "affordance";

/**
 * An overhanging plank lid and three differently toned planks define the closed
 * wooden chest.
 */
function coffer(
  builder: Pick<ShapeWriter<"top">, CofferWriter>,
  width: number,
  depth: number,
  height: number,
): void {
  const lid: number = height * 0.15;
  const plank: number = (height - lid) / 3;
  for (const [index, color] of ["#72543b", "#927051", "#816043"].entries())
    builder.box(
      `plank-${index}`,
      v(width * 0.94, plank, depth * 0.9),
      v(0, plank * (index + 0.5), 0),
      { color },
    );
  builder.box("lid", v(width, lid, depth), v(0, height - lid / 2, 0), {
    color: "#614834",
  });
  surface(builder, "top", height, width, depth);
}

/** The builder methods {@link crate} uses to add its parts and contacts. */
type CrateWriter = "box" | "affordance";

/** An uninterrupted floor and ribbed open walls represent a molded dairy crate. */
function crate(
  builder: Pick<ShapeWriter<"inside">, CrateWriter>,
  width: number,
  depth: number,
  height: number,
): void {
  const floor: number = height * 0.12;
  const rail: number = height * 0.1;
  const wall: number = Math.min(width, depth) * 0.06;
  const insideHeight: number = height - rail - floor;
  const color: string = "#435b64";
  const stride: number = 5;
  const insideDepth: number = depth - 2 * wall;

  builder.box("floor", v(width, floor, depth), v(0, floor / 2, 0), { color });
  for (const sign of [-1, 1]) {
    const x: number = (sign * (width - wall)) / 2;
    const z: number = (sign * (depth - wall)) / 2;
    builder.box(
      `rim-x-${sign}`,
      v(width, rail, wall),
      v(0, height - rail / 2, z),
      { color },
    );
    builder.box(
      `rim-z-${sign}`,
      v(wall, rail, insideDepth),
      v(x, height - rail / 2, 0),
      { color },
    );
    for (let step: number = 0; step <= stride; step++) {
      const across: number = step / stride - 0.5;
      const y: number = floor + insideHeight / 2;
      builder.box(
        `rib-x-${sign}-${step}`,
        v(wall, insideHeight, wall),
        v(across * (width - wall), y, z),
        { color },
      );
      if (step !== 0 && step !== stride)
        builder.box(
          `rib-z-${sign}-${step}`,
          v(wall, insideHeight, wall),
          v(x, y, across * (depth - wall)),
          { color },
        );
    }
  }
  surface(builder, "inside", floor, width - 2 * wall, insideDepth);
}

/** The builder methods {@link pod} uses to add its parts and contacts. */
type PodWriter = "convex" | "affordance";

/** A fictional faceted pod with a contrasting center shell and flat cap. */
function pod(
  builder: Pick<ShapeWriter<"top">, PodWriter>,
  width: number,
  depth: number,
  height: number,
): void {
  const foot: number = height * 0.24;
  const shoulder: number = height * 0.72;
  const capScale: number = 0.7;
  builder.convex(
    "base",
    [...outline(width * 0.76, depth * 0.76, 0), ...outline(width, depth, foot)],
    undefined,
    { color: "#313c49" },
  );
  builder.convex(
    "shell",
    [...outline(width, depth, foot), ...outline(width, depth, shoulder)],
    undefined,
    { color: "#518287" },
  );
  builder.convex(
    "cap",
    [
      ...outline(width, depth, shoulder),
      ...outline(width * capScale, depth * capScale, height),
    ],
    undefined,
    { color: "#d4dbd8" },
  );
  surface(
    builder,
    "top",
    height,
    width * capScale * Math.SQRT1_2,
    depth * capScale * Math.SQRT1_2,
  );
}

/**
 * Scenic container shells and their supported placement surfaces or cargo
 * mounting frame.
 */
export namespace ScenicContainerConstruction {
  /** The values {@link baskets} accepts at this place in its signature. */
  export type BasketsKind = "coilBasket" | "woodenFishBasket";

  /** The contact ids {@link baskets} builds or reads. */
  export type BasketsContact = "top" | "inside";

  /** Build a lidded coil basket or an open fish basket. */
  export function baskets(
    kind: BasketsKind,
    params: Omit<createScenicContainer.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<BasketsContact, createScenicContainer.Dimension> {
    const { builder, dimensions }: ReturnType<typeof draw<BasketsContact>> =
      draw<BasketsContact>(kind, params, seed);
    const {
      width,
      depth,
      height,
      mass,
    }: Record<createScenicContainer.Dimension, number> = dimensions;
    if (kind === "coilBasket") coilBasket(builder, width, depth, height);
    else fishBasket(builder, width, depth, height);
    return builder.build(mass);
  }

  /** Build a closed plank coffer with a stacking footprint on its lid. */
  export function closedCoffer(
    params: Omit<createScenicContainer.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<"top", createScenicContainer.Dimension> {
    const { builder, dimensions }: ReturnType<typeof draw<"top">> = draw<"top">(
      "plankCoffer",
      params,
      seed,
    );
    const {
      width,
      depth,
      height,
      mass,
    }: Record<createScenicContainer.Dimension, number> = dimensions;
    coffer(builder, width, depth, height);
    return builder.build(mass);
  }

  /** Build an open molded crate with a stacking footprint inside the rim. */
  export function openCrate(
    params: Omit<createScenicContainer.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<"inside", createScenicContainer.Dimension> {
    const { builder, dimensions }: ReturnType<typeof draw<"inside">> =
      draw<"inside">("moldedCrate", params, seed);
    const {
      width,
      depth,
      height,
      mass,
    }: Record<createScenicContainer.Dimension, number> = dimensions;
    crate(builder, width, depth, height);
    return builder.build(mass);
  }

  /** Replay the scenic cargo pod with its cap stacking footprint. */
  export function scenicPod(
    params: Omit<createScenicContainer.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<"top", createScenicContainer.Dimension> {
    const { builder, dimensions }: ReturnType<typeof draw<"top">> = draw<"top">(
      "cargoPod",
      params,
      seed,
    );
    const {
      width,
      depth,
      height,
      mass,
    }: Record<createScenicContainer.Dimension, number> = dimensions;
    pod(builder, width, depth, height);
    return builder.build(mass);
  }

  /** The contact ids {@link mountedPod} builds or reads. */
  export type MountedPodContact = "top" | "mount";

  /** Build a cargo pod with both a stacking cap and a lower mounting socket. */
  export function mountedPod(
    params: Omit<createScenicContainer.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<MountedPodContact, createScenicContainer.Dimension> {
    const { builder, dimensions }: ReturnType<typeof draw<MountedPodContact>> =
      draw<MountedPodContact>("cargoPod", params, seed);
    const {
      width,
      depth,
      height,
      mass,
    }: Record<createScenicContainer.Dimension, number> = dimensions;
    pod(builder, width, depth, height);

    builder.affordance({
      id: "mount",
      kind: "socket",
      direction: "along",
      frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
      extent: null,
    });
    return builder.build(mass);
  }
}
