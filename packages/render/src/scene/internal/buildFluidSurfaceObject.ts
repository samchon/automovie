import type {
  AutoMovieWaterFeatureMode,
  IAutoMovieFluidSurface,
  IAutoMovieFluidSurfaceBounds,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieRenderFluidSurfaceObject } from "../IAutoMovieRenderFluidSurfaceObject";
import { reportResourceRetirement } from "./reportResourceRetirement";

/*
 * Project one engine-derived free surface into a `three.js` mesh.
 *
 * Positions, normals, UVs and the per-vertex flow vector come from the Engine
 * surface. `aFlow` and `flowing` preserve numerical intent for a supplied
 * shader; the default MeshStandardMaterial does not consume either to scroll
 * ripples.
 *
 * Structural passes swap this ordinary mesh's material. Its bounding sphere
 * uses the supplied wet bounds; copied Float32 positions do not establish pixel
 * equality with the numerical depth field.
 */
export const buildFluidSurfaceObject: (props: {
  surface: IAutoMovieFluidSurface;
  material?: THREE.Material;
  mode?: AutoMovieWaterFeatureMode;
}) => IAutoMovieRenderFluidSurfaceObject = (props: {
  surface: IAutoMovieFluidSurface;
  /*
   * Water material; a translucent default is created when absent.
   */
  material?: THREE.Material;
  /*
   * Feature mode recorded as flowing metadata; a supplied shader may consume
   * it.
   */
  mode?: AutoMovieWaterFeatureMode;
}): IAutoMovieRenderFluidSurfaceObject => {
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
      reportResourceRetirement([
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
