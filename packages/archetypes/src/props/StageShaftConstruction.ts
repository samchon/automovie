import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { createStageWeaponProp } from "./createStageWeaponProp";

/** The size axis measures from the base plane to the uppermost visible part. */
const UNITS: Readonly<Record<createStageWeaponProp.Dimension, "m">> = {
  height: "m",
};

/** A shared set scale for staging families of different apparent heights. */
const HEIGHT: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
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
  longBlade: 1.75,
  crescentBlade: 1.85,
  sideBlade: 1.7,
  serpentBlade: 1.8,
  offsetHammer: 0.85,
  linked: 0.95,
};

/**
 * Build a padded stage form around its hand-held base.
 *
 * A display height sets the base shape, while the supplied decoration records the visible silhouette and its additional marks.
 *
 * @param kind Catalogue silhouette label.
 * @param shaftRatio Fraction of display height occupied by the shaft.
 * @param decorate Adds the selected silhouette's parts and contacts.
 * @param params An optional scene id and height in metres.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the digital base shape and the geometry builder contract.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the historical stage draw, shared grip and shaft, and a form-specific added shape.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the base, runs the decoration once, then registers the common grip.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function StageShaftConstruction(
  kind: createStageWeaponProp.Kind,
  params: Omit<createStageWeaponProp.IParams, "kind">,
  seed: number | string | undefined,
  shaftRatio: number,
  decorate: StageShaftConstruction.Decorate,
): AutoMovieArchetype<
  createStageWeaponProp.Affordance,
  createStageWeaponProp.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<createStageWeaponProp.Dimension> =
    new AutoMovieArchetypeDrawSession("stageWeaponProp", UNITS, seed, {
      height: params.height,
    });
  // The chosen silhouette fixes its display height unless the scene supplies one.
  const height: number =
    params.height === undefined
      ? draw.derive("height", DISPLAY_HEIGHTS[kind])
      : draw.dimensions({ height: HEIGHT }).height;
  const builder: AutoMovieArchetypeBuilder<
    createStageWeaponProp.Affordance,
    createStageWeaponProp.Dimension
  > = new AutoMovieArchetypeBuilder({
    draw,
    id: params.id,
    name: `padded ${kind} stage prop`,
    material: "foam",
  });
  const v: typeof Vector3.create = Vector3.create;
  const shaftRadius: number = Math.min(0.02, 0.03 * height);
  const shaftTop: number = shaftRatio * height;
  builder.rod("shaft", shaftRadius, v(0, 0, 0), v(0, shaftTop, 0), {
    color: "#55516d",
  });

  decorate(builder, height, shaftTop, shaftRadius);

  const gripLength: number = Math.min(0.14, 0.22 * height);
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
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
 * The base dimensions offered to the owning silhouette builder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the model and its visible display dimensions.
 * @evidence contracts/development/design.md#principled-representation The three distances are metres in the stage form’s origin and axes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the dimensions required to place the top silhouette are available.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The geometry builder receives the computed shaft dimensions.
 */
export namespace StageShaftConstruction {
  /** Builder for named digital stage silhouette contacts. */
  export type Builder = AutoMovieArchetypeBuilder<
    createStageWeaponProp.Affordance,
    createStageWeaponProp.Dimension
  >;

  /** One form adds its visible top and optional contacts to the drawn shaft. */
  export type Decorate = (
    builder: Builder,
    height: number,
    shaftTop: number,
    shaftRadius: number,
  ) => void;
}
