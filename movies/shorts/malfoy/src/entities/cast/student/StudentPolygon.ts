import type { AutoMovieHumanSkeleton } from "@automovie/human";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { createAutoMovieHumanPolygonFigure } from "@automovie/viewer/human-polygon";
import * as THREE from "three";

import type { IStudentProfile } from "./IStudentProfile";
import type { StudentBody } from "./StudentBody";
import { StudentHuman } from "./StudentHuman";

/**
 * A student's Human polygon figure posed from the production's solved joints:
 * each mapped bone turns from its neutral direction onto the solved segment
 * (upper arm shoulder→elbow, forearm elbow→wrist, hand wrist→hand, thigh
 * hip→knee, shin knee→ankle, foot ankle→toe; trunk, neck and head by their
 * solved frames). Only the hips sit on the solved pelvis; every other bone
 * hangs from its parent by the Human body's own offset, so the figure stays
 * joined, and every unmapped bone (fingers, toes, eyes, jaw) moves rigidly
 * with its parent.
 *
 * ```ts
 * const polygon = new StudentPolygon(profile);
 * polygon.place(body.solve(posture));
 * ```
 *
 * @evidence docs/body/settings/cast/carina-malfoy.md#recognition Her skin colour on the Human body.
 * @evidence docs/body/settings/cast/harry-potter.md#recognition His skin colour on the Human body.
 * @evidence contracts/development/entities.md#object-shape A fragment of `StudentFigure` that owns its polygon figure.
 * @evidence contracts/development/common.md#meaningful-documentation States the bone mapping and what moves rigidly.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns its polygon figure until `dispose`.
 */
export class StudentPolygon {
  /** The polygon figure's root, scaled to the student's stature. */
  public readonly object: THREE.Group;

  private readonly figure: ReturnType<typeof createAutoMovieHumanPolygonFigure>;

  private readonly human: StudentHuman.IHuman;

  private readonly forward: THREE.Vector3;

  /**
   * Build the figure.
   *
   * @param profile The student's record.
   */
  public constructor(profile: IStudentProfile) {
    this.human = StudentHuman.of(profile);
    const neutral: AutoMovieHumanSkeleton.IOutput = this.human.neutral;
    this.figure = createAutoMovieHumanPolygonFigure({
      evaluate: (): AutoMovieHumanSkeleton.IOutput => neutral,
      partColors: Object.fromEntries(
        neutral.bones.map((b: AutoMovieHumanSkeleton.IBone): [string, number] => [b.bone, dressed(b.bone, profile)]),
      ),
    });
    this.object = this.figure.object;
    this.object.scale.setScalar(this.human.scale);
    const at = (bone: string): THREE.Vector3 => position(neutral, bone) ?? new THREE.Vector3();
    const left: THREE.Vector3 = at("leftUpperLeg").sub(at("rightUpperLeg")).normalize();
    this.forward = new THREE.Vector3().crossVectors(left, UP).normalize();
  }

  /** The polygon drawing's group of a bone, which `place` poses; children ride the bone. */
  public bone(name: string): THREE.Group | undefined {
    return this.figure.drawing.bones.get(name);
  }

  /** A bone's neutral world placement (template metres), the pose its group's children are fitted in. */
  public rest(name: string): { position: THREE.Vector3; rotation: THREE.Quaternion } | undefined {
    const p: AutoMovieHumanSkeleton.IPlacement | undefined = this.human.neutral.posed.find(
      (placement: AutoMovieHumanSkeleton.IPlacement): boolean => placement.bone === name,
    );
    return p === undefined
      ? undefined
      : { position: new THREE.Vector3(...p.position), rotation: new THREE.Quaternion(...p.rotation) };
  }

  /** The neutral body's forward direction. */
  public facing(): THREE.Vector3 {
    return this.forward.clone();
  }

