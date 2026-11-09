import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

import type { IStudentProfile } from "./IStudentProfile";
import type { StudentBody } from "./StudentBody";
import { StudentPolygon } from "./StudentPolygon";

/**
 * A student's displayed figure: the bare Human polygon body with its rig
 * points and lines, posed from the solved joints. It wears no costume, hair
 * or glasses; the figure is a pose and motion hint, and appearance comes
 * from reference images at diffusion. It draws what the body solves and
 * decides nothing.
 *
 * ```ts
 * const figure = new StudentFigure(student.profile);
 * scene.add(figure.object);
 * figure.place(body.solve(posture));
 * ```
 *
 * @evidence contracts/development/entities.md#object-shape A fragment that owns its polygon and reads a solved body; no other entity is imported.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns its polygon until `dispose`.
 * @evidence contracts/development/common.md#meaningful-documentation States what is drawn and what it decides.
 */
export class StudentFigure {
  /** The figure's root, at the world origin: segments are placed in world metres. */
  public readonly object: THREE.Group = new THREE.Group();

  private readonly polygon: StudentPolygon;

  /**
   * Build the figure: the bare Human polygon body.
   *
   * @param profile The student's record.
   */
  public constructor(profile: IStudentProfile) {
    this.polygon = new StudentPolygon(profile);
    this.object.add(this.polygon.object);
  }

  /** The world placement of a hand's centre and its frame (forward along the fingers, up out of the back of the hand), for props. */
  public hand(joints: StudentBody.IJoints, side: "left" | "right"): { point: IAutoMovieVector3; quaternion: THREE.Quaternion } {
    const arm: StudentBody.IArm = joints.arms[side];
    const along: THREE.Vector3 = vec(arm.hand).sub(vec(arm.wrist)).normalize();
    const palm: THREE.Vector3 = vec(arm.palm).normalize();
    const back: THREE.Vector3 = palm.clone().negate();
    const right: THREE.Vector3 = new THREE.Vector3().crossVectors(along, back).normalize();
    const up: THREE.Vector3 = new THREE.Vector3().crossVectors(right, along).normalize();
    const m: THREE.Matrix4 = new THREE.Matrix4().makeBasis(along, up, right);
    return { point: arm.hand, quaternion: new THREE.Quaternion().setFromRotationMatrix(m) };
  }

  /**
   * Draw one instant.
   *
   * @param joints The solved body.
   * @param visible Whether the figure is shown.
   */
  public place(joints: StudentBody.IJoints, visible: boolean = true): void {
    this.object.visible = visible;
    this.polygon.place(joints);
    this.object.updateMatrixWorld(true);
  }

  /** Release the figure. */
  public dispose(): void {
    this.polygon.dispose();
    this.object.removeFromParent();
  }
}

function vec(p: IAutoMovieVector3): THREE.Vector3 {
  return new THREE.Vector3(p.x, p.y, p.z);
}
