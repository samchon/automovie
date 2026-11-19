import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

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
  longBlade: 1.75,
  crescentBlade: 1.85,
  sideBlade: 1.7,
  serpentBlade: 1.8,
  offsetHammer: 0.85,
  linked: 0.95,
};

/** A section of the padded outline in the XY plane, normalized by display height. */
type Section = readonly [y: number, left: number, right: number];

/** Adjacent sections and the index of the lower section of the marked edge. */
interface IBlade {
  /** Cross sections from shaft to tip. */
  sections: readonly Section[];
  /** First of the two sections defining the main edge mark. */
  edge: number;
}

/**
 * Digital silhouettes based on the Palace Museum's Qing yanyuedao, Royal
 * Armouries XXVIL.50, and Met 49.120.13. The serpent outline is a screen
 * interpretation of the literary name in Romance of the Three Kingdoms, ch. 1.
 */
const BLADES: Readonly<Partial<Record<createStageWeaponProp.Kind, IBlade>>> = {
  longBlade: {
    sections: [
      [0.62, -0.018, 0.018], [0.72, -0.032, 0.032],
      [0.90, -0.027, 0.027], [1, -0.007, 0.007],
    ],
    edge: 1,
  },
  crescentBlade: {
    sections: [
      [0.62, -0.020, 0.021], [0.75, -0.035, 0.057], [0.88, -0.015, 0.083],
      [0.96, 0.031, 0.082], [1, 0.062, 0.075],
    ],
    edge: 1,
  },
  sideBlade: {
    sections: [
      [0.69, -0.020, 0.020], [0.855, -0.021, 0.021], [1, -0.007, 0.007],
    ],
    edge: 0,
  },
  serpentBlade: {
    sections: [
      [0.62, -0.016, 0.016], [0.72, -0.042, -0.007], [0.82, -0.014, 0.019],
      [0.91, 0.007, 0.039], [1, -0.005, 0.008],
    ],
    edge: 2,
  },
};

/** Side ornament sharing a narrow overlap with the axial blade. */
const SIDE_BLADE: readonly Section[] = [
  [0.69, 0.010, 0.090],
  [0.76, 0.005, 0.102],
  [0.855, 0.010, 0.075],
];