  /**
   * Pose the figure from solved joints.
   *
   * @param j The solved body.
   */
  public place(j: StudentBody.IJoints): void {
    const neutral: AutoMovieHumanSkeleton.IOutput = this.human.neutral;
    const s: number = this.human.scale;
    const index: Map<string, number> = new Map(neutral.bones.map((b: AutoMovieHumanSkeleton.IBone, i: number): [string, number] => [b.bone, i]));
    const n = (bone: string): THREE.Vector3 | undefined => position(neutral, bone);
    const target = (bone: string): { dir: IAutoMovieVector3; ref: IAutoMovieVector3; neutralDir: THREE.Vector3; neutralRef: THREE.Vector3; anchor?: IAutoMovieVector3 } | undefined => {
      const side: "left" | "right" = bone.startsWith("left") ? "left" : "right";
      const arm: StudentBody.IArm = j.arms[side];
      const leg: StudentBody.ILeg = j.legs[side];
      const between = (a: string, b: string, fallback: THREE.Vector3): THREE.Vector3 => {
        const pa: THREE.Vector3 | undefined = n(a);
        const pb: THREE.Vector3 | undefined = n(b);
        return pa && pb ? pb.clone().sub(pa) : fallback.clone();
      };
      const down: THREE.Vector3 = new THREE.Vector3(0, -1, 0);
      switch (bone) {
        case "hips":
          return { dir: j.frame.up, ref: j.frame.forward, neutralDir: UP, neutralRef: this.forward, anchor: j.pelvis };
        case "spine":
        case "chest":
        case "upperChest":
        case "leftShoulder":
        case "rightShoulder":
          return { dir: j.trunk.up, ref: j.trunk.forward, neutralDir: UP, neutralRef: this.forward };
        case "neck":
          // The neck's base sits on the solved shoulder line, so the head above it lands where the body solved it.
          return { dir: j.trunk.up, ref: j.trunk.forward, neutralDir: UP, neutralRef: this.forward, anchor: j.chest };
        case "head": {
          // The head joint lies between the ears, just below the solved head centre that face touches and meets aim at.
          const centre: IAutoMovieVector3 = j.headCentre;
          const anchor: IAutoMovieVector3 = { x: centre.x - j.head.up.x * 0.03, y: centre.y - j.head.up.y * 0.03, z: centre.z - j.head.up.z * 0.03 };
          return { dir: j.head.up, ref: j.head.forward, neutralDir: UP, neutralRef: this.forward, anchor };
        }
        case "leftUpperArm":
        case "rightUpperArm":
          return { dir: sub(arm.elbow, arm.shoulder), ref: j.trunk.forward, neutralDir: between(bone, `${side}LowerArm`, down), neutralRef: this.forward, anchor: arm.shoulder };
        case "leftLowerArm":
        case "rightLowerArm":
          return { dir: sub(arm.wrist, arm.elbow), ref: j.trunk.forward, neutralDir: between(bone, `${side}Hand`, down), neutralRef: this.forward, anchor: arm.elbow };
        case "leftHand":
        case "rightHand":
          return { dir: sub(arm.hand, arm.wrist), ref: j.trunk.forward, neutralDir: between(`${side}LowerArm`, bone, down), neutralRef: this.forward, anchor: arm.wrist };
        case "leftUpperLeg":
        case "rightUpperLeg":
          return { dir: sub(leg.knee, leg.hip), ref: j.frame.forward, neutralDir: between(bone, `${side}LowerLeg`, down), neutralRef: this.forward, anchor: leg.hip };
        case "leftLowerLeg":
        case "rightLowerLeg":
          return { dir: sub(leg.ankle, leg.knee), ref: j.frame.forward, neutralDir: between(bone, `${side}Foot`, down), neutralRef: this.forward, anchor: leg.knee };
        case "leftFoot":
        case "rightFoot":
          return { dir: sub(leg.toe, leg.ankle), ref: j.frame.up, neutralDir: between(bone, `${side}Toes`, this.forward), neutralRef: UP, anchor: leg.ankle };
        default:
          return undefined;
      }
    };

    // World turn from the neutral pose per bone, then positions from the root down.
    const turns: THREE.Quaternion[] = [];
    const posed: AutoMovieHumanSkeleton.IPlacement[] = [];
    const positions: THREE.Vector3[] = [];
    neutral.bones.forEach((bone: AutoMovieHumanSkeleton.IBone, i: number): void => {
      const parent: number | undefined = bone.parent === null ? undefined : index.get(bone.parent);
      const t = target(bone.bone);
      const inherited: THREE.Quaternion = parent === undefined ? new THREE.Quaternion() : turns[parent]!.clone();
      let turn: THREE.Quaternion =
        t === undefined
          ? inherited
          : new THREE.Quaternion().setFromRotationMatrix(
              basis(vec(t.dir), vec(t.ref)).multiply(basis(t.neutralDir, t.neutralRef).invert()),
            );

      // A degenerate segment (zero length, or a non-finite solved joint) keeps its parent's turn, so the drawing always receives unit rotations.
      if (![turn.x, turn.y, turn.z, turn.w].every(Number.isFinite) || turn.lengthSq() < 0.5) turn = inherited;
      turn.normalize();
      turns[i] = turn;
      const own: THREE.Vector3 = n(bone.bone)!;

      // Only the root sits on the solved pelvis; every other bone hangs from its
      // parent by the Human body's own offset, so segments stay joined however the
      // solved joints' spacing differs from the Human proportions.
      let at: THREE.Vector3;
      if (parent === undefined) at = vec(t?.anchor ?? j.pelvis).divideScalar(s);
      else at = positions[parent]!.clone().add(own.clone().sub(n(neutral.bones[parent]!.bone)!).applyQuaternion(turns[parent]!));
      if (![at.x, at.y, at.z].every(Number.isFinite))
        at = parent === undefined ? own.clone() : positions[parent]!.clone().add(own.clone().sub(n(neutral.bones[parent]!.bone)!));
      positions[i] = at;
      const rest: AutoMovieHumanSkeleton.IPlacement = neutral.posed[i]!;
      const q: THREE.Quaternion = turn.clone().multiply(new THREE.Quaternion(...rest.rotation)).normalize();
      posed.push({ bone: bone.bone, position: [at.x, at.y, at.z], rotation: [q.x, q.y, q.z, q.w] });
    });
    this.figure.place({ posed });
  }

