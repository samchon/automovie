import { AutoMovieArchetypePoolWater } from "../AutoMovieArchetypePoolWater";
import { AutoMovieEngineMath } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

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
  params: AutoMovieArchetypePoolWater.IParams = {},
  seed?: number,
): AutoMovieArchetype<"water", AutoMovieArchetypePoolWater.Dimension, null> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypePoolWater.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "poolWater",
      AutoMovieArchetypePoolWater.UNITS,
      seed,
      params,
    );
  const { width, length }: Record<AutoMovieArchetypePoolWater.Dimension, number> =
    draw.dimensions(AutoMovieArchetypePoolWater.BANDS);
  const x: number = width / 2;
  const z: number = length / 2;

  return new AutoMovieArchetype<"water", AutoMovieArchetypePoolWater.Dimension, null>({
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
