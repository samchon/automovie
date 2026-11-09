import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

import type { IStudentProfile } from "./IStudentProfile";
import type { StudentBody } from "./StudentBody";
import { StudentPolygon } from "./StudentPolygon";
import { StudentUniform } from "./StudentUniform";

/**
 * A student's displayed figure, the production's block mannequin: rigid
 * segments between the solved joints (pelvis, trunk, neck, head, upper arms,
 * forearms, hands, thighs, shins, feet) dressed in the coarse uniform layers
 * of the settings (white collar, house tie, charcoal knit with its house
 * band, open black robe with house lining and crest, sleeves to the wrist,
 * skirt with black tights or charcoal trousers, black shoes), the hair shape
 * and, for Harry, round glasses, all as rigid attachments to the segment
 * frames. It draws what the body solves and decides nothing.
 *
 * ```ts
 * const figure = new StudentFigure(student.profile, body);
 * scene.add(figure.object);
 * figure.place(body.solve(posture), { riding: false });
 * ```
 *
 * @evidence docs/body/settings/world/hogwarts.md#uniform-grammar Every layer and its colour, at coarse detail, leaving hands, knees and feet visible.
 * @evidence docs/body/settings/cast/carina-malfoy.md#recognition Pale hair mass, fair skin.
 * @evidence docs/body/settings/cast/carina-malfoy.md#riding-state Robe panels tucked and hair tied for flight.
 * @evidence docs/body/settings/cast/harry-potter.md#recognition Untidy black hair and round glasses as two rings and a bridge.
 * @evidence docs/body/settings/crowds/practice-teams.md#players Each player's hair and skin.
 * @evidence contracts/development/entities.md#settings-realization Colours and layers from the records; segment sizes from the body's lengths.
 * @evidence contracts/development/entities.md#object-shape A fragment that owns its meshes and reads a solved body; no other entity is imported.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns its geometries and materials until `dispose`.
 * @evidence contracts/development/common.md#meaningful-documentation States what is drawn and what it decides.
 */
export class StudentFigure {
  /** The figure's root, at the world origin: segments are placed in world metres. */
  public readonly object: THREE.Group = new THREE.Group();

  private readonly uniform: StudentUniform;

  private readonly polygon: StudentPolygon;

  /**
   * Build the figure: the Human polygon body, with the uniform, hair and
   * glasses layers over it.
   *
   * @param profile The student's record.
   * @param body The student's skeleton, for segment sizes.
   */
  public constructor(profile: IStudentProfile, body: StudentBody) {
    this.polygon = new StudentPolygon(profile);
    this.uniform = new StudentUniform(profile, body);
    this.uniform.hideSkin();
    this.object.add(this.polygon.object, this.uniform.object);
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
   * @param state Whether the uniform is in its riding state and whether the figure is shown.
   */
  public place(joints: StudentBody.IJoints, state: { riding: boolean; visible?: boolean }): void {
    this.object.visible = state.visible ?? true;
    this.polygon.place(joints);
    this.uniform.place(joints, state.riding);
    this.object.updateMatrixWorld(true);
  }

  /** Release the figure. */
  public dispose(): void {
    this.polygon.dispose();
    this.uniform.dispose();
    this.object.removeFromParent();
  }
}

function vec(p: IAutoMovieVector3): THREE.Vector3 {
  return new THREE.Vector3(p.x, p.y, p.z);
}
