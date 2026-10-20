import type {
  AutoMovieWaterFeatureMode,
  IAutoMovieFluidSurface,
  IAutoMovieFluidSurfaceBounds,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieFluidSurfaceObject } from "./IAutoMovieFluidSurfaceObject.js";
import { reportAutoMovieResourceRetirement } from "./reportAutoMovieResourceRetirement.js";

/**
 * Project one engine-derived free surface into a `three.js` mesh.
 *
 * Positions, normals, UVs and the per-vertex flow vector come from the Engine surface. `aFlow` and `flowing` preserve numerical intent for a supplied shader; the default MeshStandardMaterial does not consume either to scroll ripples.
 *
 * Structural passes swap this ordinary mesh's material. Its bounding sphere uses the supplied wet bounds; copied Float32 positions do not establish pixel equality with the numerical depth field.
 *
 * @evidence contracts/common.md#principled-implementation The admitted engine surface supplies indexed positions, normals, UVs, flow and wet bounds; uploads copy them to Float32 attributes and use the wet-bound box diagonal for a conservative sphere. A different domain refuses before writes; buffer consistency and finite values are engine admission premises.
 * @evidence contracts/common.md#clear-and-simple-design One mesh owns upload and resource release while the fluid solver remains numerical. Flow and mode are metadata for custom materials, not a second viewer velocity computation or an implicit ripple shader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dry lattice vertices do not enlarge the supplied wet-bound sphere. The translucent blue default is an authored display choice rather than a physical appearance claim. Construction and mid-upload failures lack full rollback; disposal attempts each owned resource independently without consumer exceptions.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes uploaded flow from material consumption and Float32 projection from numerical depth. Props state borrowed material ownership and the metadata-only role of mode.
 * @evidence contracts/performance.md#efficient-algorithms Upload copies vertex, normal, UV, flow and index arrays with linear time and space in their lengths; wet-bound sphere construction is constant work. A full upload is needed because this API accepts a complete new surface rather than dirty ranges.
 * @evidence contracts/performance.md#reuse-equivalent-work Mesh, geometry identity and material persist across updates; attributes are recreated for each supplied surface. Domain guards identity but does not prove that equal step values imply unchanged bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns scene attachment and disposal; geometry and only the default material belong to this object. Each invocation independently attempts geometry then the default material; ordered causes follow the existing reporter, including its unresolved diagnostic-coercion limit. Repeat and post-disposal update behavior remains unchanged. Latest attributes replace old references, while constructor rollback and physical GPU retirement are unproven. Maintained callers are owning tests rather than a production fluid scene host.
 */
export const buildFluidSurfaceObject: (props: {
  surface: IAutoMovieFluidSurface;
  material?: THREE.Material;
  mode?: AutoMovieWaterFeatureMode;
}) => IAutoMovieFluidSurfaceObject = (props: {
  surface: IAutoMovieFluidSurface;
  /** Water material; a translucent default is created when absent. */
  material?: THREE.Material;
  /** Feature mode recorded as flowing metadata; a supplied shader may consume it. */
  mode?: AutoMovieWaterFeatureMode;
}): IAutoMovieFluidSurfaceObject => {
  const geometry: THREE.BufferGeometry<
    THREE.NormalBufferAttributes,
    THREE.BufferGeometryEventMap
  > = new THREE.BufferGeometry();
  const owned: boolean = props.material === undefined;
  const material: THREE.Material<THREE.MaterialEventMap> =
    props.material ??
    new THREE.MeshStandardMaterial({
      color: 0x2f6f8f,
      roughness: 0.1,
      metalness: 0,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
  const mesh: THREE.Mesh<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    THREE.Material<THREE.MaterialEventMap>,
    THREE.Object3DEventMap
  > = new THREE.Mesh(geometry, material);
  const domain: string = props.surface.domain;
  mesh.name = `water:${domain}`;
  const upload: (surface: IAutoMovieFluidSurface) => void = (
    surface: IAutoMovieFluidSurface,
  ): void => {
    if (surface.domain !== domain)
      throw new Error(
        `water surface object of "${domain}" cannot upload a surface of "${surface.domain}"`,
      );
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(surface.mesh.positions, 3),
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(surface.mesh.normals ?? [], 3),
    );
    geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(surface.mesh.uvs ?? [], 2),
    );
    geometry.setAttribute(
      "aFlow",
      new THREE.Float32BufferAttribute(surface.flow, 2),
    );
    geometry.setIndex(surface.mesh.indices ?? []);
    // Supplied wet bounds exclude dry lattice vertices from the culling sphere.
    const bounds: IAutoMovieFluidSurfaceBounds | null = surface.bounds;
    if (bounds === null) {
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0);
      mesh.visible = false;
    } else {
      const min: THREE.Vector3 = new THREE.Vector3(
        bounds.min.x,
        bounds.min.y,
        bounds.min.z,
      );
      const max: THREE.Vector3 = new THREE.Vector3(
        bounds.max.x,
        bounds.max.y,
        bounds.max.z,
      );
      geometry.boundingSphere = new THREE.Sphere(
        min.clone().add(max).multiplyScalar(0.5),
        min.distanceTo(max) / 2,
      );
      mesh.visible = true;
    }
    mesh.userData.domain = surface.domain;
    mesh.userData.step = surface.step;
  };
  upload(props.surface);
  mesh.userData.flowing = props.mode === "flowing";
  return {
    object: mesh,
    update: upload,
    dispose: (): void => {
      reportAutoMovieResourceRetirement([
        (): void => {
          geometry.dispose();
        },
        (): void => {
          if (owned) material.dispose();
        },
      ]);
    },
  };
};
