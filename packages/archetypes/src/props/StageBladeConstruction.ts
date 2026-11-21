import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";
import type { createStageBladeProp } from "./createStageBladeProp";

/** Overall display length is measured along the prop's long axis. */
const UNITS: Readonly<Record<createStageBladeProp.Dimension, "m">> = {
  length: "m",
};

/** Admitted digital display lengths. */
const LENGTH: IArchetypeBand = ArchetypeBand.metres(
  0.55,
  1.45,
  "Authored digital display scale for padded blade props.",
  true,
);

/**
 * Each display profile gives its default length in metres, and the relative
 * locations and sizes of its visual features. They are authored silhouettes.
 */
const PROFILES = {
  foil: {
    length: 0.95,
    grip: 0.17,
    shaft: 0.011,
    guard: 0.046,
    color: "#c1b1e8",
  },
  epee: {
    length: 1.02,
    grip: 0.17,
    shaft: 0.017,
    guard: 0.073,
    color: "#acd3ea",
  },
  sabre: {
    length: 0.96,
    grip: 0.17,
    shaft: 0.018,
    guard: 0.058,
    color: "#edbf9b",
  },
  shinai: {
    length: 1.16,
    grip: 0.26,
    shaft: 0.021,
    guard: 0.047,
    color: "#d6ae73",
  },
  longsword: {
    length: 1.16,
    grip: 0.24,
    shaft: 0.029,
    guard: 0.082,
    color: "#b9b3ce",
  },
} as const satisfies Record<
  createStageBladeProp.Kind,
  {
    length: number;
    grip: number;
    shaft: number;
    guard: number;
    color: string;
  }
>;

/**
 * Build a padded hand-held silhouette.
 *
 * The common digital profile has a grip, capped shaft and optional form-specific guard detail.
 *
 * @param kind The selected stored profile label.
 * @param twoHand Whether the contact admits an authored two-hand pose.
 * @param decorate Places any guard and profile-dependent details.
 * @param params The scene identifier and display length in metres.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes its shared digital parts and the guard ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the named display length and shaft coordinates. The selected producer owns the decoration and grip type.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds three common parts, calls the guard builder and adds one hand contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function StageBladeConstruction(
  kind: createStageBladeProp.Kind,
  params: Omit<createStageBladeProp.IParams, "kind">,
  seed: number | string | undefined,
  twoHand: boolean,
  decorate: StageBladeConstruction.Decorate,
): Archetype<createStageBladeProp.Affordance, createStageBladeProp.Dimension> {
  const profile: (typeof PROFILES)[createStageBladeProp.Kind] = PROFILES[kind];
  const draw: ArchetypeDrawSession<createStageBladeProp.Dimension> =
    new ArchetypeDrawSession("stageBladeProp", UNITS, seed, {
      length: params.length,
    });
  const length: number =
    params.length === undefined
      ? draw.derive("length", profile.length)
      : draw.dimensions({ length: LENGTH }).length;
  const builder: ArchetypeBuilder<
    createStageBladeProp.Affordance,
    createStageBladeProp.Dimension
  > = new ArchetypeBuilder({
    draw,
    id: params.id,
    name: `padded ${kind} stage prop`,
    material: "foam",
  });
  const v: typeof Vector3.create = Vector3.create;
  const gripLength: number = profile.grip * length;
  const gripRadius: number = Math.min(0.016, 0.021 * length);
  const shaftRadius: number = profile.shaft * length;
  const guardRadius: number = profile.guard * length;
  const capRadius: number = Math.max(shaftRadius, 0.019 * length);
  const capY: number = length - capRadius;
  const guardDepth: number = 0.024 * length;

  builder.rod("grip", gripRadius, v(0, 0, 0), v(0, gripLength, 0), {
    color: "#45465e",
  });
  builder.rod("shaft", shaftRadius, v(0, gripLength, 0), v(0, capY, 0), {
    color: profile.color,
  });
  builder.ball("endCap", capRadius, v(0, capY, 0), { color: "#fff0b2" });

  decorate(builder, {
    length,
    gripLength,
    guardRadius,
    guardDepth,
    shaftRadius,
  });

  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      v(0, gripLength / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: twoHand ? "two-hand" : "power",
    aperture: 2 * gripRadius,
    length: gripLength,
  });
  return builder.build(0.2);
}

/**
 * Shared display measurements and guard geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each project-owned display measurement in metres.
 * @evidence contracts/development/design.md#principled-representation Keeps guard parameters in the same model frame as the grip and shaft.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The decoration callback receives the builder and the existing dimensions used by the guard and binding.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the actual dimensions already used by the visible shaft.
 */
export namespace StageBladeConstruction {
  /** Model-space locations and sizes for a form’s additional geometry. */
  export interface IProfile {
    /** The total display length, in metres. */
    length: number;
    /** The guard’s position along the handle from the origin in metres. */
    gripLength: number;
    /** The guard’s outer radius in metres. */
    guardRadius: number;
    /** The guard’s depth in metres along +Y. */
    guardDepth: number;
    /** The radius of the visible shaft in metres. */
    shaftRadius: number;
  }

  /** The builder and measurements of the chosen display prop. */
  export type Decorate = (
    builder: ArchetypeBuilder<
      createStageBladeProp.Affordance,
      createStageBladeProp.Dimension
    >,
    profile: IProfile,
  ) => void;

  /** Add the cylindrical guard used by fencing and practice silhouettes. */
  export function roundGuard(
    builder: Parameters<Decorate>[0],
    profile: IProfile,
  ): void {
    const { gripLength, guardRadius, guardDepth }: IProfile = profile;
    const v: typeof Vector3.create = Vector3.create;
    builder.rod(
      "guard",
      guardRadius,
      v(0, gripLength, 0),
      v(0, gripLength + guardDepth, 0),
      { color: "#6f6687" },
    );
  }
}
