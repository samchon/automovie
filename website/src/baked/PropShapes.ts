import { AutoMovieRenderSceneLayout } from "@automovie/render";
import * as THREE from "three";

import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";
import { SceneArchetype } from "../scenes/package/SceneArchetype";

/**
 * The outline material of a composition's props: each placed archetype as
 * the 3D player builds it, broken into its meshes, each mesh as the points
 * of its surface in the prop's own frame with its material's colour. A still
 * moves the points by the prop's frame at the drawn second and outlines each
 * mesh by the hull of its projected points, which draws a blade, a racket or
 * a seat as the coarse solid the player shows.
 */
export namespace PropShapes {
  /** One prop's meshes. */
  export interface IShape {
    /** The prop's subject id, which names its frame in the take. */
    subject: string;

    /** Its meshes. */
    parts: IPart[];
  }

  /** One mesh of a prop. */
  export interface IPart {
    /** Its colour, `#rrggbb`. */
    colour: string;

    /** Its material's opacity: 1 when opaque, less for a translucent one such as a net. */
    opacity: number;

    /** Its surface's distinct points in the prop's frame, metres, as x, y, z triples. */
    points: number[];
  }

  /** Points kept per mesh at most; a hull needs only the outline. */
  const LIMIT: number = 240;

  /**
   * The shapes of a composition's props.
   *
   * @param objects The placed objects.
   * @returns One shape per object, in order; an object whose producer is missing has no parts.
   */
  export function of(
    objects: readonly IPlaygroundComposition.IObject[],
  ): IShape[] {
    return objects.map((placed: IPlaygroundComposition.IObject): IShape => {
      const parts: IPart[] = [];
      let model: THREE.Object3D;
      try {
        model = AutoMovieRenderSceneLayout.buildModel(
          SceneArchetype.model(placed) as Parameters<typeof AutoMovieRenderSceneLayout.buildModel>[0],
        ).object;
      } catch {
        return { subject: placed.subject, parts };
      }
      model.updateMatrixWorld(true);
      const point: THREE.Vector3 = new THREE.Vector3();
      model.traverse((node: THREE.Object3D): void => {
        if (!(node instanceof THREE.Mesh) || node.visible === false) return;
        const position:
          | THREE.BufferAttribute
          | THREE.InterleavedBufferAttribute
          | undefined = node.geometry.getAttribute("position");
        if (position === undefined) return;
        const seen: Set<string> = new Set<string>();
        const points: number[] = [];
        const stride: number = Math.max(1, Math.floor(position.count / LIMIT));
        for (let i: number = 0; i < position.count; i += stride) {
          point.fromBufferAttribute(position, i).applyMatrix4(node.matrixWorld);
          const key: string = `${point.x.toFixed(3)},${point.y.toFixed(3)},${point.z.toFixed(3)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          points.push(
            Number(point.x.toFixed(3)),
            Number(point.y.toFixed(3)),
            Number(point.z.toFixed(3)),
          );
        }
        const material: THREE.Material = [
          node.material,
        ].flat()[0] as THREE.Material;
        const colour: THREE.Color | undefined = (
          material as THREE.MeshStandardMaterial
        ).color;
        parts.push({
          colour:
            colour === undefined ? "#8a8478" : `#${colour.getHexString()}`,
          opacity: material.transparent ? Math.min(1, material.opacity) : 1,
          points,
        });
      });
      return { subject: placed.subject, parts };
    });
  }
}
