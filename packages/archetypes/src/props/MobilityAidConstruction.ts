import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";
import { createMobilityAid } from "./createMobilityAid";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createMobilityAid.Kind, string>> = {
  cane: "walking cane",
  walker: "walking frame",
  infusionStand: "infusion stand",
};

/** The model-space construction for the selected contact IDs. */
type Builder<Id extends createMobilityAid.Affordance> = ArchetypeBuilder<
  Id,
  createMobilityAid.Dimension
>;

/** Model dimensions in the legacy family's recorded units. */
type Dimensions = Partial<Record<createMobilityAid.Dimension, number>>;

/** Model coordinates in metres. */
const v: typeof Vector3.create = Vector3.create;

/** The shared painted metal part color. */
const metal: string = "#9aa1a6";

/** A started construction: its builder and its drawn dimensions. */
interface IDrawn<Id extends createMobilityAid.Affordance> {
  /** The model-space builder for the selected contact ids. */
  builder: Builder<Id>;

  /** The drawn and fixed dimensions in the family's recorded units. */
  d: Dimensions;
}

/** Draw the selected stand or aid's admitted dimensions in the historical stream. */
function draw<Id extends createMobilityAid.Affordance>(
  kind: createMobilityAid.Kind,
  params: Omit<createMobilityAid.IParams, "kind">,
  seed?: number | string,
): IDrawn<Id> {
  const session: ArchetypeDrawSession<createMobilityAid.Dimension> =
    new ArchetypeDrawSession<createMobilityAid.Dimension>(
      "mobilityAid",
      createMobilityAid.UNITS,
      seed,
      params,
    );
  // A walker is Drive's adult or junior model whole, its handle height drawn in that model's own range.
  const model: {
    name: createMobilityAid.Model | undefined;
    figures: createMobilityAid.Figures;
  } = session.model<createMobilityAid.Model>(
    "model",
    params.model,
    createMobilityAid.MODELS[kind],
  );
  // The model's own range bands its height, so the author's height is checked in it.
  const range: IArchetypeBand | undefined =
    model.name === undefined
      ? undefined
      : createMobilityAid.HANDLE_HEIGHTS[model.name];
  const d: Partial<Record<createMobilityAid.Dimension, number>> = {
    ...session.dimensions(
      range === undefined
        ? createMobilityAid.BANDS[kind]
        : { ...createMobilityAid.BANDS[kind], height: range },
      createMobilityAid.BANDS,
    ),
    ...model.figures,
  };
  const builder: Builder<Id> = new ArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: NAMES[kind],
    draw: session,
  });
  return { builder, d };
}

/** Put the downward floor reference under the model origin. */
function tip(builder: {
  affordance(contact: Parameters<Builder<"tip">["affordance"]>[0]): void;
}): void {
  builder.affordance({
    id: "tip",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
  });
}

/**
 * Shared sizing and individual constructions for floor-supported props held beside a person.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Shared sizing and individual constructions for floor-supported props held beside a person.
 * @evidence contracts/development/design.md#principled-representation Each construction applies the selected variant's coordinate frame and dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the named producers and the legacy selector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape dispatch is shared between unrelated mechanisms.
 */
export namespace MobilityAidConstruction {
  /**
   * The contact ids {@link cane} builds or reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids in the signature of cane.
   * @evidence contracts/development/design.md#principled-representation A closed union of the literal contact ids the construction builds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only cane and the named producers that call it read this union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It names no contact the construction does not build.
   */
  export type CaneContact = "grip" | "tip";

  /**
   * Build an offset cane with a floor tip and a handle across its shaft.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build an offset cane with a floor tip and a handle across its shaft.
   * @evidence contracts/development/implementation.md#principled-implementation Fit the shaft and horizontal rod from the admitted metres. The grip closes around the rod's diameter.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the offset-handle construction estimate and its original grip frame.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two rods and two contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function cane(
    params: Omit<createMobilityAid.IParams, "kind">,
    seed?: number | string,
  ): Archetype<CaneContact, createMobilityAid.Dimension> {
    const { builder, d }: ReturnType<typeof draw<CaneContact>> =
      draw<CaneContact>("cane", params, seed);
    const height: number = d.height!;
    const r: number = d.diameter! / 2;
    const handle: number = createMobilityAid.HANDLE;
    builder.rod("shaft", r, v(0, 0, 0), v(0, height - r, 0), { color: metal });
    builder.rod("handle", r, v(0, height - r, -r), v(0, height - r, handle), {
      color: "#2c2f33",
    });
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

    tip(builder);
    return builder.build(d.mass!);
  }

  /**
   * The contact ids {@link walker} builds or reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids in the signature of walker.
   * @evidence contracts/development/design.md#principled-representation A closed union of the literal contact ids the construction builds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only walker and the named producers that call it read this union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It names no contact the construction does not build.
   */
  export type WalkerContact = "leftGrip" | "rightGrip" | "tip";

