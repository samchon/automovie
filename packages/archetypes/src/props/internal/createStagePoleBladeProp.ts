import { AutoMovieArchetypeStagePoleBladeProp } from "../AutoMovieArchetypeStagePoleBladeProp";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core/index";
import { StageShaftConstruction } from "../StageShaftConstruction";
import type { createStageWeaponProp } from "../createStageWeaponProp";

/**
 * A section of the padded outline in the XY plane, normalized by display
 * height.
 */
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
const BLADES: Readonly<Record<AutoMovieArchetypeStagePoleBladeProp.Kind, IBlade>> = {
  longBlade: {
    sections: [
      [0.62, -0.018, 0.018],
      [0.72, -0.032, 0.032],
      [0.9, -0.027, 0.027],
      [1, -0.007, 0.007],
    ],
    edge: 1,
  },
  crescentBlade: {
    sections: [
      [0.62, -0.02, 0.021],
      [0.75, -0.035, 0.057],
      [0.88, -0.015, 0.083],
      [0.96, 0.031, 0.082],
      [1, 0.062, 0.075],
    ],
    edge: 1,
  },
  sideBlade: {
    sections: [
      [0.69, -0.02, 0.02],
      [0.855, -0.021, 0.021],
      [1, -0.007, 0.007],
    ],
    edge: 0,
  },
  serpentBlade: {
    sections: [
      [0.62, -0.016, 0.016],
      [0.72, -0.042, -0.007],
      [0.82, -0.014, 0.019],
      [0.91, 0.007, 0.039],
      [1, -0.005, 0.008],
    ],
    edge: 2,
  },
};

/** Side ornament sharing a narrow overlap with the axial blade. */
const SIDE_BLADE: readonly Section[] = [
  [0.69, 0.01, 0.09],
  [0.76, 0.005, 0.102],
  [0.855, 0.01, 0.075],
];

/**
 * Padded pole-blade silhouette.
 *
 * Independent stage profiles share a shaft, two actor grip marks and visible
 * outline marks: the `tip`, the main `edge`, the `rear` back of that edge cell,
 * and the side blade's `side-edge`. The form stands along +Y from its origin.
 *
 * @param params The scene identity and optional total display height in metres,
 *   with a choice of profile.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStagePoleBladeProp(
  params: AutoMovieArchetypeStagePoleBladeProp.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStagePoleBladeProp.Affordance,
  AutoMovieArchetypeStagePoleBladeProp.Dimension
> {
  const kind: AutoMovieArchetypeStagePoleBladeProp.Kind = ArchetypeDraw.choice(
    "stageWeaponProp",
    "kind",
    params.kind,
    AutoMovieArchetypeStagePoleBladeProp.KINDS,
  );
  const blade: IBlade = BLADES[kind];
  return StageShaftConstruction(
    kind,
    params,
    seed,
    blade.sections[0]![0],
    (builder, height, shaftTop, shaftRadius) => {
      const v: typeof Vector3.create = Vector3.create;
      addOutline(builder, "blade", blade.sections, height);
      const tip: Section = blade.sections[blade.sections.length - 1]!;
      builder.affordance({
        id: "tip",
        kind: "surface",
        direction: "along",
        frame: AutoMovieArchetypeFrame.upright(
          v(((tip[1] + tip[2]) / 2) * height, height, 0),
        ),
        extent: null,
      });
      addEdge(
        builder,
        "edge",
        blade.sections[blade.edge]!,
        blade.sections[blade.edge + 1]!,
        height,
      );
      addRear(
        builder,
        blade.sections[blade.edge]!,
        blade.sections[blade.edge + 1]!,
        height,
      );
      if (kind === "sideBlade") {
        addOutline(builder, "sideBlade", SIDE_BLADE, height);
        addEdge(builder, "side-edge", SIDE_BLADE[0]!, SIDE_BLADE[1]!, height);
      }
      builder.affordance({
        id: "shaft",
        kind: "bar",
        symmetry: "round",
        frame: AutoMovieArchetypeFrame.facing(
          v(0, shaftTop / 2, 0),
          v(0, 0, -1),
          v(0, 1, 0),
        ),
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
          frame: AutoMovieArchetypeFrame.facing(
            v(0, shaftTop * fraction, 0),
            v(0, 0, -1),
            v(0, 1, 0),
          ),
          extent: null,
          grip: "power",
          aperture: 2 * shaftRadius,
          length: Math.min(0.14, 0.18 * shaftTop),
        });
    },
  );
}



/** The two cutting edges a pole blade's helper records. */
type BladeEdge = "edge" | "side-edge";

/** Extrude one small convex cell between each pair of adjacent outline sections. */
function addOutline(
  builder: AutoMovieArchetypeBuilder<
    createStageWeaponProp.Affordance,
    createStageWeaponProp.Dimension
  >,
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

/**
 * Record the midpoint and outward normal of the left boundary of the marked
 * edge cell: the blade's back, facing away from its edge, so a scene can tell
 * the cutting side from the spine.
 */
function addRear(
  builder: AutoMovieArchetypeBuilder<
    createStageWeaponProp.Affordance,
    createStageWeaponProp.Dimension
  >,
  lower: Section,
  upper: Section,
  height: number,
): void {
  const v: typeof Vector3.create = Vector3.create;
  builder.affordance({
    id: "rear",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(
        ((lower[1] + upper[1]) / 2) * height,
        ((lower[0] + upper[0]) / 2) * height,
        0,
      ),
      v(lower[0] - upper[0], upper[1] - lower[1], 0),
      v(upper[1] - lower[1], upper[0] - lower[0], 0),
    ),
    extent: null,
  });
}

/**
 * Record the midpoint and outward normal of the right edge of a silhouette
 * cell.
 */
function addEdge(
  builder: AutoMovieArchetypeBuilder<
    createStageWeaponProp.Affordance,
    createStageWeaponProp.Dimension
  >,
  id: BladeEdge,
  lower: Section,
  upper: Section,
  height: number,
): void {
  const v: typeof Vector3.create = Vector3.create;
  builder.affordance({
    id,
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(
        ((lower[2] + upper[2]) / 2) * height,
        ((lower[0] + upper[0]) / 2) * height,
        0,
      ),
      v(upper[0] - lower[0], lower[2] - upper[2], 0),
      v(upper[2] - lower[2], upper[0] - lower[0], 0),
    ),
    extent: null,
  });
}
