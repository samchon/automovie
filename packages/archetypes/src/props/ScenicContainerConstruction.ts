import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "../core";
import { createScenicContainer } from "./createScenicContainer";

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

/** A selected scenic support construction, with all dimensions in the saved units. */
type Builder<Id extends createScenicContainer.Affordance | "mount"> =
  ArchetypeBuilder<Id, createScenicContainer.Dimension>;

/** Shape writers consume their contact IDs without exposing a fluent builder result. */
type ShapeWriter<Id extends createScenicContainer.Affordance> = {
  [Method in "affordance" | "box" | "convex"]: (
    ...args: Parameters<Builder<Id>[Method]>
  ) => void;
};

/** The values {@link draw} accepts at this place in its signature. */
type DrawChoice = createScenicContainer.Affordance | "mount";

/** Draw the four dimensions for the selected shape before building its solids. */
function draw<Id extends DrawChoice>(
  kind: createScenicContainer.Kind,
  params: Omit<createScenicContainer.IParams, "kind">,
  seed?: number | string,
): {
  builder: Builder<Id>;
  dimensions: Record<createScenicContainer.Dimension, number>;
} {
  const session: ArchetypeDrawSession<createScenicContainer.Dimension> =
    new ArchetypeDrawSession(
      "scenicContainer",
      createScenicContainer.UNITS,
      seed,
      params,
    );
  const dimensions: Record<createScenicContainer.Dimension, number> =
    session.dimensions(createScenicContainer.BANDS[kind]);
  const builder: Builder<Id> = new ArchetypeBuilder({
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

/** An upward rectangle in the model's X and Z axes, supported at the specified height. */
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
    frame: ArchetypeFrame.upright(v(0, y, 0)),
    extent: [
      v(-width / 2, 0, -depth / 2),
      v(width / 2, 0, -depth / 2),
      v(width / 2, 0, depth / 2),
      v(-width / 2, 0, depth / 2),
    ],
  });
}

/** The values {@link coilBasket} accepts at this place in its signature. */
type CoilBasketChoice = "convex" | "affordance";

/** Fixed stacked sections suggest a coiled body and fitted lid in the guide render. */
function coilBasket(
  builder: Pick<ShapeWriter<"top">, CoilBasketChoice>,
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

/** The values {@link fishBasket} accepts at this place in its signature. */
type FishBasketChoice = "convex" | "box" | "affordance";

/** Willow-colored panels widen toward the rim while leaving the open interior clear. */
function fishBasket(
  builder: Pick<ShapeWriter<"inside">, FishBasketChoice>,
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

/** The values {@link coffer} accepts at this place in its signature. */
type CofferChoice = "box" | "affordance";

/** An overhanging plank lid and three differently toned planks define the closed wooden chest. */
function coffer(
  builder: Pick<ShapeWriter<"top">, CofferChoice>,
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

/** The values {@link crate} accepts at this place in its signature. */
type CrateChoice = "box" | "affordance";

/** An uninterrupted floor and ribbed open walls represent a molded dairy crate. */
function crate(
  builder: Pick<ShapeWriter<"inside">, CrateChoice>,
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

/** The values {@link pod} accepts at this place in its signature. */
type PodChoice = "convex" | "affordance";

/** A fictional faceted pod with a contrasting center shell and flat cap. */
function pod(
  builder: Pick<ShapeWriter<"top">, PodChoice>,
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
 * Scenic container shells and their supported placement surfaces or cargo mounting frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Scenic container shells and their supported placement surfaces or cargo mounting frame.
 * @evidence contracts/development/design.md#principled-representation Each construction applies the selected variant's coordinate frame and dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the named producers and the legacy selector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape dispatch is shared between unrelated mechanisms.
 */
export namespace ScenicContainerConstruction {
  /** The values {@link baskets} accepts at this place in its signature. */
  export type BasketsKind = "coilBasket" | "woodenFishBasket";

  /** The contact ids {@link baskets} builds or reads. */
  export type BasketsContact = "top" | "inside";

  /**
   * Build a lidded coil basket or an open fish basket.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a lidded coil basket or an open fish basket.
   * @evidence contracts/development/implementation.md#principled-implementation The coil basket's closed lid and the fish basket's clear floor each supply the footprint supported by their own geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The two documented coarse silhouettes retain their covered-top or open-bottom contracts.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each basket uses a fixed number of cells.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function baskets(
    kind: BasketsKind,
    params: Omit<createScenicContainer.IParams, "kind">,
    seed?: number | string,
  ): Archetype<BasketsContact, createScenicContainer.Dimension> {
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

  /**
   * Build a closed plank coffer with a stacking footprint on its lid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a closed plank coffer with a stacking footprint on its lid.
   * @evidence contracts/development/implementation.md#principled-implementation The lid's supported top spans the measured rectangular outline.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The coarse closed construction retains the same supported footprint and geometry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four boxes and one contact.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function closedCoffer(
    params: Omit<createScenicContainer.IParams, "kind">,
    seed?: number | string,
  ): Archetype<"top", createScenicContainer.Dimension> {
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

  /**
   * Build an open molded crate with a stacking footprint inside the rim.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build an open molded crate with a stacking footprint inside the rim.
   * @evidence contracts/development/implementation.md#principled-implementation The ribbed walls surround a clear interior over the physical floor. The placement rectangle ends before the walls.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The earlier illustrative molded crate dimensions and sparse rails are reused.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of ribs and rails.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function openCrate(
    params: Omit<createScenicContainer.IParams, "kind">,
    seed?: number | string,
  ): Archetype<"inside", createScenicContainer.Dimension> {
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

  /**
   * Replay the scenic cargo pod with its cap stacking footprint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Replay the scenic cargo pod with its cap stacking footprint.
   * @evidence contracts/development/implementation.md#principled-implementation Three faceted sections taper to the cap. The footprint is entirely on that cap.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The legacy appearance and single stacking contact replay exactly.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three solids with at most sixteen corners each.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the historical selector calls this construction. It shares the pod geometry and draw namespace with mountedPod.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function scenicPod(
    params: Omit<createScenicContainer.IParams, "kind">,
    seed?: number | string,
  ): Archetype<"top", createScenicContainer.Dimension> {
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

  /**
   * Build a cargo pod with both a stacking cap and a lower mounting socket.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a cargo pod with both a stacking cap and a lower mounting socket.
   * @evidence contracts/development/implementation.md#principled-implementation Three faceted sections follow the saved size. The mounting origin lies on the base face and its +Y axis is up.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The added socket is an authoring frame only. No fastener or extra shape is drawn.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three solids and two contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the named producer calls this construction. It shares the pod geometry and draw namespace with scenicPod, so both paths give the same parts at a seed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function mountedPod(
    params: Omit<createScenicContainer.IParams, "kind">,
    seed?: number | string,
  ): Archetype<MountedPodContact, createScenicContainer.Dimension> {
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
      frame: ArchetypeFrame.upright(v(0, 0, 0)),
      extent: null,
    });
    return builder.build(mass);
  }
}