  /**
   * Build a walking frame with paired side rail grips and a central floor tip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a walking frame with paired side rail grips and a central floor tip.
   * @evidence contracts/development/implementation.md#principled-implementation Fit the four legs and three rails from the manufacturer's admitted dimensions. Grip sites lie on the side rail axes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the existing adult or junior measured options and shaft-diameter estimate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Seven rods and three contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function walker(
    params: Omit<createMobilityAid.IParams, "kind">,
    seed?: number | string,
  ): Archetype<WalkerContact, createMobilityAid.Dimension> {
    const { builder, d }: ReturnType<typeof draw<WalkerContact>> =
      draw<WalkerContact>("walker", params, seed);
    const height: number = d.height!;
    const r: number = d.diameter! / 2;
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

    tip(builder);
    return builder.build(d.mass!);
  }

  /**
   * The contact ids {@link infusionStand} builds or reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids in the signature of infusionStand.
   * @evidence contracts/development/design.md#principled-representation A closed union of the literal contact ids the construction builds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only infusionStand and the named producers that call it read this union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It names no contact the construction does not build.
   */
  export type InfusionStandContact = "grip" | "tip" | "hook";

  /**
   * Build a wheeled stand with a shaft grip, floor tip and bag hook.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a wheeled stand with a shaft grip, floor tip and bag hook.
   * @evidence contracts/development/implementation.md#principled-implementation Lay out five caster legs and the telescoping tubes. Distribute the measured base mass over the legs and casters by volume.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original measured widths, radii, mass and local tube or hook contacts.
   * @evidence contracts/development/implementation.md#efficient-algorithms Twelve solids and three contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function infusionStand(
    params: Omit<createMobilityAid.IParams, "kind">,
    seed?: number | string,
  ): Archetype<InfusionStandContact, createMobilityAid.Dimension> {
    const { builder, d }: ReturnType<typeof draw<InfusionStandContact>> =
      draw<InfusionStandContact>("infusionStand", params, seed);
    const height: number = d.height!;
    const r: number = d.diameter! / 2;
    // Five legs on castors, the outer tube up from the hub, the inner tube on to the height.
    const stand: typeof createMobilityAid.STAND = createMobilityAid.STAND;
    const reach: number = d.width! / 2 - stand.castor / 2;
    const leg: number = stand.leg / 2;
    const hub: number = stand.castor + leg;
    const outer: number = hub + stand.outer;
    const legVolume: number = Math.PI * leg ** 2 * reach;
    const castorVolume: number = (4 / 3) * Math.PI * (stand.castor / 2) ** 3;
    const outerVolume: number = Math.PI * r ** 2 * stand.outer;
    const innerVolume: number =
      Math.PI * (stand.inner / 2) ** 2 * (height - outer);
    const base: number = stand.base / d.mass!;
    const perBase: number = base / (stand.legs * (legVolume + castorVolume));
    const perTube: number = (1 - base) / (outerVolume + innerVolume);
    for (let k: number = 0; k < stand.legs; ++k) {
      const angle: number = (2 * Math.PI * k) / stand.legs;
      const out: ReturnType<typeof v> = v(Math.sin(angle), 0, Math.cos(angle));
      builder.rod(
        `leg${k}`,
        leg,
        v(0, hub, 0),
        v(out.x * reach, hub, out.z * reach),
        { color: metal, share: perBase * legVolume },
      );
      builder.ball(
        `castor${k}`,
        stand.castor / 2,
        v(out.x * reach, stand.castor / 2, out.z * reach),
        { color: "#2c2f33", share: perBase * castorVolume },
      );
    }
    builder.rod("outerTube", r, v(0, hub, 0), v(0, outer, 0), {
      color: metal,
      share: perTube * outerVolume,
    });
    builder.rod("innerTube", stand.inner / 2, v(0, outer, 0), v(0, height, 0), {
      color: metal,
      share: perTube * innerVolume,
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(0, (hub + outer) / 2, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * r,
      length: stand.outer,
    });
    builder.affordance({
      id: "hook",
      kind: "hook",
      frame: ArchetypeFrame.upright(v(0, height, 0)),
      extent: null,
    });

    tip(builder);
    return builder.build(d.mass!);
  }
}
