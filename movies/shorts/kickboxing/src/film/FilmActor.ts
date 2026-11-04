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
    this.person.dispose();
  }
}
