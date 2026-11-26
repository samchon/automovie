import { AutoMovieEngineMath } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/**
 * A rectangular pool water surface at local Y = 0, with positive Y up. The
 * translucent material shows limbs below the swimming plane. The `water`
 * affordance gives a placement reader the same plane and extents.
 *
 * @param params Optional fixed surface dimensions, in metres, and model id.
 * @param seed The seed for omitted dimensions. With no seed, use each band's
 *   midpoint.
 * @returns A visual archetype with water geometry, dimensions and a placement
 *   reference.
 * @throws {AutoMovieArchetypeRefusal} When a fixed dimension is nonfinite or
 *   outside its band.
 */
export function createPoolWater(
  params: createPoolWater.IParams = {},
  seed?: number,
): AutoMovieArchetype<"water", createPoolWater.Dimension, null> {
  const draw: AutoMovieArchetypeDrawSession<createPoolWater.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "poolWater",
      createPoolWater.UNITS,
      seed,
      params,
    );
  const { width, length }: Record<createPoolWater.Dimension, number> =
    draw.dimensions(createPoolWater.BANDS);
  const x: number = width / 2;
  const z: number = length / 2;

  return new AutoMovieArchetype<"water", createPoolWater.Dimension, null>({
    archetype: draw.archetype,
    id: params.id ?? draw.archetype,
    name: "Pool water",
    parts: [
      {
        id: "surface",
        name: "Water surface",
        geometry: {
          type: "mesh",
          mesh: {
            positions: [-x, 0, -z, -x, 0, z, x, 0, z, x, 0, -z],
            normals: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
            indices: [0, 1, 2, 0, 2, 3],
            uvs: null,
            skin: null,
          },
        },
        material: "water",
        attachedBone: null,
        transform: null,
      },
    ],
    affordances: [
      {
        id: "water",
        kind: "surface",
        frame: AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
        extent: null,
        width,
        depth: length,
      },
    ],
    materials: [
      {
        id: "water",
        name: "Pool water",
        baseColor: AutoMovieEngineMath.srgbHexToLinearColor("#439dc6"),
        metallic: 0,
        roughness: 0.42,
        emissive: null,
        opacity: 0.42,
        alphaMode: "blend",
        baseColorTexture: null,
      },
    ],
    properties: null,
    friction: null,
    kineticFriction: null,
    surfaces: {},
    material: null,
    restitution: null,
    drag: null,
    contact: null,
    fractures: [],
    masses: {},
    dimensions: draw.values,
    provenance: draw.provenance,
    spans: [],
  });
}

/** Authorable spans of the water surface. */
export namespace createPoolWater {
  /** The separate width and length axes of the rectangle. */
  export type Dimension = "width" | "length";

  /** Positive spans of the water surface and its optional model id. */
  export interface IParams {
    /** Span along local X, in metres. Drawn when absent. */
    width?: number;
    /** Span along local Z, in metres. Drawn when absent. */
    length?: number;
    /** Model id. Defaults to `poolWater`. */
    id?: string;
  }

  /** Both horizontal spans are measured in metres. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    length: "m",
  };

  /** Provisional authoring spans from one lane to a full pool surface. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.metres(
      2.5,
      25,
      "Pool water staging span",
      true,
    ),
    length: AutoMovieArchetypeBand.metres(
      5,
      50,
      "Pool water staging span",
      true,
    ),
  };
}
