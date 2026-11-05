import { AutoMovieHumanSkeleton, type IAutoMovieHumanParameters, type IAutoMovieHumanPose } from "@automovie/human";
import { buildHumanCartoonFace, buildHumanPolygon, type AutoMovieHumanPolygon } from "@automovie/viewer/human-polygon";
import * as THREE from "three";

import { createDuelShoes } from "./createDuelShoes";

/**
 * Build one coarse Human with caller-owned identity and an actual hand-bound wand.
 *
 * @evidence contracts/common.md#implementation-and-ownership Human generates the body and clinical FK; the public polygon adapter owns its body geometry. This actor owns rigid hair, uniform marks, closed school shoes, glasses, wand and face attachments. Shoes preserve the underlying Human foot and supply actual additional floor vertices. Formula-sized marks are not calibrated likeness, continuous skin or collision proof. Poses use the prepared public Human evaluator.
 * @evidence contracts/common.md#authoring-interface Supply the complete fixed Human parameter record and house/hair palette. Actor +X faces forward, +Y is up and +Z is anatomical left; positions are metres. Place the returned root once, apply poses, then read world probes. The caller must inspect current support and contact; initial body-floor offset alone grants no moving-floor guarantee. Dispose exactly once.
 */
export function createDuelActor(parameters: IAutoMovieHumanParameters, colors: {
  hair: number;
  house: number;
  glasses: boolean;
  smirk: boolean;
  skirt?: boolean;
}): {
  object: THREE.Group;
  drawing: AutoMovieHumanPolygon.IDrawing;
  evaluate: AutoMovieHumanSkeleton.PoseEvaluator;
  pose: (pose: IAutoMovieHumanPose) => AutoMovieHumanSkeleton.IOutput;
  point: (bone: string) => THREE.Vector3;
  wandTipLocal: [number, number, number];
  wandTip: () => THREE.Vector3;
  wristContact: (side: "left" | "right", toward: THREE.Vector3) => THREE.Vector3;
  shoes: ReturnType<typeof createDuelShoes>;
  dispose: () => void;
} {
  const evaluate: AutoMovieHumanSkeleton.PoseEvaluator = AutoMovieHumanSkeleton.prepare(parameters, { neckSurface: true, footSurface: true });
  const rest: AutoMovieHumanSkeleton.IOutput = evaluate({});
  const palette: Record<string, number> = {};
  for (const bone of rest.bones) {
    const skin: boolean = /head|neck|hand|thumb|index|middle|ring|little|eye|jaw/i.test(bone.bone);
    const foot: boolean = /foot|subtalar|hallux|toe/i.test(bone.bone);
    palette[bone.bone] = skin ? 0xe9c9ad : foot ? 0x161a1b : colors.skirt && /LowerLeg/.test(bone.bone) ? 0x5a5d60 : 0x25292e;
  }
  const drawing: AutoMovieHumanPolygon.IDrawing = buildHumanPolygon(rest, { partColors: palette });
  const object: THREE.Group = new THREE.Group();
  object.add(drawing.object);
  const shoes: ReturnType<typeof createDuelShoes> = createDuelShoes(drawing, rest, evaluate);
  const face: ReturnType<typeof buildHumanCartoonFace> = buildHumanCartoonFace(drawing.head, { units: colors.smirk ? [{ unit: "lipCornerPuller", intensity: 0.42, side: "left" }, { unit: "outerBrowRaiser", intensity: 0.22, side: "right" }] : [] });
  drawing.head.object.add(face.object);
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const wrists: Map<string, THREE.Mesh> = new Map();

  /** Attach formula-sized geometry to its one actual generated bone frame. */
  function attach(bone: string, geometry: THREE.BufferGeometry, color: number, position: THREE.Vector3): THREE.Mesh {
    const parent: THREE.Group | undefined = drawing.bones.get(bone);
    if (parent === undefined) throw new Error(`Required generated bone missing: ${bone}`);
    const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    parent.add(mesh);
    geometries.push(geometry);
    materials.push(material);
    return mesh;
  }

  const extent: THREE.Vector3 = new THREE.Vector3(...drawing.head.max).sub(new THREE.Vector3(...drawing.head.min));
  const centre: THREE.Vector3 = new THREE.Vector3(...drawing.head.min).add(new THREE.Vector3(...drawing.head.max)).multiplyScalar(0.5);
  const hair: THREE.Mesh = attach("head", new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.55), colors.hair, centre.clone().add(new THREE.Vector3(-0.005, extent.y * 0.21, 0)));
  hair.scale.set(extent.x * 0.54, extent.y * 0.40, extent.z * 0.55);
  if (colors.skirt) {
    for (const side of [-1, 1])
      attach("head", new THREE.BoxGeometry(extent.x * 0.65, extent.y * 1.5, extent.z * 0.21), colors.hair, new THREE.Vector3(centre.x - extent.x * 0.19, drawing.head.max[1] - extent.y * 0.75, centre.z + side * extent.z * 0.45));
  }
  if (colors.glasses) {
    for (const side of [-1, 1]) {
      const rim: THREE.Mesh = attach("head", new THREE.TorusGeometry(0.032, 0.0035, 4, 14), 0x171b20, new THREE.Vector3(drawing.head.max[0] + 0.014, centre.y + extent.y * 0.10, side * extent.z * 0.24));
      rim.rotation.y = Math.PI / 2;
    }
  }
  const chest: string = drawing.bones.has("chest") ? "chest" : "spine";
  const chestMesh: THREE.Mesh | undefined = drawing.parts.get(chest);
  if (chestMesh === undefined) throw new Error("Required generated chest surface missing");
  chestMesh.geometry.computeBoundingBox();
  const chestBounds: THREE.Box3 = chestMesh.geometry.boundingBox!;
  const front: number = chestBounds.max.x;
  const collarY: number = chestBounds.max.y - 0.035;
  attach(chest, new THREE.BoxGeometry(0.015, 0.105, 0.125), 0xe1dfd5, new THREE.Vector3(front + 0.008, collarY - 0.025, 0));
  attach(chest, new THREE.BoxGeometry(0.023, 0.17, 0.034), colors.house, new THREE.Vector3(front + 0.018, collarY - 0.085, 0));
  for (let band: number = 0; band < 3; band++)
    attach(chest, new THREE.BoxGeometry(0.025, 0.012, 0.036), colors.skirt ? 0xc5cdca : 0xcead57, new THREE.Vector3(front + 0.020, collarY - 0.045 - band * 0.043, 0));
  attach(chest, new THREE.BoxGeometry(0.019, 0.055, 0.045), colors.house, new THREE.Vector3(front + 0.014, collarY - 0.065, 0.12));
  for (const side of [-1, 1]) {
    attach("hips", new THREE.BoxGeometry(0.15, 0.44, 0.13), 0x1b2024, new THREE.Vector3(-0.05, -0.17, side * 0.15));
    attach(chest, new THREE.BoxGeometry(0.035, 0.20, 0.055), 0x1b2024, new THREE.Vector3(front + 0.022, collarY - 0.11, side * 0.12));
  }
  if (colors.skirt)
    attach("hips", new THREE.CylinderGeometry(0.16, 0.21, 0.34, 10), 0x35383c, new THREE.Vector3(0, -0.14, 0));
  for (const side of ["left", "right"]) {
    const lower: AutoMovieHumanSkeleton.IBone = rest.bones.find((bone: AutoMovieHumanSkeleton.IBone): boolean => bone.bone === `${side}LowerArm`)!;
    const hand: AutoMovieHumanSkeleton.IBone = rest.bones.find((bone: AutoMovieHumanSkeleton.IBone): boolean => bone.bone === `${side}Hand`)!;
    const end: THREE.Vector3 = new THREE.Vector3(...hand.position).sub(new THREE.Vector3(...lower.position));
    const direction: THREE.Vector3 = end.clone().normalize();
    const wrist: THREE.Mesh = attach(lower.bone, new THREE.CylinderGeometry(hand.radius * 1.04, hand.radius * 1.06, 0.03, 8), 0xe9c9ad, end.clone().addScaledVector(direction, -0.015));
    wrist.name = `bare ${side} wrist`;
    wrist.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    wrists.set(side, wrist);
    const cuff: THREE.Mesh = attach(lower.bone, new THREE.CylinderGeometry(hand.radius * 1.07, hand.radius * 1.08, 0.008, 8), 0xdedfd7, end.clone().addScaledVector(direction, -0.034));
    cuff.quaternion.copy(wrist.quaternion);
  }
  const hand: AutoMovieHumanSkeleton.IBone = rest.bones.find((bone: AutoMovieHumanSkeleton.IBone): boolean => bone.bone === "rightHand")!;
  const middle: AutoMovieHumanSkeleton.IBone = rest.bones.find((bone: AutoMovieHumanSkeleton.IBone): boolean => bone.bone === "rightMiddleProximal")!;
  const wandAxis: THREE.Vector3 = new THREE.Vector3(...middle.position).sub(new THREE.Vector3(...hand.position)).normalize();
  const wand: THREE.Mesh = attach("rightHand", new THREE.CylinderGeometry(0.0025, 0.005, 0.30, 7), 0x5a3525, wandAxis.clone().multiplyScalar(0.15));
  wand.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), wandAxis);
  const wandTipLocal: [number, number, number] = [wandAxis.x * 0.30, wandAxis.y * 0.30, wandAxis.z * 0.30];
  object.updateMatrixWorld(true);
  const initialBounds: THREE.Box3 = new THREE.Box3().setFromObject(drawing.object);
  object.position.y = -initialBounds.min.y;
  return {
    object, drawing, evaluate, wandTipLocal, shoes,
    pose: (pose: IAutoMovieHumanPose): AutoMovieHumanSkeleton.IOutput => {
      const output: AutoMovieHumanSkeleton.IOutput = evaluate(pose);
      drawing.setPose(output);
      return output;
    },
    point: (bone: string): THREE.Vector3 => {
      const node: THREE.Group | undefined = drawing.bones.get(bone);
      if (node === undefined) throw new Error(`Missing contact bone ${bone}`);
      return node.getWorldPosition(new THREE.Vector3());
    },
    wandTip: (): THREE.Vector3 => wand.localToWorld(new THREE.Vector3(0, 0.15, 0)),
    wristContact: (side: "left" | "right", toward: THREE.Vector3): THREE.Vector3 => {
      const wrist: THREE.Mesh = wrists.get(side)!;
      wrist.updateWorldMatrix(true, false);
      const centre: THREE.Vector3 = wrist.getWorldPosition(new THREE.Vector3());
      const outward: THREE.Vector3 = toward.clone().sub(centre);
      if (!outward.toArray().every(Number.isFinite) || outward.lengthSq() < 1e-10) throw new Error("Wrist contact needs a distinct finite approach");
      outward.normalize();
      const ray: THREE.Raycaster = new THREE.Raycaster(centre.clone().addScaledVector(outward, 0.2), outward.negate(), 0, 0.4);
      const hit: THREE.Intersection | undefined = ray.intersectObject(wrist, false)[0];
      if (hit === undefined) throw new Error("Actual bare wrist surface was not intersected");
      return hit.point.clone();
    },
    dispose: (): void => {
      face.dispose();
      shoes.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      object.removeFromParent();
      drawing.dispose();
    },
  };
}
