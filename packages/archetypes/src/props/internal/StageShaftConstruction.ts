import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeStageWeaponProp } from "../AutoMovieArchetypeStageWeaponProp";

/*
 * Build a padded stage form around its hand-held base.
 *
 * A display height sets the base shape, while the supplied decoration records
 * the visible silhouette and its additional marks.
 * Parameter kind: Catalogue silhouette label.
 * Parameter shaftRatio: Fraction of display height occupied by the shaft.
 * Parameter decorate: Adds the selected silhouette's parts and contacts.
 * Parameter params: An optional scene id and height in metres.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function StageShaftConstruction(
  kind: AutoMovieArchetypeStageWeaponProp.Kind,
  params: Omit<AutoMovieArchetypeStageWeaponProp.IParams, "kind">,
  seed: number | undefined,
  shaftRatio: number,
  decorate: StageShaftConstruction.Decorate,
): AutoMovieArchetype<
  AutoMovieArchetypeStageWeaponProp.Affordance,
  AutoMovieArchetypeStageWeaponProp.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeStageWeaponProp.Dimension> =
    new AutoMovieArchetypeDrawSession("stageWeaponProp", UNITS, seed, {
      height: params.height,
    });
  // The chosen silhouette fixes its display height unless the scene supplies one.
  const height: number =
    params.height === undefined
      ? draw.derive("height", DISPLAY_HEIGHTS[kind])
      : draw.dimensions({ height: HEIGHT }).height;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeStageWeaponProp.Affordance,
    AutoMovieArchetypeStageWeaponProp.Dimension
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

/*
 * The base dimensions offered to the owning silhouette builder.
 */
export namespace StageShaftConstruction {
  /*
   * Builder for named digital stage silhouette contacts.
   */
  export type Builder = AutoMovieArchetypeBuilder<
    AutoMovieArchetypeStageWeaponProp.Affordance,
    AutoMovieArchetypeStageWeaponProp.Dimension
  >;

  /*
   * One form adds its visible top and optional contacts to the drawn shaft.
   */
  export type Decorate = (
    builder: Builder,
    height: number,
    shaftTop: number,
    shaftRadius: number,
  ) => void;
}

/*
 * The size axis measures from the base plane to the uppermost visible part.
 */
const UNITS: Readonly<Record<AutoMovieArchetypeStageWeaponProp.Dimension, "m">> = {
  height: "m",
};

/*
 * A shared set scale for staging families of different apparent heights.
 */
const HEIGHT: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
  0.55,
  2.4,
  "Authored digital stage prop scale.",
  true,
);

/*
 * The standard display heights in metres.
 */
const DISPLAY_HEIGHTS: Readonly<Record<AutoMovieArchetypeStageWeaponProp.Kind, number>> = {
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
