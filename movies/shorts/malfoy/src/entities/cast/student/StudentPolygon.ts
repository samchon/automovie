import type { AutoMovieHumanSkeleton } from "@automovie/human";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  type AutoMovieHumanPolygon,
  buildHumanPolygon,
} from "@automovie/render";
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
 * with its parent. The figure is the bare polygon body, without a face.
 *
 * Human faces +X with its left-named bones on +Z, which in a right-handed
 * world is the figure's right side: the front is up × (left-named side), the
 * direction of its eyes and toes, and each left-named limb is posed from the
 * solved right limb, so face, chest and every limb land where they were solved.
 *
 * Two of the Human skeleton's girths are corrected for display: the chest
 * radius is read at the trunk's top (the neck base), so the torso would pinch
 * above the waist, and the finger girths run from a palm-sized base to a
 * needle, so a hand would read as a lump. The chest takes the hip girth (an
 * adult chest circumference is about the hip's),
 * every digit is a plain sausage of a fixed share of the hand's radius, and
 * the four fingers fan apart about the palm so each stays distinct.
 *
 * ```ts
 * const polygon = new StudentPolygon(profile);
 * polygon.place(body.solve(posture));
 * ```
 *
 * @evidence contracts/development/entities.md#object-shape A fragment of `StudentFigure` that owns its polygon figure.
 * @evidence contracts/development/common.md#meaningful-documentation States the bone mapping and what moves rigidly.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns its polygon figure until `dispose`.
 */
export class StudentPolygon {
  /** The polygon figure's root, scaled to the student's stature. */
  public readonly object: THREE.Group;

  private readonly drawing: AutoMovieHumanPolygon.IDrawing;

  private readonly human: StudentHuman.IHuman;

  private readonly forward: THREE.Vector3;

  /** Fan turns of the four fingers' proximal bones, neutral frame. */
  private readonly fans: Map<string, THREE.Quaternion>;

  /** Rig points on every bone's joint, shown by default. */
  private readonly rigPoints: THREE.Points;

  /** Rig lines from every bone to its parent, shown by default. */
  private readonly rigLines: THREE.LineSegments;

  /**
   * Build the figure.
   *
   * @param profile The student's record.
   */
  public constructor(profile: IStudentProfile) {
    this.human = StudentHuman.of(profile);
    const neutral: AutoMovieHumanSkeleton.IOutput = this.human.neutral;
    this.drawing = buildHumanPolygon(StudentPolygon.displayed(neutral));
    this.object = this.drawing.object;
    this.object.scale.setScalar(this.human.scale);

    // The rig shows by default: a point on every bone's joint and a line to its parent, over the surface.
    const count: number = neutral.bones.length;
    this.rigPoints = new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3)),
      new THREE.PointsMaterial({ color: 0xff2d6f, size: 7, sizeAttenuation: false, depthTest: false }),
    );
    this.rigLines = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 6), 3)),
      new THREE.LineBasicMaterial({ color: 0xffe14d, depthTest: false }),
    );
    this.rigPoints.renderOrder = 11;
    this.rigLines.renderOrder = 10;
    this.object.add(this.rigLines, this.rigPoints);
    const at = (bone: string): THREE.Vector3 => position(neutral, bone) ?? new THREE.Vector3();
    const named: THREE.Vector3 = at("leftUpperLeg").sub(at("rightUpperLeg")).normalize();
    this.forward = new THREE.Vector3().crossVectors(UP, named).normalize();

    // Each finger's fan turn about its palm's normal, in the neutral frame.
    this.fans = new Map();
    for (const side of ["left", "right"] as const) {
      const hand: THREE.Vector3 = at(`${side}Hand`);
      const index: THREE.Vector3 = at(`${side}IndexProximal`);
      const little: THREE.Vector3 = at(`${side}LittleProximal`);
      const along: THREE.Vector3 = index.clone().add(little).multiplyScalar(0.5).sub(hand);
      const normal: THREE.Vector3 = new THREE.Vector3().crossVectors(along, index.clone().sub(little)).normalize();
      FAN.forEach((angle: number, digit: string): void => {
        this.fans.set(`${side}${digit}Proximal`, new THREE.Quaternion().setFromAxisAngle(normal, angle));
      });
    }
  }

  /** The polygon drawing's group of a bone, which `place` poses; children ride the bone. */
  public bone(name: string): THREE.Group | undefined {
    return this.drawing.bones.get(name);
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
      // `side` names the Human bones; the left-named limb lies on the figure's right.
      const side: "left" | "right" = bone.startsWith("left") ? "left" : "right";
      const solved: "left" | "right" = side === "left" ? "right" : "left";
      const arm: StudentBody.IArm = j.arms[solved];
      const leg: StudentBody.ILeg = j.legs[solved];
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
      const fan: THREE.Quaternion | undefined = this.fans.get(bone.bone);
      if (fan !== undefined) turn = turn.clone().multiply(fan);
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
    this.drawing.setPose({ posed });

    // The rig follows the same posed joints the surface was placed from.
    const points: THREE.BufferAttribute = this.rigPoints.geometry.getAttribute("position") as THREE.BufferAttribute;
    const lines: THREE.BufferAttribute = this.rigLines.geometry.getAttribute("position") as THREE.BufferAttribute;
    neutral.bones.forEach((bone: AutoMovieHumanSkeleton.IBone, i: number): void => {
      const at: THREE.Vector3 = positions[i]!;
      const parent: number | undefined = bone.parent === null ? undefined : index.get(bone.parent);
      const from: THREE.Vector3 = parent === undefined ? at : positions[parent]!;
      points.setXYZ(i, at.x, at.y, at.z);
      lines.setXYZ(i * 2, from.x, from.y, from.z);
      lines.setXYZ(i * 2 + 1, at.x, at.y, at.z);
    });
    points.needsUpdate = true;
    lines.needsUpdate = true;
    this.rigPoints.geometry.computeBoundingSphere();
    this.rigLines.geometry.computeBoundingSphere();
  }

  /** Release the figure. */
  public dispose(): void {
    for (const rig of [this.rigPoints, this.rigLines]) {
      rig.geometry.dispose();
      (rig.material as THREE.Material).dispose();
    }
    this.drawing.dispose();
    this.object.removeFromParent();
  }
}

