import { solveTwoBoneIK } from "@automovie/engine";
import type {
  AutoMoviePrimitiveShape,
  IAutoMovieModel,
} from "@automovie/interface";
import { buildModel } from "@automovie/viewer";
import * as THREE from "three";

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Build a production primitive through the public model renderer.
 * @evidence contracts/common.md#implementation-and-ownership Meter-valued admitted primitives and linear color reach buildModel directly; the stage owns returned geometry/material disposal.
 * @evidence contracts/common.md#authoring-interface Shapes are centered on their local origin; callers own placement and lifetime, not the borrowed renderer.
 */
export function primitive(
  shape: AutoMoviePrimitiveShape,
  color: string,
): THREE.Group {
  const c = new THREE.Color(color);
  const model: IAutoMovieModel = {
    id: "primitive",
    name: null,
    origin: "generated",
    skeleton: null,
    body: null,
    asset: null,
    materials: [
      {
        id: "surface",
        name: null,
        baseColor: { r: c.r, g: c.g, b: c.b, a: 1, hex: null },
        metallic: 0,
        roughness: 0.88,
        opacity: 1,
        emissive: null,
        baseColorTexture: null,
      },
    ],
    parts: [
      {
        id: "surface",
        name: null,
        geometry: { type: "primitive", shape },
        material: "surface",
        attachedBone: null,
        transform: null,
      },
    ],
  };
  return buildModel(model).object;
}

/**
 * One intact articulated figure, with every part under the same pelvis frame.
 * @evidence contracts/common.md#implementation-and-ownership One point construction drives every rod and head; whole-body flight rotates the parent without detaching any part. The stage owns resources.
 * @evidence contracts/common.md#authoring-interface Local +X is forward, +Y up, +Z left; the pelvis sits .85 m above a flat support. Pose takes absolute seconds and optional hand targets in that local frame.
 */
export class Actor {
  readonly root = new THREE.Group();
  readonly head: THREE.Group;
  readonly limbs: THREE.Group[] = [];
  readonly points: THREE.Vector3[] = [];
  readonly shadow: THREE.Mesh;
  readonly clamped: string[] = [];
  constructor(
    readonly name: string,
    color = "#4775a3",
    marker = "",
  ) {
    this.head = primitive({ type: "sphere", radius: 0.145 }, "#eadac1");
    this.root.add(this.head);
    for (let i = 0; i < 11; i++) {
      const limb = primitive(
        { type: "cylinder", radius: i === 0 ? 0.065 : 0.038, height: 1 },
        color,
      );
      this.limbs.push(limb);
      this.root.add(limb);
    }
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.24, 20),
      new THREE.MeshBasicMaterial({
        color: "#181920",
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = -0.845;
    this.root.add(this.shadow);
    if (marker === "bicorn") {
      const hat = primitive(
        { type: "box", width: 0.12, height: 0.16, depth: 0.49 },
        "#1c2432",
      );
      hat.position.set(0, 1.02, 0);
      this.root.add(hat);
    }
    if (marker === "feather") {
      const plume = primitive(
        { type: "box", width: 0.07, height: 0.54, depth: 0.06 },
        "#fff8e9",
      );
      plume.position.set(0, 1.25, 0.08);
      plume.rotation.z = -0.15;
      this.root.add(plume);
    }
    if (marker === "hair") {
      const hair = primitive({ type: "sphere", radius: 0.151 }, "#946b40");
      hair.scale.y = 0.55;
      hair.position.set(-0.025, 0.96, 0);
      this.root.add(hair);
    }
    if (marker === "glasses") {
      for (const z of [-0.065, 0.065]) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.052, 0.01, 5, 16),
          new THREE.MeshBasicMaterial({ color: "#1f2029" }),
        );
        ring.rotation.y = Math.PI / 2;
        ring.position.set(0.14, 0.89, z);
        this.root.add(ring);
      }
    }
    this.pose(0);
  }
  /**
   * Evaluate the figure's complete local pose, independent of seek history.
   * @evidence contracts/common.md#implementation-and-ownership A single point set feeds rod transforms; feet use a stance/swing cycle and knees solve fixed-length two-segment reach. Hand targets drive contact poses.
   * @evidence contracts/common.md#authoring-interface mode selects the authored task; walk is seconds along a .85 s gait. hands are pelvis-local meter targets and remain attached to the same body in impacts.
   */
  pose(
    t: number,
    mode = "stand",
    hands?: [THREE.Vector3, THREE.Vector3],
  ): void {
    const walking = mode === "walk" || mode === "run" || mode === "carry-walk";
    const pace = mode === "run" ? 0.58 : 0.85;
    const angle = (t / pace) * Math.PI * 2;
    const pelvis = new THREE.Vector3(0, 0, 0);
    const shoulder = new THREE.Vector3(0, 0.59, 0);
    const neck = new THREE.Vector3(0, 0.76, 0);
    this.head.position.set(0, 0.89, 0);
    const pts = [pelvis, neck];
    this.clamped.length = 0;
    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? 1 : -1;
      const phase = (((t / pace + side * 0.5) % 1) + 1) % 1;
      const stride = 0.65 * pace * 0.6;
      const foot = new THREE.Vector3(
        walking
          ? phase < 0.6
            ? stride / 2 - (phase / 0.6) * stride
            : -stride / 2 + ((phase - 0.6) / 0.4) * stride
          : 0.035,
        -0.85 +
          (walking && phase > 0.6
            ? Math.sin(((phase - 0.6) / 0.4) * Math.PI) * 0.12
            : 0),
        sign * 0.12,
      );
      const hip = new THREE.Vector3(0, 0, sign * 0.105);
      if (mode === "sit" || mode === "ride" || mode === "press")
        foot.set(0.55, -0.42, sign * 0.24);
      if (mode === "press") {
        shoulder.y = 0.24;
        neck.y = 0.4;
        this.head.position.y = 0.53;
      }
      if (mode === "duck") {
        foot.x = 0.22;
        shoulder.y = 0.42;
        neck.y = 0.6;
        this.head.position.y = 0.73;
      }
      const knee = joint(hip, foot, 0.46, 0.46, new THREE.Vector3(1, 0, 0));
      if (knee.clamped) this.clamped.push(`leg-${side}`);
      pts.push(hip, knee.mid, knee.tip);
      const sh = shoulder.clone().add(new THREE.Vector3(0, 0, sign * 0.15));
      let hand = new THREE.Vector3(
        walking ? Math.sin(angle + side * Math.PI) * 0.2 : 0.04,
        0.02,
        sign * 0.25,
      );
      if (mode === "point") hand.set(0.58, 0.54, sign * 0.17);
      if (mode === "write")
        hand.set(
          0.46,
          0.34 + (side === 0 ? Math.sin(t * 12) * 0.018 : 0),
          sign * 0.14,
        );
      if (mode === "push") hand.set(0.55, 0.27, sign * 0.2);
      if (mode === "aim")
        hand.set(side === 0 ? 0.57 : 0.32, 0.53, sign * 0.055);
      if (mode === "cheer")
        hand.set(0.08, 1.2 + Math.sin(t * 5) * 0.04, sign * 0.36);
      if (mode === "carry" || mode === "carry-walk")
        hand.set(0.45, 0.23, sign * 0.18);
      if (hands) hand.copy(hands[side]);
      const elbow = joint(
        sh,
        hand,
        0.35,
        0.35,
        new THREE.Vector3(0.1, -0.3, sign),
      );
      if (elbow.clamped) this.clamped.push(`arm-${side}`);
      pts.push(sh, elbow.mid, elbow.tip);
    }
    this.points.splice(0, this.points.length, ...pts);
    const pairs = [
      [0, 1],
      [2, 3],
      [3, 4],
      [5, 6],
      [6, 7],
      [8, 9],
      [9, 10],
      [11, 12],
      [12, 13],
      [5, 11],
      [2, 8],
    ];
    pairs.forEach(([a, b], i) => rod(this.limbs[i]!, pts[a]!, pts[b]!));
    this.head.rotation.y = mode === "look" ? -0.6 : 0;
  }
}

