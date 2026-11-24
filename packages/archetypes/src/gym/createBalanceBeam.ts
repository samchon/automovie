import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** World Gymnastics Apparatus Norms, WAG 3, balance beam measurements. */
const NORMS: string =
  "World Gymnastics Apparatus Norms, WAG 3 §2.1 (https://www.gymnastics.sport/publicdir/rules/files/en_Apparatus%20Norms.pdf)";

/**
 * A competition balance beam with a narrow flat bearing surface, shaped sides
 * and two floor stands. The beam runs along Z with its base at floor level and
 * its top socket at the centre of the bearing surface.
 *
 * @param params Fixed dimensions within the admitted model bands and its id.
 * @param seed Draws any unspecified size inside its band; absent selects the
 *   midpoint.
 * @returns A beam whose collision hull and bearing surface share the same
 *   corners.
 * @throws {AutoMovieArchetypeRefusal} When a fixed dimension lies outside its
 *   band.
 */
export function createBalanceBeam(
  params: createBalanceBeam.IParams = {},
  seed?: string | number,
): AutoMovieArchetype<
  createBalanceBeam.Affordance,
  createBalanceBeam.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<createBalanceBeam.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "balanceBeam",
      createBalanceBeam.UNITS,
      seed,
      params,
    );
  const values: Record<createBalanceBeam.Dimension, number> = draw.dimensions(
    createBalanceBeam.BANDS,
  );
  const length: number = values.length;
  const height: number = values.height;
  const width: number = values.width;
  const depth: number = values.sectionDepth;
  const half: number = width / 2;
  const widest: number = values.sectionWidth / 2;
  const section: readonly (readonly [number, number])[] = [
    [-half, height],
    [half, height],
    [widest, height - depth / 2],
    [half, height - depth],
    [-half, height - depth],
    [-widest, height - depth / 2],
  ];
  const corners: IAutoMovieVector3[] = [-length / 2, length / 2].flatMap(
    (z: number): IAutoMovieVector3[] =>
      section.map(
        ([x, y]: readonly [number, number]): IAutoMovieVector3 =>
          Vector3.create(x, y, z),
      ),
  );
  const builder: AutoMovieArchetypeBuilder<
    createBalanceBeam.Affordance,
    createBalanceBeam.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "balance beam",
    draw,
  });
  builder.convex("beam", corners, undefined, { color: "#ccaa79" });

  // The stand placement and construction are simplified. Each foot stays
  // inside the published maximum base width and reaches the floor.
  const base: number = 0.08;
  for (const side of [-1, 1] as const) {
    const name: string = side < 0 ? "back" : "front";
    const z: number = side * length * 0.28;
    builder.box(
      `foot-${name}`,
      Vector3.create(1.06, base, 0.2),
      Vector3.create(0, base / 2, z),
      {
        color: "#484e5b",
      },
    );
    const leg: number = height - depth - base;
    builder.box(
      `stand-${name}`,
      Vector3.create(0.12, leg, 0.14),
      Vector3.create(0, base + leg / 2, z),
      {
        color: "#636d82",
      },
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
  return builder.build(values.mass);
}

/** Companion dimensions and support for the competition balance beam. */
export namespace createBalanceBeam {
  /** The flat top where hands and feet contact the beam. */
  export type Affordance = "surface";

  /**
   * Length along Z, top height, top width, section width and depth, and total
   * mass.
   */
  export type Dimension =
    | "length"
    | "height"
    | "width"
    | "sectionWidth"
    | "sectionDepth"
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
    length: "m",
    height: "m",
    width: "m",
    sectionWidth: "m",
    sectionDepth: "m",
    mass: "kg",
  };

  /** Competition tolerances and a provisional mass for the coarse model. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(4.99, 5.01, NORMS),
    height: AutoMovieArchetypeBand.metres(1.24, 1.26, NORMS),
    width: AutoMovieArchetypeBand.metres(0.095, 0.105, NORMS),
    sectionWidth: AutoMovieArchetypeBand.metres(0.125, 0.135, NORMS),
    sectionDepth: AutoMovieArchetypeBand.metres(0.155, 0.165, NORMS),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      75,
      95,
      "Provisional model mass. SPIETH Soft Touch lists a 96 kg shipping weight (https://www.spieth-gymnastics.com/balance-beam-soft-touch/1414210).",
      true,
    ),
  };
}
