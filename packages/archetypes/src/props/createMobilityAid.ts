import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The maker's offset cane, read. */
const CANE: string =
  "Drive Medical offset handle aluminium cane: handle height adjusts from 30 to 39 in, 3/4 in diameter (https://shop.drivemedical.com/us/en/products/mobility/canes/offset/offset-handle-aluminum-canes/p/477-1)";

/** A retailer's weight of that cane, seen only in search results. */
const CANE_MASS: string =
  "a retailer's 0.85 lb for the Drive offset cane, seen only in search results";

/** The maker's walker, read, and its depth seen only in search results. */
const WALKER: string =
  "Drive Medical deluxe two-button folding walker 10210-1: handle height 32 to 39 in, overall width 24 in, 7 to 7.5 lb (https://shop.drivemedical.com/us/en/products/mobility/walkers/push-button/deluxe-folding-walker-two-button-with-5-wheels/p/10210-1/downloadPdf); its 18 in base depth seen only in search results";

/** The handle diameters hands rated most comfortable in a power grip. */
const POWER: string =
  "Kong and Lowe 2005, Int J Ind Ergon 35:495, handles of 30 to 40 mm rated most comfortable (https://stacks.cdc.gov/view/cdc/197408), applied to a walker's frame, whose tube no maker read sizes";

/**
 * An aid a person walks with: a cane or a walking frame (a walker).
 *
 * Each stands on the floor at the origin, the user behind it facing `+Z`:
 *
 * - a cane is a shaft up `+Y` to its handle height, its offset handle running forward along `+Z` from the shaft's top. `grip` is the handle, taken from above; `tip` is the rubber foot, facing down onto the floor.
 * - a walker is four legs at its corners, `width` across `X` and `depth` along `Z`, joined by a rail along each side and a bar across the front at the handle height; the user stands in its open back. `leftGrip` and `rightGrip` are the side rails at `+X` and `-X`, taken from above; `tip` is the floor under its middle, facing down.
 *
 * A gait that walks with an aid has no motion law yet; the aid is built for holding, standing and carrying. A crutch waits for a source of its hand grip's height, and an infusion stand for its pole's diameter.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The aid.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each aid stands, where it is held, what is missing for a gait, and which kinds wait for a source.
 * @evidence contracts/development/implementation.md#principled-implementation Rods from the published heights, widths and diameters; each grip's frame lies at the centre of the rod it closes on, with that rod's diameter as its aperture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then one branch per kind: its rods, its grips and its foot.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No wheels, glides, folding joints or rubber tip are drawn; the cane's offset handle's length is a named estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most seven parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createMobilityAid(
  params: createMobilityAid.IParams,
  seed?: number | string,
): Archetype<createMobilityAid.Affordance, createMobilityAid.Dimension> {
  const kind: createMobilityAid.Kind = ArchetypeDraw.choice(
    "mobilityAid",
    "kind",
    params.kind,
    createMobilityAid.KINDS,
  );
  const d: Partial<Record<createMobilityAid.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "mobilityAid",
      createMobilityAid.BANDS[kind],
      seed,
      params,
      createMobilityAid.BANDS,
    );
  const builder: ArchetypeBuilder<
    createMobilityAid.Affordance,
    createMobilityAid.Dimension
  > = new ArchetypeBuilder({
    archetype: "mobilityAid",
    id: params.id,
    name: kind === "cane" ? "walking cane" : "walking frame",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const height: number = d.height!;
  const r: number = d.diameter! / 2;
  const metal: string = "#9aa1a6";

  if (kind === "cane") {
    const handle: number = createMobilityAid.HANDLE;
    builder.rod("shaft", r, v(0, 0, 0), v(0, height - r, 0), { color: metal });
    builder.rod(
      "handle",
      r,
      v(0, height - r, -r),
      v(0, height - r, handle),
      { color: "#2c2f33" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(0, height - r, (handle - r) / 2),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * r,
      length: handle + r,
    });
  } else {
    // Four legs, a rail along each side and a bar across the front, all at the handle height.
    const x: number = d.width! / 2 - r;
    const z: number = d.depth! / 2 - r;
    const top: number = height - r;
    for (const [id, sx, sz] of [
      ["legFrontLeft", 1, 1],
      ["legFrontRight", -1, 1],
      ["legBackLeft", 1, -1],
      ["legBackRight", -1, -1],
    ] as const)
      builder.rod(id, r, v(sx * x, 0, sz * z), v(sx * x, top, sz * z), {
        color: metal,
      });
    builder.rod("front", r, v(-x, top, z), v(x, top, z), { color: metal });
    for (const [id, sx] of [
      ["leftGrip", 1],
      ["rightGrip", -1],
    ] as const) {
      builder.rod(id, r, v(sx * x, top, -z), v(sx * x, top, z), {
        color: "#2c2f33",
      });
      builder.affordance({
        id,
        kind: "handle",
        symmetry: "round",
        frame: ArchetypeFrame.facing(v(sx * x, top, 0), v(0, 1, 0), v(0, 0, 1)),
        extent: null,
        grip: "power",
        aperture: 2 * r,
        length: 2 * z,
      });
    }
  }
  builder.affordance({
    id: "tip",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createMobilityAid}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the two aids with sourced bands, one band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grips a hand takes and the foot on the floor (#3468's N5).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The heights, widths, diameter and walker's weight are the maker's as read; the walker's depth and the cane's weight are seen only in search results and a walker's tube is a grip band applied, all provisional; the cane's handle length is a named estimate.
 */
export namespace createMobilityAid {
  /** The kinds: an offset cane and a walking frame. */
  export type Kind = "cane" | "walker";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["cane", "walker"];

  /** The cane's offset handle, forward of the shaft, metres: an estimate. */
  export const HANDLE: number = 0.12;

  /**
   * The affordance ids:
   *
   * - `grip`: a cane's handle, taken from above.
   * - `leftGrip`, `rightGrip`: a walker's side rails at `+X` and `-X`, taken from above.
   * - `tip`: the foot on the floor, facing down.
   */
  export type Affordance = "grip" | "leftGrip" | "rightGrip" | "tip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the handle's top above the floor.
   * - `diameter`: a cane's shaft, a walker's tube.
   * - `width`, `depth`: a walker's across `X` and along `Z`.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "width" | "depth" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which aid. */
    kind: Kind;

    /** The model's id, unique in a scene; `mobilityAid` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    cane: {
      height: ArchetypeBand.metres(30 * 0.0254, 39 * 0.0254, CANE),
      diameter: ArchetypeBand.metres(0.75 * 0.0254, 0.75 * 0.0254, CANE),
      mass: ArchetypeBand.of("kg", 0.85 * 0.4536, 0.85 * 0.4536, CANE_MASS, true),
    },
    walker: {
      height: ArchetypeBand.metres(32 * 0.0254, 39 * 0.0254, WALKER),
      width: ArchetypeBand.metres(24 * 0.0254, 24 * 0.0254, WALKER),
      depth: ArchetypeBand.metres(18 * 0.0254, 18 * 0.0254, WALKER, true),
      diameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
      mass: ArchetypeBand.of("kg", 7 * 0.4536, 7.5 * 0.4536, WALKER),
    },
  };
}