/**
 * Orient the public engine's two-bone solution in the authored bending plane.
 * @evidence contracts/common.md#implementation-and-ownership solveTwoBoneIK owns scalar reach angles and clamping; this adapter consumes its lift to place the mid joint and uses the actual reachable tip for both rods. Actor reports clamped limbs rather than stretching them.
 * @evidence contracts/common.md#authoring-interface Endpoints and lengths use meters; pole chooses the bending side. Returned tip can differ from the requested target, and clamped contacts need repair by their consumer.
 */
export function joint(
  a: THREE.Vector3,
  b: THREE.Vector3,
  l1: number,
  l2: number,
  pole: THREE.Vector3,
): { mid: THREE.Vector3; tip: THREE.Vector3; clamped: boolean } {
  const delta = b.clone().sub(a);
  const distance = delta.length();
  const solved = solveTwoBoneIK(l1, l2, distance);
  const direction =
    distance === 0 ? new THREE.Vector3(0, -1, 0) : delta.normalize();
  const d = Math.min(l1 + l2, Math.max(Math.abs(l1 - l2), distance));
  const along = l1 * Math.cos((solved.lift * Math.PI) / 180);
  const bend = pole
    .clone()
    .addScaledVector(direction, -pole.dot(direction))
    .normalize();
  return {
    mid: a
      .clone()
      .addScaledVector(direction, along)
      .addScaledVector(bend, l1 * Math.sin((solved.lift * Math.PI) / 180)),
    tip: a.clone().addScaledVector(direction, d),
    clamped: solved.clamped,
  };
}

/**
 * Place a unit cylinder between the actual construction endpoints.
 * @evidence contracts/common.md#implementation-and-ownership One endpoint difference owns position, axis and length, so debug joints and surface remain aligned.
 * @evidence contracts/common.md#authoring-interface Cylinder local Y is its long axis; endpoints use the same parent frame.
 */
export function rod(
  object: THREE.Object3D,
  a: THREE.Vector3,
  b: THREE.Vector3,
): void {
  object.position.copy(a).add(b).multiplyScalar(0.5);
  const delta = b.clone().sub(a);
  object.scale.y = delta.length();
  object.quaternion.setFromUnitVectors(UP, delta.normalize());
}

/**
 * Retire resources of one no-longer-used stage without touching the renderer.
 * @evidence contracts/common.md#implementation-and-ownership Unique geometry, materials and label textures are disposed once when a stage changes; caller-owned mount is preserved.
 * @evidence contracts/common.md#authoring-interface The supplied group must be exclusively stage-owned; this function removes its children after releasing their resources.
 */
export function retire(group: THREE.Group): void {
  const resources = new Set<{ dispose(): void }>();
  group.traverse((node) => {
    if (node instanceof THREE.Mesh || node instanceof THREE.Sprite) {
      if (node instanceof THREE.Mesh) resources.add(node.geometry);
      for (const material of Array.isArray(node.material)
        ? node.material
        : [node.material]) {
        resources.add(material);
        if ("map" in material && material.map instanceof THREE.Texture)
          resources.add(material.map);
      }
    }
  });
  for (const resource of resources) resource.dispose();
  group.clear();
}
