import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeConvexCell,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/*
 * World Gymnastics apparatus norms for the rings, MAG 3.
 */
const NORMS: string =
  "World Gymnastics Apparatus Norms, MAG 3 §2 (https://www.gymnastics.sport/publicdir/rules/files/en_Apparatus%20Norms.pdf)";

/** Constructs the still rings archetype from its recipe. */
export namespace AutoMovieArchetypeStillRings {
/**
 * A competition still-rings frame. Each ring has its own grip and fore-aft
 * travel around its cable attachment. The model stands on the floor and the two
 * rings sit side by side along X.
 *
 * @param params Fixed dimensions within the admitted bands and its model id.
 * @param seed Draws unspecified dimensions within their bands; absent selects
 *   their midpoints.
 * @returns The framed apparatus with two independently posed suspensions.
 * @throws {AutoMovieArchetypeRefusal} When a fixed dimension lies outside its
 *   band.
 */
export function create(
  params: AutoMovieArchetypeStillRings.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeStillRings.Affordance, AutoMovieArchetypeStillRings.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeStillRings.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "stillRings",
      AutoMovieArchetypeStillRings.UNITS,
      seed,
      params,
    );
  const values: Record<AutoMovieArchetypeStillRings.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeStillRings.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeStillRings.Affordance,
    AutoMovieArchetypeStillRings.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "still rings",
    draw,
  });
  const point: typeof Vector3.create = Vector3.create;
  const pivotHeight: number = values.innerHeight + values.suspension;
  const tube: number = values.diameter / 2;
  const radius: number = values.opening / 2 + tube;
  const ringHeight: number = values.innerHeight + values.opening / 2;
  const ringTop: number = ringHeight + radius + tube;
  const strapTop: number = ringTop + values.strapLength;
  const frameHalf: number = 1.57;
  builder.box(
    "beam",
    point(2 * frameHalf + 0.1, 0.1, 0.12),
    point(0, pivotHeight + 0.05, 0),
    { color: "#929ba2" },
  );
  for (const [side, x] of [
    ["left", frameHalf],
    ["right", -frameHalf],
  ] as const) {
    builder.box(
      `${side}-post`,
      point(0.1, pivotHeight, 0.1),
      point(x, pivotHeight / 2, 0),
      {
        color: "#929ba2",
      },
    );
    builder.box(`${side}-foot`, point(0.18, 0.08, 2.8), point(x, 0.04, 0), {
      color: "#626d75",
    });
    for (const z of [-1, 1] as const)
      builder.rod(
        `${side}-brace-${z}`,
        0.021,
        point(x, 0.08, z * 1.3),
        point(x, 2.3, 0),
        {
          color: "#929ba2",
        },
      );
  }

  const sections: number = 12;
  const angle: number = Math.PI / sections;
  const diagonal: number = tube * Math.SQRT1_2;
  const profile: readonly (readonly [number, number])[] = [
    [-tube, 0],
    [-diagonal, -diagonal],
    [0, -tube],
    [diagonal, -diagonal],
    [tube, 0],
    [diagonal, diagonal],
    [0, tube],
    [-diagonal, diagonal],
  ];
  // The radii describe the flat face of a section. Extend its corners to the
  // two radial seams so neighbouring sections touch around the open bore.
  const cell: AutoMovieArchetypeConvexCell.ICell =
    AutoMovieArchetypeConvexCell.of(
      [-1, 1].flatMap((side: number): IAutoMovieVector3[] =>
        profile.map(
          ([offset, z]: readonly [number, number]): IAutoMovieVector3 => {
            const radial: number = radius + offset;
            return point(radial, side * radial * Math.tan(angle), z);
          },
        ),
      ),
    );
  for (const side of ["left", "right"] as const) {
    const x: number = (values.spacing / 2) * (side === "left" ? 1 : -1);
    const pivot = `${side}Pivot` as const;
    const cable: string = `${side}-cable`;
    const strap: string = `${side}-strap`;
    const centre: IAutoMovieVector3 = point(x, ringHeight, 0);
    builder.rod(cable, 0.006, point(x, strapTop, 0), point(x, pivotHeight, 0), {
      color: "#45474b",
    });
    builder.box(
      strap,
      point(values.strapWidth, values.strapLength, 0.006),
      point(x, ringTop + values.strapLength / 2, 0),
      { color: "#62646b" },
    );
    const parts: string[] = [cable, strap];
    for (let i: number = 0; i < sections; ++i) {
      const id: string = `${side}-ring-${i}`;
      builder.convex(id, cell, centre, {
        color: "#b58755",
        rotation: Quaternion.fromAxisAngle(
          point(0, 0, 1),
          (i * 360) / sections - 90,
        ),
      });
      parts.push(id);
    }
    builder.affordance({
      id: pivot,
      kind: "hinge",
      extent: null,
      frame: AutoMovieArchetypeFrame.facing(
        point(x, pivotHeight, 0),
        point(1, 0, 0),
      ),
      travel: 80,
      reverse: 80,
      parts,
    });
    builder.affordance({
      id: `${side}Grip`,
      kind: "handle",
      extent: null,
      frame: AutoMovieArchetypeFrame.upright(point(x, ringHeight - radius, 0)),
      aperture: values.diameter,
      length: 2 * radius * Math.tan(angle),
      symmetry: "round",
      rides: pivot,
    });
  }
  return builder.build(values.mass);
}

  /*
   * Companion dimensions and independently posed contacts of
   * {@link createStillRings}.
   */
  /** One grip and the fore-aft pivot that carries it on each side. */
  export type Affordance =
    | "leftGrip"
    | "rightGrip"
    | "leftPivot"
    | "rightPivot";

  /**
   * Ring bore, wall thickness, lower inner edge above the floor, attachment
   * span and spacing, strap dimensions, and model mass.
   */
  export type Dimension =
    | "opening"
    | "diameter"
    | "innerHeight"
    | "suspension"
    | "spacing"
    | "strapLength"
    | "strapWidth"
    | "mass";

  /** Fixed dimension overrides and the scene model id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Model id, defaulting to the producer id. */
    id?: string;
  }

  /** Metres for geometry and kilograms for model mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    opening: "m",
    diameter: "m",
    innerHeight: "m",
    suspension: "m",
    spacing: "m",
    strapLength: "m",
    strapWidth: "m",
    mass: "kg",
  };

  /** Official dimensional bands and a provisional mass for the coarse frame. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    opening: AutoMovieArchetypeBand.metres(0.179, 0.181, NORMS),
    diameter: AutoMovieArchetypeBand.metres(0.027, 0.029, NORMS),
    innerHeight: AutoMovieArchetypeBand.metres(2.895, 2.905, NORMS),
    // Retain the official pivot-height tolerance for every permitted inner height.
    suspension: AutoMovieArchetypeBand.metres(2.995, 3.005, NORMS),
    spacing: AutoMovieArchetypeBand.metres(0.495, 0.505, NORMS),
    strapLength: AutoMovieArchetypeBand.metres(0.69, 0.71, NORMS),
    strapWidth: AutoMovieArchetypeBand.metres(0.03, 0.05, NORMS),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      135,
      159,
      "Provisional model mass. SPIETH lists a 160 kg shipping weight (https://www.spieth-gymnastics.com/ring-frame-berlin/1384034).",
      true,
    ),
  };
}
