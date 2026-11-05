import type {
  AutoMovieHumanSkeleton,
  IAutoMovieHumanParameters,
  IAutoMovieHumanPose,
} from "@automovie/human";
import * as THREE from "three";

import { InspectionPerson } from "../InspectionPerson";
import { addInspectionGloves } from "../addInspectionGloves";
import { addInspectionOutfit } from "../addInspectionOutfit";
import type { BodyRig } from "../rig/BodyRig";
import { Vec3 } from "../rig/Vec3";

/**
 * One displayed performer: the original Human polygon, its equipment and its world placement.
 *
 * @evidence contracts/common.md#implementation-and-ownership Borrows the BodyRig's prepared evaluator so the display and the solver share one FK. Placement writes the actor group's position and quaternion, then the pose; world positions read back from the same FK output, so contact measurement sees exactly what is drawn.
 * @evidence contracts/common.md#authoring-interface Root placement in world metres and a unit quaternion; pose in clinical degrees. `dispose` removes the group and frees owned geometry and materials.
 */
export class FilmActor {
  /** Displayed figure. */
  public readonly person: InspectionPerson;

  /** Equipment and garment disposers. */
  private readonly equipment: (() => void)[] = [];

  /** Review overlay of joint points and parent–child sticks; absent unless requested. */
  private skeleton?: {
    points: THREE.Points;
    sticks: THREE.LineSegments;
    pairs: readonly (readonly [string, string])[];
  };

  public constructor(
    public readonly id: "a" | "b" | "referee",
    public readonly rig: BodyRig,
    parameters: IAutoMovieHumanParameters,
  ) {
    const skin: number =
      id === "a" ? 0xb07a58 : id === "b" ? 0x6b4a36 : 0xc99b7c;
    this.person = new InspectionPerson(parameters, skin, rig.evaluate);
    this.equipment.push(addInspectionOutfit(this.person, id));
    if (id !== "referee")
      this.equipment.push(
        addInspectionGloves(this.person, id === "a" ? 0xd8262f : 0x2ad0dc),
      );
    this.person.object.traverse((object: THREE.Object3D): void => {
      if (object instanceof THREE.Mesh) object.castShadow = true;
    });
  }

  /**
   * Apply a solved pose at a root placement.
   *
   * @evidence contracts/common.md#implementation-and-ownership Writes the group transform, then the pose through the shared evaluator.
   * @evidence contracts/common.md#authoring-interface World metres and a unit quaternion; clinical degrees.
   */
  public place(root: BodyRig.Placement, pose: IAutoMovieHumanPose): void {
    this.person.object.position.set(...root.position);
    this.person.object.quaternion.set(...root.rotation);
    this.person.pose(pose);
    if (this.skeleton) this.updateRig();
  }

