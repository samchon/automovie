import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "../core";

/** Authored internal coarse footwear sizes in metres. */
const BANDS = {
  length: ArchetypeBand.metres(
    0.21,
    0.36,
    "Clear length of the coarse footwear proxy",
    true,
  ),
  width: ArchetypeBand.metres(
    0.1,
    0.17,
    "Clear standing foot opening of the coarse proxy",
    true,
  ),
  height: ArchetypeBand.metres(
    0.035,
    0.085,
    "Coarse footwear wall height above the sole",
    true,
  ),
};

/** The coarse shoe and the thinner soft-looking sock are the same geometric family. */
const PROFILES: Readonly<
  Record<
    createStageFootwear.Kind,
    { thickness: number; tint: string; mass: number }
  >
> = {
  shoe: { thickness: 0.012, tint: "#375d88", mass: 0.24 },
  sock: { thickness: 0.004, tint: "#a4645c", mass: 0.04 },
};

/**
 * An open-footwear stage prop with an actual clear upper cavity.
 *
 * The model sits on its sole, with +Z toward the toe. It has an independent
 * rear pull grip, a rectangular foot opening and a heel seat inside the sole.
 *
 * @param params The form, model identity, and any fixed clearance in metres.
 * @param seed Selects dimensions left unbound by the author.
 * @returns The shaped footwear and its three actor-facing contacts.
 * @throws {ArchetypeRefusal} For an unavailable form or an out-of-band size.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States form, clear opening, toe axis and heel support.
 * @evidence contracts/development/implementation.md#principled-implementation Separate walls establish a genuine hollow footprint with a sole; the rear grip and heel seat use the same measured part dimensions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the profile and sizes, then build the shell and named contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The foot opening is bounded by actual walls rather than a filled stand-in. The sock is a coarse prop shape.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a fixed set of parts and contact records.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both forms use their shared cavity and attachment contract.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a complete model and retains no inputs.
 */
export function createStageFootwear(
  params: createStageFootwear.IParams,
  seed?: number | string,
): Archetype<createStageFootwear.Affordance, createStageFootwear.Dimension> {
  const kind: createStageFootwear.Kind = ArchetypeDraw.choice(
    "stageFootwear",
    "kind",
    params.kind,
    createStageFootwear.KINDS,
  );
  const draw: ArchetypeDrawSession<createStageFootwear.Dimension> =
    new ArchetypeDrawSession(
      "stageFootwear",
      { length: "m", width: "m", height: "m" },
      seed,
      params,
    );
  const {
    length,
    width,
    height,
  }: Record<createStageFootwear.Dimension, number> = draw.dimensions(BANDS);
  const profile: (typeof PROFILES)[createStageFootwear.Kind] = PROFILES[kind];
  const wall: number = profile.thickness;
  const half: number = length / 2;
  const v: typeof Vector3.create = Vector3.create;
  const builder: ArchetypeBuilder<
    createStageFootwear.Affordance,
    createStageFootwear.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: kind === "shoe" ? "stage slip-on shoe" : "stage ankle sock",
    material: "composite",
    draw,
  });
  const outerWidth: number = width + 2 * wall;
  const outerLength: number = length + 2 * wall;
  const color: { color: string } = { color: profile.tint };
  const center: number = wall + height / 2;
  builder.box(
    "sole",
    v(outerWidth, wall, outerLength),
    v(0, wall / 2, 0),
    color,
  );
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const)
    builder.box(
      side + "-upper",
      v(wall, height, outerLength),
      v((sign * (width + wall)) / 2, center, 0),
      color,
    );
  for (const [side, sign] of [
    ["toe", 1],
    ["heel", -1],
  ] as const)
    builder.box(
      side,
      v(width, height, wall),
      v(0, center, sign * (half + wall / 2)),
      color,
    );
  const pullY: number = wall + height + 0.07;
  const pullZ: number = -half - wall - 0.017;
  for (const [name, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const)
    builder.rod(
      name + "-pull-stay",
      0.006,
      v(sign * 0.03, center, -half - wall / 2),
      v(sign * 0.03, pullY, pullZ),
      color,
    );
  builder.rod("pull", 0.013, v(-0.03, pullY, pullZ), v(0.03, pullY, pullZ), {
    color: "#eaaf54",
  });
  builder.affordance({
    id: "hold",
    kind: "handle",
    frame: ArchetypeFrame.facing(v(0, pullY, pullZ), v(0, 0, -1), v(1, 0, 0)),
    extent: null,
    grip: "power",
    symmetry: "round",
    aperture: 0.026,
    length: 0.06,
  });
  builder.affordance({
    id: "opening",
    kind: "aperture",
    frame: ArchetypeFrame.facing(
      v(0, wall + height, half),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    width,
    height: length,
    extent: null,
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: ArchetypeFrame.upright(v(0, wall, -half + 0.015)),
    extent: null,
  });
  return builder.build(profile.mass);
}

/**
 * Supported footwear profiles, their contacts and authorable dimensions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the stage profiles, clearance parameters and attachment points.
 * @evidence contracts/development/design.md#principled-representation The closed union keeps each digital profile and each contact identifiable.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two forms reuse the same opening and contact geometry with separate wall and mass constants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The model's dimensions describe coarse clearances, independently of Human geometry.
 */
export namespace createStageFootwear {
  /** The fixed profile identifiers. */
  export const KINDS = ["shoe", "sock"] as const;

  /** The selected coarse footwear form. */
  export type Kind = (typeof KINDS)[number];

  /** The rear pull, open top and heel wear seat. */
  export type Affordance = "hold" | "opening" | "wear";

  /** Metres of cavity length, width and height. */
  export type Dimension = keyof typeof BANDS;

  /** Input constraints and optional model identity. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The shape rendered by the scene. */
    kind: Kind;
    /** A stable scene identity. */
    id?: string;
  }
}