export namespace StudentPolygon {
  /**
   * The neutral body with display girths: the chest at the hip girth and
   * every digit a sausage of a fixed share of its hand's radius (thumb 0.36,
   * finger proximal 0.3, intermediate 0.27, distal 0.24).
   *
   * @param neutral The Human neutral body.
   * @returns A copy with corrected radii.
   */
  export function displayed(neutral: AutoMovieHumanSkeleton.IOutput): AutoMovieHumanSkeleton.IOutput {
    const radius = (name: string): number => neutral.bones.find((b: AutoMovieHumanSkeleton.IBone): boolean => b.bone === name)!.radius;
    return {
      ...neutral,
      bones: neutral.bones.map((b: AutoMovieHumanSkeleton.IBone): AutoMovieHumanSkeleton.IBone => {
        if (b.bone === "chest") return { ...b, radius: Math.max(b.radius, radius("hips")) };
        const digit: RegExpExecArray | null = /^(left|right)(Thumb|Index|Middle|Ring|Little)(Metacarpal|Proximal|Intermediate|Distal)$/u.exec(b.bone);
        if (digit === null) return b;
        const hand: number = radius(`${digit[1]}Hand`);
        const share: number = digit[2] === "Thumb" ? 0.36 : digit[3] === "Proximal" ? 0.3 : digit[3] === "Intermediate" ? 0.27 : 0.24;
        return { ...b, radius: hand * share };
      }),
    };
  }
}

/** Fan angles of the four fingers about the palm normal, radians: index and little splay outward. */
const FAN: ReadonlyMap<string, number> = new Map([
  ["Index", 0.2],
  ["Middle", 0.07],
  ["Ring", -0.07],
  ["Little", -0.2],
]);

/** World up. */
const UP: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

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