  /**
   * Draw the skeleton over the figure: a point at every joint and a stick from each
   * joint to its parent, always on top, for motion review.
   *
   * @evidence contracts/common.md#implementation-and-ownership Reads the same FK output the polygon is drawn from (body-frame joint placements under the actor group), so the sticks show exactly what the solver produced. One point cloud and one line set per actor, rewritten in place on every placement.
   * @evidence contracts/common.md#authoring-interface Idempotent; review-only, the delivered film never calls it. `dispose` frees it.
   */
  public showRig(): void {
    if (this.skeleton) return;
    const output: AutoMovieHumanSkeleton.IOutput = this.person.output;
    const pairs: (readonly [string, string])[] = output.bones
      .filter((bone) => bone.parent !== null)
      .map((bone) => [bone.parent!, bone.bone] as const);
    const overlay = (material: THREE.Material): THREE.Material => {
      material.depthTest = false;
      material.transparent = true;
      return material;
    };
    const points: THREE.Points = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(output.posed.length * 3), 3),
      ),
      overlay(
        new THREE.PointsMaterial({
          color: 0xffe14d,
          size: 5,
          sizeAttenuation: false,
        }),
      ),
    );
    const sticks: THREE.LineSegments = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(pairs.length * 6), 3),
      ),
      overlay(new THREE.LineBasicMaterial({ color: 0x7cff6b })),
    );
    for (const object of [points, sticks]) {
      object.renderOrder = 1000;
      object.frustumCulled = false;
      this.person.object.add(object);
    }
    this.skeleton = { points, sticks, pairs };
    this.updateRig();
  }

  /** Rewrite the overlay from the current FK output. */
  private updateRig(): void {
    const rig = this.skeleton!;
    const posed: Map<string, readonly number[]> = new Map(
      this.person.output.posed.map((placement) => [
        placement.bone,
        placement.position,
      ]),
    );
    const points = rig.points.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    this.person.output.posed.forEach((placement, index: number): void => {
      points.setXYZ(index, ...(placement.position as [number, number, number]));
    });
    points.needsUpdate = true;
    const sticks = rig.sticks.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    rig.pairs.forEach(([parent, child], index: number): void => {
      const from: readonly number[] = posed.get(parent) ?? [0, 0, 0];
      const to: readonly number[] = posed.get(child) ?? from;
      sticks.setXYZ(2 * index, from[0]!, from[1]!, from[2]!);
      sticks.setXYZ(2 * index + 1, to[0]!, to[1]!, to[2]!);
    });
    sticks.needsUpdate = true;
  }

  /**
   * World position of a bone of the current displayed pose.
   *
   * @evidence contracts/common.md#implementation-and-ownership Reads the current FK joint through the group's world matrix.
   * @evidence contracts/common.md#authoring-interface Exact Human bone id; world metres.
   */
  public point(bone: string): Vec3.Value {
    return this.person.point(bone);
  }

  /**
   * World centre of a glove (past the wrist along the forearm), metres.
   *
   * @evidence contracts/common.md#implementation-and-ownership Hand joint plus 6.5 cm along the forearm, matching the glove mesh offset.
   * @evidence contracts/common.md#authoring-interface World metres.
   */
  public glove(side: "left" | "right"): Vec3.Value {
    const hand: Vec3.Value = this.point(`${side}Hand`);
    const elbow: Vec3.Value = this.point(`${side}LowerArm`);
    return Vec3.add(
      hand,
      Vec3.scale(Vec3.normalize(Vec3.sub(hand, elbow)), 0.065),
    );
  }

  /**
   * Lowest point of the drawn body above the canvas, metres.
   *
   * @evidence contracts/common.md#implementation-and-ownership Each bone's joint is treated as a sphere of that segment's skin radius; the minimum over joints of (height − radius) bounds the body from below. It is a conservative proxy for the polygon surface, adequate to keep a fallen body on the canvas.
   * @evidence contracts/common.md#authoring-interface Uses the current pose; returns world metres.
   */
  public lowest(): number {
    const output: AutoMovieHumanSkeleton.IOutput = this.person.output;
    this.person.object.updateWorldMatrix(true, false);
    const matrix: THREE.Matrix4 = this.person.object.matrixWorld;
    const point: THREE.Vector3 = new THREE.Vector3();
    let lowest: number = Infinity;
    output.posed.forEach(
      (placement: AutoMovieHumanSkeleton.IPlacement, index: number): void => {
        const radius: number = output.bones[index]?.radius ?? 0;
        point.set(...placement.position).applyMatrix4(matrix);
        lowest = Math.min(lowest, point.y - Math.min(radius, 0.08));
      },
    );
    return lowest;
  }

  /**
   * Remove and free the actor.
   *
   * @evidence contracts/common.md#implementation-and-ownership Retires equipment, then the drawing.
   * @evidence contracts/common.md#authoring-interface The actor must not be used afterwards.
   */
  public dispose(): void {
    for (const dispose of this.equipment.splice(0)) dispose();
    if (this.skeleton)
      for (const object of [this.skeleton.points, this.skeleton.sticks]) {
        object.removeFromParent();
        object.geometry.dispose();
        (object.material as THREE.Material).dispose();
      }
    this.person.dispose();
  }
}
