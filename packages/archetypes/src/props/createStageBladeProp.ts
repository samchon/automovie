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
} as const satisfies Record<createStageBladeProp.Kind, {
  length: number;
  grip: number;
  shaft: number;
  guard: number;
  color: string;
}>;

/**
 * A digital padded blade silhouette for sport or theatrical staging.
 * The handle starts at the origin and the broad rounded end points along
 * +Y. The color bands identify the visual ends of the inert shaft.
 *
 * @param params The silhouette, scene id, and optional overall length in metres.
 * @param seed The optional draw seed.
 * @returns The padded model and its named grip, approached from -Z.
 * @throws {ArchetypeRefusal} When the silhouette or length is inadmissible.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the visual frame, size and handle, and names the two admission failures.
 * @evidence contracts/development/implementation.md#principled-implementation The profile scales the padded shaft, guard, caps and handle in one frame. The handle on the shaft axis has an explicit approach and a length spanning its usable area.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the size, place common parts, add the silhouette-specific guard, then declare the grip.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Profiles are display choices. There are no flight, cutting or damage parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each admitted model creates a fixed number of primitives and one affordance.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The builder records the same padded surfaces for display and geometry queries.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The result owns its generated data and the producer retains no per-model state.
 */
export function createStageBladeProp(
  params: createStageBladeProp.IParams,
  seed?: number | string,
): Archetype<createStageBladeProp.Affordance, createStageBladeProp.Dimension> {
  const kind: createStageBladeProp.Kind = ArchetypeDraw.choice(
    "stageBladeProp",
    "kind",
    params.kind,
    createStageBladeProp.KINDS,
  );
  const profile: (typeof PROFILES)[createStageBladeProp.Kind] = PROFILES[kind];
  const draw: ArchetypeDrawSession<createStageBladeProp.Dimension> =
    new ArchetypeDrawSession("stageBladeProp", UNITS, seed, {
      length: params.length,
    });
  const length: number = params.length === undefined
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
  const twoHand: boolean = kind === "shinai" || kind === "longsword";

  builder.rod("grip", gripRadius, v(0, 0, 0), v(0, gripLength, 0), {
    color: "#45465e",
  });
  builder.rod("shaft", shaftRadius, v(0, gripLength, 0), v(0, capY, 0), {
    color: profile.color,
  });
  builder.ball("endCap", capRadius, v(0, capY, 0), { color: "#fff0b2" });

  if (kind === "longsword") {
    builder.rod(
      "guard",
      guardDepth,
      v(-guardRadius, gripLength, 0),
      v(guardRadius, gripLength, 0),
      { color: "#6f6687", round: true },
    );
  } else {
    builder.rod(
      "guard",
      guardRadius,
      v(0, gripLength, 0),
      v(0, gripLength + guardDepth, 0),
      { color: "#6f6687" },
    );
  }
  if (kind === "sabre") {
    builder.rod(
      "guardBow",
      guardDepth,
      v(guardRadius * 0.82, gripLength, 0),
      v(guardRadius * 0.45, guardDepth, 0),
      { color: "#6f6687", round: true },
    );
  }
  if (kind === "shinai") {
    builder.rod(
      "binding",
      shaftRadius + 0.003,
      v(0, 0.74 * length, 0),
      v(0, 0.77 * length, 0),
      { color: "#fff0b2" },
    );
  }

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
 * Authoring controls for the padded blade silhouette.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the five forms, metre scale and named grip.
 * @evidence contracts/development/design.md#principled-representation A closed silhouette union uses a single scale independent of scene identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the chosen form, its length and the common hold name.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The shared draw session rejects inadmissible values. The form contains no material or striking properties.
 */
export namespace createStageBladeProp {
  /** Ordered silhouette names in the digital prop catalogue. */
  export const KINDS = ["foil", "epee", "sabre", "shinai", "longsword"] as const;

  /**
   * A foil, épée, sabre, shinai or longsword display silhouette.
   */
  export type Kind = (typeof KINDS)[number];

  /**
   * The shared shaft handle for posing the performer.
   */
  export type Affordance = "grip";

  /**
   * Length in metres along the prop's +Y axis.
   */
  export type Dimension = "length";

  /**
   * A stage silhouette, optional size and model identity.
   */
  export interface IParams {
    /** The padded silhouette. */
    kind: Kind;

    /** Scene-unique model id. */
    id?: string;

    /** Overall length in metres. Defaults to the selected silhouette's length. */
    length?: number;
  }
}
