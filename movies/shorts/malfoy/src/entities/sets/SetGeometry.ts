import * as THREE from "three";

import type { IStageSet } from "./IStageSet";

/**
 * A small builder of coarse set scenery: boxes, cylinders, tori and planes in
 * flat matte colours under one group, with every geometry and material it
 * creates released together. Sets describe their dressing with it so their
 * own files hold only dimensions from the settings.
 *
 * ```ts
 * const g = new SetGeometry();
 * g.box([8, 0.02, 6], [0, -0.01, 0], 0x6f6f6c); // a floor slab
 * return g.done();
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it builds and owns.
 * @evidence contracts/development/design.md#principled-representation Sizes and centres in world metres; colours as RGB integers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The four primitives the sets use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No set is named.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder owns every geometry and material it makes until `dispose`.
 */
export class SetGeometry {
  /** The scenery's root. */
  public readonly object: THREE.Group = new THREE.Group();

  private readonly owned: { dispose(): void }[] = [];

  private readonly materials: Map<string, THREE.Material> = new Map();

  /** A matte material of a colour, shared within the builder. */
  public material(color: number, options: { opacity?: number; emissive?: number } = {}): THREE.Material {
    const key: string = `${color}/${options.opacity ?? 1}/${options.emissive ?? 0}`;
    const existing: THREE.Material | undefined = this.materials.get(key);
    if (existing) return existing;
    const made: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.92,
      metalness: 0,
      ...(options.opacity === undefined ? {} : { transparent: true, opacity: options.opacity, depthWrite: false }),
      ...(options.emissive === undefined ? {} : { emissive: options.emissive }),
    });
    this.materials.set(key, made);
    this.owned.push(made);
    return made;
  }

  /** A box of size [x, y, z] centred at a point. */
  public box(size: [number, number, number], center: [number, number, number], color: number, parent: THREE.Object3D = this.object): THREE.Mesh {
    const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(...size);
    this.owned.push(geometry);
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, this.material(color));
    mesh.position.set(...center);
    parent.add(mesh);
    return mesh;
  }

  /** A vertical cylinder of a radius and height whose base centre is a point. */
  public cylinder(radius: number, height: number, base: [number, number, number], color: number, parent: THREE.Object3D = this.object): THREE.Mesh {
    const geometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, 12);
    this.owned.push(geometry);
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, this.material(color));
    mesh.position.set(base[0], base[1] + height / 2, base[2]);
    parent.add(mesh);
    return mesh;
  }

  /** A ring of an inner radius and a tube radius, centred at a point, its axis along X. */
  public ring(radius: number, tube: number, center: [number, number, number], color: number, parent: THREE.Object3D = this.object): THREE.Mesh {
    const geometry: THREE.TorusGeometry = new THREE.TorusGeometry(radius + tube, tube, 8, 28);
    this.owned.push(geometry);
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, this.material(color));
    mesh.position.set(...center);
    mesh.rotation.y = Math.PI / 2;
    parent.add(mesh);
    return mesh;
  }

  /** A flat elliptical disc on the ground of semi-axes along X and Z. */
  public oval(halfX: number, halfZ: number, y: number, color: number): THREE.Mesh {
    const geometry: THREE.CircleGeometry = new THREE.CircleGeometry(1, 48);
    this.owned.push(geometry);
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, this.material(color));
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.set(halfX, halfZ, 1);
    mesh.position.y = y;
    this.object.add(mesh);
    return mesh;
  }

  /** The finished figure. */
  public done(): IStageSet.IFigure {
    return {
      object: this.object,
      dispose: (): void => {
        for (const o of this.owned) o.dispose();
        this.object.removeFromParent();
      },
    };
  }
}