  /** Release the figure. */
  public dispose(): void {
    this.figure.dispose();
    this.object.removeFromParent();
  }
}

/** World up. */
const UP: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

/** A bone's drawn colour: skin on the head, neck and hands, black shoes and legs, the house colour (Slytherin green, Gryffindor red) on the trunk and arms. */
function dressed(bone: string, profile: IStudentProfile): number {
  if (/Foot|Toe/u.test(bone)) return 0x0c0c0c;
  if (/UpperLeg$|LowerLeg$/u.test(bone)) return 0x1a1a1c;
  if (/^(head|neck|jaw)$|Eye$|Hand$|Thumb|Index|Middle|Ring|Little/u.test(bone)) return profile.skin;
  return profile.house === "slytherin" ? 0x1d5e3a : 0x8e1c22;
}

/** A bone's neutral world position. */
function position(neutral: AutoMovieHumanSkeleton.IOutput, bone: string): THREE.Vector3 | undefined {
  const p: AutoMovieHumanSkeleton.IPlacement | undefined = neutral.posed.find(
    (placement: AutoMovieHumanSkeleton.IPlacement): boolean => placement.bone === bone,
  );
  return p === undefined ? undefined : new THREE.Vector3(...p.position);
}

/** A rotation basis whose Y runs along `dir` and Z toward `ref`. */
function basis(dir: THREE.Vector3, ref: THREE.Vector3): THREE.Matrix4 {
  const y: THREE.Vector3 = dir.clone().normalize();
  let z: THREE.Vector3 = ref.clone().sub(y.clone().multiplyScalar(ref.dot(y)));
  if (z.lengthSq() < 1e-8) z = new THREE.Vector3(1, 0, 0).sub(y.clone().multiplyScalar(y.x));
  if (z.lengthSq() < 1e-8) z = new THREE.Vector3(0, 0, 1).sub(y.clone().multiplyScalar(y.z));
  z.normalize();
  const x: THREE.Vector3 = new THREE.Vector3().crossVectors(y, z).normalize();
  return new THREE.Matrix4().makeBasis(x, y, z);
}

function vec(p: IAutoMovieVector3): THREE.Vector3 {
  return new THREE.Vector3(p.x, p.y, p.z);
}

function sub(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
