import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The author chooses one of four padded screen silhouettes. */
const KINDS: readonly createStageWeaponProp.Kind[] = [
  "mace",
  "pike",
  "shuo",
  "halberd",
];

/** The size axis measures from the base plane to the uppermost visible part. */
const UNITS: Readonly<Record<createStageWeaponProp.Dimension, "m">> = {
  height: "m",
};

/** A shared set scale for staging families of different apparent heights. */
const HEIGHT: IArchetypeBand = ArchetypeBand.metres(
  0.55,
  2.4,
  "Authored digital stage prop scale.",
  true,
);

/** The standard display heights in metres. */
const DISPLAY_HEIGHTS: Readonly<Record<createStageWeaponProp.Kind, number>> = {
  mace: 0.7,
  pike: 1.95,
  shuo: 1.65,
  halberd: 1.55,
};

/**
 * A digital stage prop with a padded silhouette. The mace has a round
 * ornament, the pike a narrow upright capsule, the shuo a wider elongated
 * oval, and the halberd a side ornament. The model stands from the origin
 * along +Y. The round shaft's grip is approached from -Z.
 *
 * @param params The outline, scene id and optional overall display height in metres.
 * @param seed A seed for the builder's draw session.
 * @returns A foam model with a named grip for kinematic staging.
 * @throws {ArchetypeRefusal} When the outline or height is out of range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each outline, its rest axes, the grip approach and the size control.
 * @evidence contracts/development/implementation.md#principled-implementation Each silhouette builds padded forms above a common shaft, with top coordinates derived from the same display height. The grip sits on the shaft centreline.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the outline and size, lay out the shared shaft and chosen ornament, then register the grip.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses authored display shapes and a nominal body mass for the model record. No material contact or flight parameters are authored.
 * @evidence contracts/development/implementation.md#efficient-algorithms Creates at most three primitives and one affordance.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared builder records each primitive for both its model and geometry consumers.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each model owns its data and the producer retains no state.
 */
export function createStageWeaponProp(
  params: createStageWeaponProp.IParams,
  seed?: number | string,
): Archetype<
  createStageWeaponProp.Affordance,
  createStageWeaponProp.Dimension
> {
  const kind: createStageWeaponProp.Kind = ArchetypeDraw.choice(
    "stageWeaponProp",
    "kind",
    params.kind,
    KINDS,
  );
  const draw: ArchetypeDrawSession<createStageWeaponProp.Dimension> =
    new ArchetypeDrawSession("stageWeaponProp", UNITS, seed, {
      height: params.height ?? DISPLAY_HEIGHTS[kind],
    });
  const { height }: Record<createStageWeaponProp.Dimension, number> =
    draw.dimensions({ height: HEIGHT });
  const builder: ArchetypeBuilder<
    createStageWeaponProp.Affordance,
    createStageWeaponProp.Dimension
  > = new ArchetypeBuilder({
    draw,
    id: params.id,
    name: `padded ${kind} stage prop`,
    material: "foam",
  });
  const v: typeof Vector3.create = Vector3.create;
  const shaftRadius: number = Math.min(0.02, 0.03 * height);
  const shaftTop: number = 0.8 * height;
  builder.rod("shaft", shaftRadius, v(0, 0, 0), v(0, shaftTop, 0), {
    color: "#55516d",
  });

  if (kind === "mace") {
    const radius: number = 0.115 * height;
    builder.ball("ornament", radius, v(0, height - radius, 0), {
      color: "#968ccc",
    });
  } else {
    const radius: number = (kind === "shuo" ? 0.052 : 0.027) * height;
    const lower: number = (kind === "shuo" ? 0.68 : 0.78) * height;
    builder.rod("ornament", radius, v(0, lower, 0), v(0, height - radius, 0), {
      color: "#968ccc",
      round: true,
    });
    if (kind === "halberd")
      builder.rod(
        "sideOrnament",
        0.058 * height,
        v(0, 0.83 * height, 0),
        v(0.15 * height, 0.8 * height, 0),
        { color: "#bca6df", round: true },
      );
  }

  const gripLength: number = Math.min(0.14, 0.22 * height);
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      v(0, shaftTop / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * shaftRadius,
    length: gripLength,
  });
  return builder.build(0.2);
}

/**
 * Authoring controls and handle name for the stage silhouettes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the four forms, metre scale, and named hand site.
 * @evidence contracts/development/design.md#principled-representation The outline is a closed literal union with one scale parameter independent of scene identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Provides the named outline and display height used by the producer and the hold name used by the scene.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported outlines and inadmissible heights are refused by the shared draw owners.
 */
export namespace createStageWeaponProp {
  /**
   * The four authored display silhouettes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Lists the named outlines.
   * @evidence contracts/development/design.md#principled-representation Each literal selects an authored outline.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One discriminator covers the supported forms.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An untyped unknown literal is refused at entry.
   */
  export type Kind = "mace" | "pike" | "shuo" | "halberd";

  /**
   * The shaft handle used by a kinematically placed hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the hand site.
   * @evidence contracts/development/design.md#principled-representation The site names an actual round shaft handle.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One site suffices for the shared hand placement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The handle comes from the same shaft geometry used by the model.
   */
  export type Affordance = "grip";

  /**
   * The overall display height in metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the visual dimension and its unit.
   * @evidence contracts/development/design.md#principled-representation One overall scale sizes the normalized silhouette.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The record exposes the one visual size control.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both the scale and its unit use the shared draw record.
   */
  export type Dimension = "height";

  /**
   * Stage outline, optional scale override, and scene identity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes which fields name, scale and identify the display model.
   * @evidence contracts/development/design.md#principled-representation An explicit outline and optional overall height uniquely determine the stage geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The caller can choose the outline and scene scale independently of identity.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The producer validates the outline and height using the existing draw session.
   */
  export interface IParams {
    /** The padded outline. */
    kind: Kind;

    /** Scene-unique model id. */
    id?: string;

    /** Overall display height in metres. Defaults to the outline's display height. */
    height?: number;
  }
}