/**
 * A digital stage prop with a padded silhouette. The mace has a round
 * ornament, the pike a narrow upright capsule, the shuo a wider elongated
 * oval, and the halberd a side ornament. Additional profiles provide blade
 * marks, an offset ornament, and a linked ornament with an authored hinge.
 * The model stands from the origin along +Y at rest. The round shaft's
 * grip is approached from -Z.
 *
 * @param params The outline, scene id and optional overall display height in metres.
 * @param seed A seed for the builder's draw session.
 * @returns A foam model with a named grip for kinematic staging.
 * @throws {ArchetypeRefusal} When the outline or height is out of range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each catalogue outline, the fixed scale assigned by the outline, the optional height override, and the common grip approach.
 * @evidence contracts/development/implementation.md#principled-implementation Visible outlines and marks use the same section coordinates. The linked option moves the connector and ornament about their shared shaft pivot. All profiles share the shaft centreline.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the outline and size, lay out the shared shaft and chosen ornament, then register the grip.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses authored digital silhouettes and a nominal mass. Articulation is scene-authored with no inferred reaction.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each silhouette records a fixed number of primitives, convex strips and affordances.
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
    createStageWeaponProp.KINDS,
  );
  const draw: ArchetypeDrawSession<createStageWeaponProp.Dimension> =
    new ArchetypeDrawSession("stageWeaponProp", UNITS, seed, {
      height: params.height,
    });
  // The chosen silhouette fixes its display height unless the scene supplies one.
  const height: number =
    params.height === undefined
      ? draw.derive("height", DISPLAY_HEIGHTS[kind])
      : draw.dimensions({ height: HEIGHT }).height;
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
  const blade: IBlade | undefined = BLADES[kind];
  const shaftRatio: number = kind === "linked" ? 0.5 : (blade?.sections[0]?.[0] ?? 0.8);
  const shaftTop: number = shaftRatio * height;
  builder.rod("shaft", shaftRadius, v(0, 0, 0), v(0, shaftTop, 0), {
    color: "#55516d",
  });

  if (blade !== undefined) {
    addOutline(builder, "blade", blade.sections, height);
    const tip: Section = blade.sections[blade.sections.length - 1]!;
    builder.affordance({
      id: "tip",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.upright(v(((tip[1] + tip[2]) / 2) * height, height, 0)),
      extent: null,
    });
    addEdge(builder, "edge", blade.sections[blade.edge]!, blade.sections[blade.edge + 1]!, height);
    if (kind === "sideBlade") {
      addOutline(builder, "sideBlade", SIDE_BLADE, height);
      addEdge(builder, "side-edge", SIDE_BLADE[0]!, SIDE_BLADE[1]!, height);
    }
    builder.affordance({
      id: "shaft",
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(0, shaftTop / 2, 0), v(0, 0, -1), v(0, 1, 0)),
      extent: null,
      grip: "two-hand",
      aperture: 2 * shaftRadius,
      length: shaftTop,
    });
    for (const [id, fraction] of [
      ["grip-lower", 0.3],
      ["grip-upper", 0.7],
    ] as const)
      builder.affordance({
        id,
        kind: "handle",
        symmetry: "round",
        frame: ArchetypeFrame.facing(
          v(0, shaftTop * fraction, 0),
          v(0, 0, -1),
          v(0, 1, 0),
        ),
        extent: null,
        grip: "power",
        aperture: 2 * shaftRadius,
        length: Math.min(0.14, 0.18 * shaftTop),
      });
  } else if (kind === "offsetHammer") {
    const width: number = 0.24 * height;
    const centre: number = 0.06 * height;
    builder.box(
      "ornament",
      v(width, 0.2 * height, 0.095 * height),
      v(centre, 0.9 * height, 0),
      { color: "#968ccc" },
    );
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        v(centre + width / 2, 0.9 * height, 0),
        v(1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
    });
  } else if (kind === "linked") {
    const pivot: IAutoMovieVector3 = v(0, shaftTop, 0);
    const radius: number = 0.11 * height;
    const centre: IAutoMovieVector3 = v(0, height - radius, 0);
    builder.rod("connector", 0.32 * shaftRadius, pivot, centre, { color: "#bca6df" });
    builder.ball("ornament", radius, centre, { color: "#968ccc" });

    // The hinge turns about frame-local +Y, which faces out of the stage outline.
    builder.affordance({
      id: "link",
      kind: "hinge",
      frame: ArchetypeFrame.facing(pivot, v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      travel: 180,
      parts: ["connector", "ornament"],
    });
    builder.affordance({
      id: "end",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.upright(v(0, height, 0)),
      extent: null,
      rides: "link",
    });
  } else if (kind === "mace") {
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

/** Extrude one small convex cell between each pair of adjacent outline sections. */
function addOutline(
  builder: ArchetypeBuilder<createStageWeaponProp.Affordance, createStageWeaponProp.Dimension>,
  id: string,
  sections: readonly Section[],
  height: number,
): void {
  const halfThickness: number = 0.012 * height;
  for (let index: number = 1; index < sections.length; index++) {
    const points: IAutoMovieVector3[] = [];
    for (const [y, left, right] of [sections[index - 1]!, sections[index]!])
      for (const x of [left, right])
        for (const z of [-halfThickness, halfThickness])
          points.push(Vector3.create(x * height, y * height, z));
    builder.convex(`${id}-${index}`, points, undefined, { color: "#968ccc" });
  }
}

/** Record the midpoint and outward normal of the right edge of a silhouette cell. */
function addEdge(
  builder: ArchetypeBuilder<createStageWeaponProp.Affordance, createStageWeaponProp.Dimension>,
  id: "edge" | "side-edge",
  lower: Section,
  upper: Section,
  height: number,
): void {
  const v: typeof Vector3.create = Vector3.create;
  builder.affordance({
    id,
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      v(((lower[2] + upper[2]) / 2) * height, ((lower[0] + upper[0]) / 2) * height, 0),
      v(upper[0] - lower[0], lower[2] - upper[2], 0),
      v(upper[2] - lower[2], upper[0] - lower[0], 0),
    ),
    extent: null,
  });
}

/**
 * Authoring controls and affordance ids for the stage silhouettes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the forms, metre scale, named hand sites, motion marks and link pivot.
 * @evidence contracts/development/design.md#principled-representation The outline is a closed literal union with one scale parameter independent of scene identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Provides the named outline and display height used by the producer and the hold name used by the scene.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported outlines and inadmissible heights are refused by the shared draw owners.
 */
export namespace createStageWeaponProp {
  /** The padded silhouette variants admitted by the factory and listed in the catalogue. */
  export const KINDS = [
    "mace", "pike", "shuo", "halberd", "longBlade", "crescentBlade",
    "sideBlade", "serpentBlade", "offsetHammer", "linked",
  ] as const;

  /**
   * The authored display silhouettes.
   */
  export type Kind = (typeof KINDS)[number];

  /**
   * The common hand grip, shaft bar and two discrete support sites on the
   * blade profiles, and outline-dependent tip, edge, face, hinge and end.
   */
  export type Affordance =
    | "grip"
    | "grip-lower"
    | "grip-upper"
    | "shaft"
    | "tip"
    | "edge"
    | "side-edge"
    | "face"
    | "link"
    | "end";

  /**
   * The overall display height in metres.
   */
  export type Dimension = "height";

  /**
   * Stage outline, optional scale override, and scene identity.
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
