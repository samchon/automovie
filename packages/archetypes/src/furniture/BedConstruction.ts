import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "../core";
import { CareBedConstruction } from "./CareBedConstruction";
import { MATTRESS_SIZES } from "./MATTRESS_SIZES";
import { createBed } from "./createBed";

/** The model-space construction for the selected contact IDs. */
type Builder<Id extends createBed.Affordance> = ArchetypeBuilder<
  Id,
  createBed.Dimension
>;

/** Model dimensions in the legacy family's recorded units. */
type Dimensions = Partial<Record<createBed.Dimension, number>>;

/** A started construction: its builder and its drawn dimensions. */
interface IDrawn<Id extends createBed.Affordance> {
  /** The model-space builder for the selected contact ids. */
  builder: Builder<Id>;

  /** The drawn and fixed dimensions in the family's recorded units. */
  d: Dimensions;
}

/** Select the existing size, then draw the remaining dimensions in the saved stream. */
function draw<Id extends createBed.Affordance>(
  kind: createBed.Kind,
  params: Omit<createBed.IParams, "kind">,
  seed?: number | string,
): IDrawn<Id> {
  const session: ArchetypeDrawSession<createBed.Dimension> =
    new ArchetypeDrawSession<createBed.Dimension>(
      "bed",
      createBed.UNITS,
      seed,
      params,
    );
  const size: Readonly<Partial<Record<createBed.Dimension, number>>> =
    session.model<createBed.Mattress>(
      "size",
      params.size,
      MATTRESS_SIZES[kind],
    ).figures;
  const d: Partial<Record<createBed.Dimension, number>> = {
    ...session.dimensions(createBed.BANDS[kind], createBed.BANDS),
    ...size,
  };
  const builder: Builder<Id> = new ArchetypeBuilder({
    material: "composite",
    id: params.id,
    name:
      kind === "mattress"
        ? "mattress"
        : kind === "gurney"
          ? "stretcher"
          : `${kind} bed`,
    draw: session,
  });
  return { builder, d };
}

/**
 * Bed and stretcher constructions sharing measured sizing and rest dimensions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Bed and stretcher constructions sharing measured sizing and rest dimensions.
 * @evidence contracts/development/design.md#principled-representation Each construction applies the selected variant's coordinate frame and dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the named producers and the legacy selector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape dispatch is shared between unrelated mechanisms.
 */
export namespace BedConstruction {
  /**
   * The values {@link platform} accepts at this place in its signature.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the admitted values of one place in the signature of platform.
   * @evidence contracts/development/design.md#principled-representation A closed union of the literal values the construction handles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only platform and its callers read this union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It admits no value the construction does not handle.
   */
  export type PlatformKind = "single" | "double" | "mattress";

  /**
   * The contact ids {@link platform} builds or reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids in the signature of platform.
   * @evidence contracts/development/design.md#principled-representation A closed union of the literal contact ids the construction builds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only platform and the named producers that call it read this union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It names no contact the construction does not build.
   */
  export type PlatformContact = "surface" | "leftSide" | "rightSide";

  /**
   * Build a household bed or a mattress laid on the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a household bed or a mattress laid on the floor.
   * @evidence contracts/development/implementation.md#principled-implementation Use the widths and lengths of the admitted options. Lay the sleep surface and side seats on the mattress boundaries.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The standalone mattress has no base or headboard. Beds use the same preserved authored proportions.
   * @evidence contracts/development/implementation.md#efficient-algorithms One to three boxes and three contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function platform(
    kind: PlatformKind,
    params: Omit<createBed.IParams, "kind">,
    seed?: number | string,
  ): Archetype<PlatformContact, createBed.Dimension> {
    const { builder, d }: ReturnType<typeof draw<PlatformContact>> =
      draw<PlatformContact>(kind, params, seed);
    const width: number = d.width!;
    const length: number = d.length!;
    const thick: number = d.thickness!;
    const height: number = d.height ?? thick;
    builder.box(
      "mattress",
      Vector3.create(width, thick, length),
      Vector3.create(0, height - thick / 2, 0),
      { color: "#e7e3da", density: 0.3 },
    );
    if (kind !== "mattress") {
      builder.box(
        "base",
        Vector3.create(width, height - thick, length),
        Vector3.create(0, (height - thick) / 2, 0),
        { color: "#8a6a4a", density: 0.3 },
      );
      builder.box(
        "headboard",
        Vector3.create(width, height + 0.4, 0.04),
        Vector3.create(0, (height + 0.4) / 2, -length / 2 - 0.02),
        { color: "#8a6a4a" },
      );
    }
    builder.affordance({
      id: "surface",
      kind: "surface",
      frame: ArchetypeFrame.upright(Vector3.create(0, height, 0)),
      extent: null,
      width,
      depth: length,
    });
    for (const [id, sign] of [
      ["leftSide", 1],
      ["rightSide", -1],
    ] as const)
      builder.affordance({
        id,
        kind: "seat",
        frame: ArchetypeFrame.facing(
          Vector3.create((sign * width) / 2, height, 0),
          Vector3.create(0, 1, 0),
          Vector3.create(0, 0, -sign),
        ),
        extent: null,
        width: length,
        depth: width / 2,
      });
    return builder.build(d.mass!);
  }

  /**
   * The contact ids {@link hospital} builds or reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids in the signature of hospital.
   * @evidence contracts/development/design.md#principled-representation A closed union of the literal contact ids the construction builds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only hospital and the named producers that call it read this union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It names no contact the construction does not build.
   */
  export type HospitalContact =
    | "surface"
    | "leftSide"
    | "rightSide"
    | "leftRail"
    | "rightRail";

