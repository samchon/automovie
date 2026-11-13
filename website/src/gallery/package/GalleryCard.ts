import { type IAutoMovieModelObject, buildModel } from "@automovie/render";
import * as THREE from "three";

import type { IGalleryCard } from "../loadGalleryCard";
import { GalleryArchetype } from "./GalleryArchetype";

/**
 * One archetype as a card of the object gallery draws it: its first kind at
 * the middle of every band, on the viewport ground, seen from the
 * three-quarter view and framed to its size, turning on request.
 */
export namespace GalleryCard {
  /**
   * Build the card of a producer.
   *
   * @param subject The producer's export name.
   * @param variant Its first kind, or the empty text when it has none.
   * @returns The card.
   */
  export function build(subject: string, variant: string): IGalleryCard {
    const built: GalleryArchetype.IBuilt = GalleryArchetype.build({
      subject,
      variant,
      seed: "",
      state: {},
      affordances: false,
    });
    const model: IAutoMovieModelObject = buildModel(built.archetype);
    const scene: THREE.Scene = new THREE.Scene();
    const style: CSSStyleDeclaration = getComputedStyle(document.documentElement);
    scene.background = new THREE.Color(
      style.getPropertyValue("--am-viewport").trim() || "#e9ebef",
    );
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8d8a83, 1.3));
    const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(2, 4, 3);
    scene.add(sun);

    // The model turns about the middle of its footprint.
    const box: THREE.Box3 = new THREE.Box3().setFromObject(model.object);
    const centre: THREE.Vector3 = box.getCenter(new THREE.Vector3());
    const pivot: THREE.Group = new THREE.Group();
    model.object.position.sub(new THREE.Vector3(centre.x, 0, centre.z));
    pivot.add(model.object);
    scene.add(pivot);

    const size: number = Math.max(0.05, box.getSize(new THREE.Vector3()).length());
    const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
      30,
      4 / 3,
      size / 100,
      size * 20,
    );
    const target: THREE.Vector3 = new THREE.Vector3(0, centre.y, 0);
    camera.position
      .copy(target)
      .add(new THREE.Vector3(0.62, 0.45, 0.66).normalize().multiplyScalar(size * 1.9));
    camera.lookAt(target);

    return {
      scene,
      camera,
      turn: (radians: number): void => {
        pivot.rotation.y = radians;
      },
      dispose: (): void =>
        model.object.traverse((node: THREE.Object3D): void => {
          if (!(node instanceof THREE.Mesh)) return;
          node.geometry.dispose();
          for (const material of [node.material].flat())
            (material as THREE.Material).dispose();
        }),
    };
  }
}
