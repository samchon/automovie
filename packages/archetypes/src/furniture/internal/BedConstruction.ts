import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core";
import { CareBedConstruction } from "./CareBedConstruction";
import { MATTRESS_SIZES } from "../constants/MATTRESS_SIZES";
import { AutoMovieArchetypeBed } from "../AutoMovieArchetypeBed";

/*
 * Bed and stretcher constructions sharing measured sizing and rest dimensions.
 */
export namespace BedConstruction {
  /*
   * The values platform accepts at this place in its signature.
   */
  export type PlatformKind = "single" | "double" | "mattress";

  /*
   * The contact ids platform builds or reads.
   */
  export type PlatformContact = "surface" | "leftSide" | "rightSide";

  /*
   * Build a household bed or a mattress laid on the floor.
   */
  export function platform(
    kind: PlatformKind,
    params: Omit<AutoMovieArchetypeBed.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<PlatformContact, AutoMovieArchetypeBed.Dimension> {
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
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, height, 0)),
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
        frame: AutoMovieArchetypeFrame.facing(
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

  /*
   * The contact ids hospital builds or reads.
   */
  export type HospitalContact =
    | "surface"
    | "leftSide"
    | "rightSide"
    | "leftRail"
    | "rightRail";

  /*
   * Build a wheeled hospital bed with its patient surface, side seats, and
   * siderails.
   */
  export function hospital(
    params: Omit<AutoMovieArchetypeBed.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<HospitalContact, AutoMovieArchetypeBed.Dimension> {
    const { builder, d }: ReturnType<typeof draw<HospitalContact>> =
      draw<HospitalContact>("hospital", params, seed);
    CareBedConstruction.hospital(builder, d);
    return builder.build(d.mass!);
  }

  /*
   * The contact ids gurney builds or reads.
   */
  export type GurneyContact = "surface" | "leftSide" | "rightSide";

  /*
   * Build a stretcher on casters with a supported patient surface.
   */
  export function gurney(
    params: Omit<AutoMovieArchetypeBed.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<GurneyContact, AutoMovieArchetypeBed.Dimension> {
    const { builder, d }: ReturnType<typeof draw<GurneyContact>> =
      draw<GurneyContact>("gurney", params, seed);
    CareBedConstruction.gurney(builder, d);
    return builder.build(d.mass!);
  }

  /*
   * The contact ids crib builds or reads.
   */
  export type CribContact = "surface" | "leftRail" | "rightRail";

  /*
   * Build a crib with a mattress and graspable top rails.
   */
  export function crib(
    params: Omit<AutoMovieArchetypeBed.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<CribContact, AutoMovieArchetypeBed.Dimension> {
    const { builder, d }: ReturnType<typeof draw<CribContact>> =
      draw<CribContact>("crib", params, seed);
    CareBedConstruction.crib(builder, d);
    return builder.build(d.mass!);
  }

  /*
   * The contact ids bunk builds or reads.
   */
  export type BunkContact =
    | "surface"
    | "leftSide"
    | "rightSide"
    | "upper"
    | "guard";

  /*
   * Build a bunk bed with two sleep surfaces and a graspable guard rail.
   */
  export function bunk(
    params: Omit<AutoMovieArchetypeBed.IParams, "kind">,
    seed?: number,
  ): AutoMovieArchetype<BunkContact, AutoMovieArchetypeBed.Dimension> {
    const { builder, d }: ReturnType<typeof draw<BunkContact>> =
      draw<BunkContact>("bunk", params, seed);
    CareBedConstruction.bunk(builder, d);
    return builder.build(d.mass!, { rests: "wood" });
  }
}

/*
 * The model-space construction for the selected contact IDs.
 */
type Builder<Id extends AutoMovieArchetypeBed.Affordance> = AutoMovieArchetypeBuilder<
  Id,
  AutoMovieArchetypeBed.Dimension
>;

/*
 * Model dimensions in the legacy family's recorded units.
 */
type Dimensions = Partial<Record<AutoMovieArchetypeBed.Dimension, number>>;

/*
 * A started construction: its builder and its drawn dimensions.
 */
interface IDrawn<Id extends AutoMovieArchetypeBed.Affordance> {
  /*
   * The model-space builder for the selected contact ids.
   */
  builder: Builder<Id>;

  /*
   * The drawn and fixed dimensions in the family's recorded units.
   */
  d: Dimensions;
}

/*
 * Select the existing size, then draw the remaining dimensions in the saved
 * stream.
 */
function draw<Id extends AutoMovieArchetypeBed.Affordance>(
  kind: AutoMovieArchetypeBed.Kind,
  params: Omit<AutoMovieArchetypeBed.IParams, "kind">,
  seed?: number,
): IDrawn<Id> {
  const session: AutoMovieArchetypeDrawSession<AutoMovieArchetypeBed.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeBed.Dimension>(
      "bed",
      AutoMovieArchetypeBed.UNITS,
      seed,
      params,
    );
  const size: Readonly<Partial<Record<AutoMovieArchetypeBed.Dimension, number>>> =
    session.model<AutoMovieArchetypeBed.Mattress>(
      "size",
      params.size,
      MATTRESS_SIZES[kind],
    ).figures;
  const d: Partial<Record<AutoMovieArchetypeBed.Dimension, number>> = {
    ...session.dimensions(AutoMovieArchetypeBed.BANDS[kind], AutoMovieArchetypeBed.BANDS),
    ...size,
  };
  const builder: Builder<Id> = new AutoMovieArchetypeBuilder({
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
