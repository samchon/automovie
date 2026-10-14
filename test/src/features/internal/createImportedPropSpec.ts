import type { IAutoMoviePropSpec } from "@automovie/interface";

import { FILM_IMPORTED_PROP_BYTES } from "./FILM_IMPORTED_PROP_BYTES";
import { filmImportedPropDigest as digest } from "./filmImportedPropDigest";

const HERO_BYTES: string = FILM_IMPORTED_PROP_BYTES.hero;
const SIDECAR_BYTES: string = FILM_IMPORTED_PROP_BYTES.sidecar;

/**
 * Fresh imported chair metadata and its authored collision proxy, body and stack-top affordance. Symbolic asset paths and repeated-character digests exercise declared closure admission without loading or hashing actual assets.
 */
export function createImportedPropSpec(): IAutoMoviePropSpec {
  return {
    node: "chair",
    modelRef: "chair-model",
    model: {
      id: "chair",
      name: "imported chair-model",
      origin: "imported",
      skeleton: null,
      body: { mass: 6, centerOfMass: null, friction: 0.5, restitution: 0.05 },
      affordances: [
        {
          id: "seat",
          kind: "stack-top",
          frame: {
            translation: { x: 0, y: 0.45, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          extent: [
            { x: -0.2, y: 0, z: -0.2 },
            { x: 0.2, y: 0, z: -0.2 },
            { x: 0.2, y: 0, z: 0.2 },
            { x: -0.2, y: 0, z: 0.2 },
          ],
        },
      ],
      materials: [],
      parts: [
        {
          id: "registered-collision-proxy",
          name: "registered collision proxy",
          geometry: {
            type: "primitive",
            shape: { type: "box", width: 0.5, height: 0.9, depth: 0.5 },
          },
          material: null,
          attachedBone: null,
          transform: null,
        },
      ],
      asset: HERO_BYTES,
      profiles: [],
      imported: {
        profile: "gltf-static-v1",
        lod: [
          {
            level: "hero",
            asset: HERO_BYTES,
            digest: digest("a"),
            profile: "gltf-static-v1",
            humanoidBones: [],
          },
        ],
        assets: [
          { path: HERO_BYTES, digest: digest("a") },
          { path: SIDECAR_BYTES, digest: digest("b") },
        ],
        humanoidBones: [],
      },
    },
    articulation: null,
  };
}
