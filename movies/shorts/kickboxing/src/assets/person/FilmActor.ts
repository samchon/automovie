import type {
  AutoMovieHumanSkeleton,
  IAutoMovieHumanParameters,
  IAutoMovieHumanPose,
} from "@automovie/human";
import * as THREE from "three";

import type { BodyRig } from "../../motion/rig/BodyRig";
import { Vec3 } from "../../motion/rig/Vec3";
import { InspectionPerson } from "./InspectionPerson";
import { addInspectionGloves } from "./addInspectionGloves";
import { addInspectionOutfit } from "./addInspectionOutfit";

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

  /** Last applied flush levels (quantized), so the palette is rebuilt only on change. */
  private flushKey: string = "0,0,0";

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
   * @evidence contracts/common.md#implementation-and-ownership Writes the group transform, then the pose through the shared evaluator. A wince draws as squeezed eyelids and lowered brows on the cartoon face, quantized to tenths so the face is rebuilt only when it visibly changes.
   * @evidence contracts/common.md#authoring-interface World metres and a unit quaternion; clinical degrees; wince in [0, 1].
   */
  public place(
    root: BodyRig.Placement,
    pose: IAutoMovieHumanPose,
    wince: number = 0,
  ): void {
    this.person.object.position.set(...root.position);
    this.person.object.quaternion.set(...root.rotation);
    const w: number = Math.round(Math.max(0, Math.min(1, wince)) * 10) / 10;
    this.person.pose(
      pose,
      w > 0
        ? {
            units: [
              { unit: "eyesClosed", intensity: w, side: "both" },
              { unit: "lidTightener", intensity: w, side: "both" },
              { unit: "browLowerer", intensity: w, side: "both" },
            ],
          }
        : undefined,
    );
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
   * Redden struck skin: the face (head and neck) and each side of the trunk.
   *
   * @evidence contracts/common.md#implementation-and-ownership Mixes the base skin toward a bruised red on the head and neck by the face flush and on the chest and spine by the trunk flush; levels are quantized to eighths so the palette (which allocates materials) is rebuilt only when the colour visibly steps.
   * @evidence contracts/common.md#authoring-interface Flush values in [0, 1] from ImpactEffects.flush.
   */
  public bruise(flush: { face: number; left: number; right: number }): void {
    const step = (value: number): number =>
      Math.round(Math.max(0, Math.min(1, value)) * 8) / 8;
    const face: number = step(flush.face);
    const trunk: number = step((flush.left + flush.right) / 2);
    const key: string = `${face},${trunk}`;
    if (key === this.flushKey) return;
    this.flushKey = key;
    const base: Record<string, number> = this.person.palette;
    const colors: Record<string, number> = { ...base };
    const mix = (color: number, amount: number): number => {
      const from: THREE.Color = new THREE.Color(color);
      return from.lerp(new THREE.Color(BRUISE), amount).getHex();
    };
    for (const bone of ["head", "neck"])
      if (bone in base)
        colors[bone] = mix(base[bone]!, (bone === "head" ? 0.42 : 0.25) * face);
    for (const bone of ["chest", "spine"])
      if (bone in base) colors[bone] = mix(base[bone]!, 0.32 * trunk);
    this.person.drawing.setPartColors(colors);
  }

  /**
   * Flatten a glove against what it hit.
   *
   * @evidence contracts/common.md#implementation-and-ownership Scales the glove mesh shorter along the forearm and wider across it, keeping its volume roughly constant.
   * @evidence contracts/common.md#authoring-interface Squash in [0, 1]; 0 restores the glove.
   */
  public squash(side: "left" | "right", amount: number): void {
    const glove: THREE.Object3D | undefined =
      this.person.object.getObjectByName(`${side}-glove`);
    if (!glove) return;
    const k: number = Math.max(0, Math.min(1, amount));
    glove.scale.set(
      0.105 * (1 - 0.3 * k),
      0.095 * (1 + 0.15 * k),
      0.095 * (1 + 0.15 * k),
    );
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

/** Bruised skin colour struck skin flushes toward. */
const BRUISE: number = 0x9c2f36;
