import * as THREE from "three";

import type { AutoMovieHumanSkeleton } from "../../../human/src/skeleton/AutoMovieHumanSkeleton";

/**
 * Build the rod-and-ball stickman of a generated Human's skeleton as one
 * Three.js group per bone, placed by the skeleton's posed placements.
 *
 * Each bone group carries a ball at its joint and a capsule toward every child
 * joint, or toward its own tip for a leaf bone (crown, chin, gaze, fingertip,
 * toe tip). Rest geometry is laid out in the group's frame, which equals the
 * world frame at rest because every bone rests unrotated, so a placement moves
 * it rigidly. Rods are 0.45 of the segment's skin girth radius (0.25 on the
 * trunk column, whose girth wraps the torso), at most 0.3 of the segment's
 * length; balls are 1.3 times the thicker adjoining rod. Left bones are
 * orange, right bones blue, the axial column dark and joints yellow.
 *
 * @param output Skeleton from `AutoMovieHumanSkeleton.generate`.
 * @returns The scene group and a disposer of its geometries and materials.
 */
export function buildHumanStickman(output: AutoMovieHumanSkeleton.IOutput): {
  /** Group holding every bone group, placed by `output.posed`. */
  object: THREE.Group;

  /** Release the geometries and materials. */
  dispose: () => void;
} {
  const materials: Record<string, THREE.MeshStandardMaterial> = {
    axial: new THREE.MeshStandardMaterial({ color: 0x2a2d35, roughness: 0.6 }),
    left: new THREE.MeshStandardMaterial({ color: 0xd9531e, roughness: 0.6 }),
    right: new THREE.MeshStandardMaterial({ color: 0x1f6fd9, roughness: 0.6 }),
    joint: new THREE.MeshStandardMaterial({ color: 0xf0d84a, roughness: 0.5 }),
  };
  const geometries: THREE.BufferGeometry[] = [];
  const object: THREE.Group = new THREE.Group();
  const byBone: Map<string, AutoMovieHumanSkeleton.IBone> = new Map(
    output.bones.map(
      (
        b: AutoMovieHumanSkeleton.IBone,
      ): [string, AutoMovieHumanSkeleton.IBone] => [b.bone, b],
    ),
  );

  for (const [i, bone] of output.bones.entries()) {
    const group: THREE.Group = new THREE.Group();
    const material: THREE.MeshStandardMaterial = bone.bone.startsWith("left")
      ? materials.left!
      : bone.bone.startsWith("right")
        ? materials.right!
        : materials.axial!;

    // Segment ends: children's joints, else the tip.
    const ends: [number, number, number][] = output.bones
      .filter(
        (c: AutoMovieHumanSkeleton.IBone): boolean =>
          c.parent === bone.bone && !attached(c.bone),
      )
      .map(
        (c: AutoMovieHumanSkeleton.IBone): [number, number, number] =>
          c.position,
      );
    if (bone.tip !== null) ends.push(bone.tip);
    for (const end of ends) {
      const seg: THREE.Vector3 = new THREE.Vector3(
        end[0] - bone.position[0],
        end[1] - bone.position[1],
        end[2] - bone.position[2],
      );
      const length: number = seg.length();
      if (length < 1e-6) continue;
      const radius: number = rodRadius(bone, length);
      const geometry: THREE.CapsuleGeometry = new THREE.CapsuleGeometry(
        radius,
        Math.max(1e-5, length - 2 * radius),
        4,
        12,
      );
      geometries.push(geometry);
      const rod: THREE.Mesh = new THREE.Mesh(geometry, material);
      rod.position.copy(seg.clone().multiplyScalar(0.5));
      rod.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        seg.clone().normalize(),
      );
      group.add(rod);
    }

    // Joint ball, 1.3 times the thicker adjoining rod.
    const parent: AutoMovieHumanSkeleton.IBone | undefined =
      bone.parent === null ? undefined : byBone.get(bone.parent);
    const ballGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(
      1.3 *
        Math.max(
          ends.length === 0 ? 0 : rodRadius(bone, Infinity),
          parent === undefined || attached(bone.bone)
            ? 0
            : rodRadius(parent, Infinity),
        ),
      14,
      10,
    );
    geometries.push(ballGeometry);
    group.add(new THREE.Mesh(ballGeometry, materials.joint!));

    // Rest layout is relative to the joint; the placement moves it.
    const placement: AutoMovieHumanSkeleton.IPlacement = output.posed[i]!;
    group.position.set(...placement.position);
    group.quaternion.set(...placement.rotation);
    object.add(group);
  }
  return {
    object,
    dispose: (): void => {
      for (const g of geometries) g.dispose();
      for (const m of Object.values(materials)) m.dispose();
    },
  };
}

/**
 * Rod radius of a bone's segment: 0.45 of its skin girth radius, 0.25 on the
 * trunk column, 0.15 on the eyes' gaze markers, never more than 0.3 of the
 * segment length.
 */
function rodRadius(bone: AutoMovieHumanSkeleton.IBone, length: number): number {
  const factor: number = ["hips", "spine", "chest"].includes(bone.bone)
    ? 0.25
    : bone.bone.endsWith("Eye")
      ? 0.15
      : 0.45;
  return Math.min(bone.radius * factor, length * 0.3);
}

/**
 * Whether a bone hangs off its parent without lying on the parent's drawn
 * segment: the eyes and the jaw sit inside the head, away from its axis.
 */
function attached(bone: string): boolean {
  return bone.endsWith("Eye") || bone === "jaw";
}