  /**
   * Build a wheeled hospital bed with its patient surface, side seats, and siderails.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a wheeled hospital bed with its patient surface, side seats, and siderails.
   * @evidence contracts/development/implementation.md#principled-implementation Place the litter, mattress and bars at their admitted heights. The caster wheels carry the base.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the existing flat patient surface and documented bands.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eight solids and five contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function hospital(
    params: Omit<createBed.IParams, "kind">,
    seed?: number | string,
  ): Archetype<HospitalContact, createBed.Dimension> {
    const { builder, d }: ReturnType<typeof draw<HospitalContact>> =
      draw<HospitalContact>("hospital", params, seed);
    CareBedConstruction.hospital(builder, d);
    return builder.build(d.mass!);
  }

  /**
   * The contact ids {@link gurney} builds or reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids in the signature of gurney.
   * @evidence contracts/development/design.md#principled-representation A closed union of the literal contact ids the construction builds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only gurney and the named producers that call it read this union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It names no contact the construction does not build.
   */
  export type GurneyContact = "surface" | "leftSide" | "rightSide";

  /**
   * Build a stretcher on casters with a supported patient surface.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a stretcher on casters with a supported patient surface.
   * @evidence contracts/development/implementation.md#principled-implementation Place the litter top at its admitted height and the side seats at the mattress edges.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the existing measured patient support geometry and cascaded heights.
   * @evidence contracts/development/implementation.md#efficient-algorithms The fixed caster, litter and pad assembly.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function gurney(
    params: Omit<createBed.IParams, "kind">,
    seed?: number | string,
  ): Archetype<GurneyContact, createBed.Dimension> {
    const { builder, d }: ReturnType<typeof draw<GurneyContact>> =
      draw<GurneyContact>("gurney", params, seed);
    CareBedConstruction.gurney(builder, d);
    return builder.build(d.mass!);
  }

  /**
   * The contact ids {@link crib} builds or reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids in the signature of crib.
   * @evidence contracts/development/design.md#principled-representation A closed union of the literal contact ids the construction builds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only crib and the named producers that call it read this union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It names no contact the construction does not build.
   */
  export type CribContact = "surface" | "leftRail" | "rightRail";

  /**
   * Build a crib with a mattress and graspable top rails.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a crib with a mattress and graspable top rails.
   * @evidence contracts/development/implementation.md#principled-implementation Spans divide the interior into a series of individually modeled slats up to the rails.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the measured crib dimensions and original slat spacing rule.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work follows the number of slats required along the four rails.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function crib(
    params: Omit<createBed.IParams, "kind">,
    seed?: number | string,
  ): Archetype<CribContact, createBed.Dimension> {
    const { builder, d }: ReturnType<typeof draw<CribContact>> =
      draw<CribContact>("crib", params, seed);
    CareBedConstruction.crib(builder, d);
    return builder.build(d.mass!);
  }

  /**
   * The contact ids {@link bunk} builds or reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids in the signature of bunk.
   * @evidence contracts/development/design.md#principled-representation A closed union of the literal contact ids the construction builds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only bunk and the named producers that call it read this union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It names no contact the construction does not build.
   */
  export type BunkContact =
    | "surface"
    | "leftSide"
    | "rightSide"
    | "upper"
    | "guard";

  /**
   * Build a bunk bed with two sleep surfaces and a graspable guard rail.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a bunk bed with two sleep surfaces and a graspable guard rail.
   * @evidence contracts/development/implementation.md#principled-implementation Pine posts support two mattresses. The lower mattress exposes side seats and the upper mattress has a rail.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the documented pine contact pair and existing fitted mattress sizes.
   * @evidence contracts/development/implementation.md#efficient-algorithms A constant number of supports, mattresses and rails.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function bunk(
    params: Omit<createBed.IParams, "kind">,
    seed?: number | string,
  ): Archetype<BunkContact, createBed.Dimension> {
    const { builder, d }: ReturnType<typeof draw<BunkContact>> =
      draw<BunkContact>("bunk", params, seed);
    CareBedConstruction.bunk(builder, d);
    return builder.build(d.mass!, { rests: "wood" });
  }
}
