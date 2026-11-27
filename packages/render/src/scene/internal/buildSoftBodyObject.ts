import type { IAutoMovieSoftBodySurface } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";
import type { IAutoMovieSoftBodyObject } from "../IAutoMovieSoftBodyObject.js";
import type { IBuildSoftBodyObjectProps } from "./IBuildSoftBodyObjectProps.js";
import { restoreAutoMovieRenderModeOnce } from "./restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Project one canonical Engine cloth surface into an owned Three mesh.
 * Positions, normals and UVs become Float32 attributes; installed SDK setIndex
 * chooses index representation. Engine drawn-panel bounds define the sphere and
 * null bounds hide a cord, while required userData.status preserves
 * solved/rest/derived/not-run/unsupported meaning. Default material and
 * DoubleSide values are unchanged and supplied material is borrowed. Compatible
 * buffers update in place; changed dimensions/index width transfer geometry
 * ownership and retire the prior geometry once. Failed retirement blocks
 * further updates and keeps its cause/owner for independent final close.
 * Current maintained consumers are the existing viewer units; no production
 * rendering route or native appearance is certified here.
 */
export const buildSoftBodyObject: (
  props: IBuildSoftBodyObjectProps,
) => IAutoMovieSoftBodyObject = (
  props: IBuildSoftBodyObjectProps,
): IAutoMovieSoftBodyObject => {
  let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  let retire: () => void = retirement(geometry);
  let failedRetirement: (() => void) | undefined;
  let failure: { error: unknown } | undefined;
  let material: THREE.Material | undefined;
  const owned: boolean = props.material === undefined;
  let closed: boolean = false;
  const dispose: () => void = restoreAutoMovieRenderModeOnce((): void => {
    closed = true;
    restoreAutoMovieRenderModeState([
      ...(failedRetirement === undefined ? [] : [failedRetirement]),
      retire,
      (): void => {
        if (owned && material !== undefined) material.dispose();
      },
    ]);
  });
  try {
    fill(geometry, props.surface);
    material =
      props.material ??
      new THREE.MeshStandardMaterial({
        color: 0xd8cfc0,
        roughness: 0.85,
        metalness: 0,
        side: THREE.DoubleSide,
      });
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
    mesh.name = `soft:${props.surface.domain}`;
    const metadata: (
      frame: Parameters<IAutoMovieSoftBodyObject["update"]>[0],
    ) => void = (
      frame: Parameters<IAutoMovieSoftBodyObject["update"]>[0],
    ): void => {
      mesh.visible = frame.surface.bounds !== null;
      mesh.userData.domain = frame.surface.domain;
      mesh.userData.step = frame.surface.step;
      mesh.userData.status = frame.status;
    };
    metadata({ surface: props.surface, status: props.status });
    const upload: IAutoMovieSoftBodyObject["update"] = (
      frame: Parameters<IAutoMovieSoftBodyObject["update"]>[0],
    ): void => {
      if (closed) throw new Error("The cloth projection is closed.");
      if (failure !== undefined) throw failure.error;
      const surface: IAutoMovieSoftBodySurface = frame.surface;
      // Let the installed SDK choose index width rather than duplicating its primitive-restart boundary; this staging geometry has never been drawn.
      const candidate: THREE.BufferGeometry = new THREE.BufferGeometry();
      const candidateRetire: () => void = retirement(candidate);
      let transferred: boolean = false;
      try {
        candidate.setIndex(surface.mesh.indices ?? []);
        const index: THREE.BufferAttribute = candidate.getIndex()!;
        const previousIndex: THREE.BufferAttribute | null = geometry.getIndex();
        const position:
          | THREE.BufferAttribute
          | THREE.InterleavedBufferAttribute
          | undefined = geometry.getAttribute("position");
        const normal:
          | THREE.BufferAttribute
          | THREE.InterleavedBufferAttribute
          | undefined = geometry.getAttribute("normal");
        const uv:
          | THREE.BufferAttribute
          | THREE.InterleavedBufferAttribute
          | undefined = geometry.getAttribute("uv");
        if (
          AutoMovieThreeKind.isBufferAttribute(position) &&
          AutoMovieThreeKind.isFloat32Array(position.array) &&
          position.array.length === surface.mesh.positions.length &&
          AutoMovieThreeKind.isBufferAttribute(normal) &&
          AutoMovieThreeKind.isFloat32Array(normal.array) &&
          normal.array.length === (surface.mesh.normals ?? []).length &&
          AutoMovieThreeKind.isBufferAttribute(uv) &&
          AutoMovieThreeKind.isFloat32Array(uv.array) &&
          uv.array.length === (surface.mesh.uvs ?? []).length &&
          previousIndex !== null &&
          previousIndex.array.length === index.array.length &&
          previousIndex.array.constructor === index.array.constructor
        ) {
          position.array.set(surface.mesh.positions);
          position.needsUpdate = true;
          normal.array.set(surface.mesh.normals ?? []);
          normal.needsUpdate = true;
          uv.array.set(surface.mesh.uvs ?? []);
          uv.needsUpdate = true;
          previousIndex.array.set(index.array);
          previousIndex.needsUpdate = true;
          geometry.boundingSphere = sphere(surface);
          candidateRetire();
        } else {
          fill(candidate, surface, index);
          const previousRetire: () => void = retire;
          geometry = candidate;
          mesh.geometry = candidate;
          retire = candidateRetire;
          transferred = true;
          try {
            previousRetire();
          } catch (error) {
            failedRetirement = previousRetire;
            failure = { error };
            throw error;
          }
        }
        metadata(frame);
      } catch (error) {
        if (failure === undefined) failure = { error };
        if (!transferred)
          restoreAutoMovieRenderModeState([candidateRetire], { error });
        throw error;
      }
    };
    return { object: mesh, update: upload, dispose };
  } catch (error) {
    restoreAutoMovieRenderModeState([dispose], { error });
  }
};

/** A geometry incarnation shares one original public-disposal attempt. */
function retirement(geometry: THREE.BufferGeometry): () => void {
  return restoreAutoMovieRenderModeOnce((): void => {
    geometry.dispose();
  });
}

/** Copy canonical buffers; index representation remains the installed SDK's. */
function fill(
  geometry: THREE.BufferGeometry,
  surface: IAutoMovieSoftBodySurface,
  index?: THREE.BufferAttribute,
): void {
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
  geometry.setIndex(index ?? surface.mesh.indices ?? []);
  geometry.boundingSphere = sphere(surface);
}

/** Bound the drawn panel from the Engine's extent, including a hidden cord. */
function sphere(surface: IAutoMovieSoftBodySurface): THREE.Sphere {
  const bounds: IAutoMovieSoftBodySurface["bounds"] = surface.bounds;
  if (bounds === null) return new THREE.Sphere(new THREE.Vector3(), 0);
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
  return new THREE.Sphere(
    min.clone().add(max).multiplyScalar(0.5),
    min.distanceTo(max) / 2,
  );
}
