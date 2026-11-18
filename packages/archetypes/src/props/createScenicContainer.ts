import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";
import { SCENIC_CONTAINER_BANDS } from "./SCENIC_CONTAINER_BANDS";

/** Builder specialized to the scenic container's dimensions and single placement surface. */
type Builder = ArchetypeBuilder<
  createScenicContainer.Affordance,
  createScenicContainer.Dimension
>;

/** Readable names for the five scene props. */
const NAMES: Readonly<Record<createScenicContainer.Kind, string>> = {
  coilBasket: "coil basket",
  woodenFishBasket: "wooden fish basket",
  plankCoffer: "plank coffer",
  moldedCrate: "molded crate",
  cargoPod: "cargo pod",
};

/** Eight outline points whose opposite cardinal vertices meet the drawn width and depth. */
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
 * A static scenic container centered at the origin on its lowest face, with width along X and depth along Z.
 *
 * A coil basket, plank coffer or fictional cargo pod offers its closed top. A wooden fish basket or molded crate offers its interior floor. The surface is an upright rectangular footprint wholly supported by the visible geometry. The props have no moving components.
 *
 * @param params Silhouette and any author-fixed dimensions.
 * @param seed Draws dimensions that the author leaves free. Omit it for band midpoints.
 * @returns A container with one placement surface.
 * @throws {ArchetypeRefusal} For an unknown kind or an invalid fixed dimension.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the origin, axes and placement surface for both closed and open props.
 * @evidence contracts/development/implementation.md#principled-implementation Closed forms use consecutive solid sections. Open forms use a real floor and discrete wall cells or rails. Each upward contact uses the height and a supported rectangle of its own visible part.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the four dimensions, dispatch by silhouette, and give the builder the drawn mass.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The museum references inform the silhouette, and no mass estimate represents a load rating. Open containers have no solid collider above the interior floor except at their visible walls.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each silhouette emits a fixed number of primitives or convex cells, with at most sixteen corners per cell.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each build has independently drawn geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns only model data and acquires no external resource.
 */
export function createScenicContainer(
  params: createScenicContainer.IParams,
  seed?: number | string,
): Archetype<
  createScenicContainer.Affordance,
  createScenicContainer.Dimension
> {
  const draw: ArchetypeDrawSession<createScenicContainer.Dimension> =
    new ArchetypeDrawSession(
      "scenicContainer",
      createScenicContainer.UNITS,
      seed,
      params,
    );
  const kind: createScenicContainer.Kind = ArchetypeDraw.choice(
    "scenicContainer",
    "kind",
    params.kind,
    createScenicContainer.KINDS,
  );
  const dimensions: Partial<Record<createScenicContainer.Dimension, number>> =
    draw.dimensions(createScenicContainer.BANDS[kind]);
  const width: number = dimensions.width!;
  const depth: number = dimensions.depth!;
  const height: number = dimensions.height!;
  const builder: Builder = new ArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: NAMES[kind],
    draw,
  });

  switch (kind) {
    case "coilBasket":
      coilBasket(builder, width, depth, height);
      break;
    case "woodenFishBasket":
      fishBasket(builder, width, depth, height);
      break;
    case "plankCoffer":
      coffer(builder, width, depth, height);
      break;
    case "moldedCrate":
      crate(builder, width, depth, height);
      break;
    case "cargoPod":
      pod(builder, width, depth, height);
      break;
  }
  return builder.build(dimensions.mass!);
}

/** Points on one horizontal polygon at the given height and full diameters. */
function outline(width: number, depth: number, y: number): IAutoMovieVector3[] {
  return OCTAGON.map(
    ([x, z]: readonly [number, number]): IAutoMovieVector3 =>
      v((x * width) / 2, y, (z * depth) / 2),
  );
}

/** An upward rectangle in the model's X and Z axes, supported at the specified height. */
function surface(
  builder: Builder,
  id: createScenicContainer.Affordance,
  y: number,
  width: number,
  depth: number,
): void {
  builder.affordance({
    id,
    kind: "stack-top",
    frame: ArchetypeFrame.upright(v(0, y, 0)),
    extent: [
      v(-width / 2, 0, -depth / 2),
      v(width / 2, 0, -depth / 2),
      v(width / 2, 0, depth / 2),
      v(-width / 2, 0, depth / 2),
    ],
  });
}

/** Fixed stacked sections suggest a coiled body and fitted lid in the guide render. */
function coilBasket(
  builder: Builder,
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

/** Willow-colored panels widen toward the rim while leaving the open interior clear. */
function fishBasket(
  builder: Builder,
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

/** An overhanging plank lid and three differently toned planks define the closed wooden chest. */
function coffer(
  builder: Builder,
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

/** An uninterrupted floor and ribbed open walls represent a molded dairy crate. */
function crate(
  builder: Builder,
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

/** A fictional faceted pod with a contrasting center shell and flat cap. */
function pod(
  builder: Builder,
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
 * Silhouettes, sizing and placement vocabulary for {@link createScenicContainer}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies dimensions, local axes and which surface exists on each silhouette.
 * @evidence contracts/development/design.md#principled-representation A closed silhouette union draws one band per dimension and each kind declares one real support.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The props producer owns the shape and uses the standard archetype surface contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Illustrative bands carry provenance and the fictional kind is identified as such.
 */
export namespace createScenicContainer {
  /**
   * The four historical scene forms and one fictional design.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Declares the alternatives selected by scene period.
   */
  export type Kind =
    | "coilBasket"
    | "woodenFishBasket"
    | "plankCoffer"
    | "moldedCrate"
    | "cargoPod";

  /**
   * The kinds in order from ancient through fictional future.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies the stable historical ordering.
   */
  export const KINDS: readonly Kind[] = [
    "coilBasket",
    "woodenFishBasket",
    "plankCoffer",
    "moldedCrate",
    "cargoPod",
  ];

  /**
   * The closed lid or the floor of an open container, respectively.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the location of each contact.
   */
  export type Affordance = "top" | "inside";

  /**
   * Overall width along X, depth along Z, height along Y in metres, and estimated prop mass in kilograms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents axes and units.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /**
   * Units used by the dimension draw.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Matches each length and mass key to its draw unit.
   */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * A selected silhouette and optional fixed members of its dimension bands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the required form and its optional size overrides.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The selected silhouette. */
    kind: Kind;

    /** The model id in the scene. Defaults to scenicContainer. */
    id?: string;
  }

  /**
   * Illustrative sizing bands and their sources by kind.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Exposes the same provenance used by generation.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = SCENIC_CONTAINER_BANDS;
}
