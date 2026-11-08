import type { AutoMovieHumanPolygon } from "@automovie/viewer";
import * as THREE from "three";

/**
 * Construct connected coarse school garments around the actual Human frames.
 *
 * @evidence contracts/common.md#implementation-and-ownership White pointed collar, striped house tie, V trim and open robe remain distinct mesh layers. The robe's upper edge follows hips while its hem follows the corresponding thigh, keeping a connected seam without replacing Human anatomy. Carina's single pleated skirt bridges both hips/legs; no independent thigh boards represent a skirt. Owns garment buffers/materials; drawing/bones are borrowed.
 * @evidence contracts/common.md#authoring-interface update follows the already applied public Human pose; call after world matrices update. Metre offsets are authored garment dimensions in existing bone-local frames, not recovered image anatomy. The explicit gathered0–1 control folds lower robe/skirt supports closer to the upper thighs during the new deep pickup, rather than leaving a broad horizontal panel. Zero exactly preserves earlier garments; this coarse authored fold is not a cloth/force simulation. Open fronts and actual use still need pixel/contact review. dispose retires owned resources only.
 */
export function createHumanUniform(
  drawing: Pick<AutoMovieHumanPolygon.IDrawing, "bones" | "object">,
  person: "carina" | "harry",
): { update: (crouch?: number) => void; dispose: () => void } {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: Map<number, THREE.MeshStandardMaterial> = new Map();
  const objects: THREE.Object3D[] = [];
  const followers: {
    attribute: THREE.BufferAttribute;
    bindings: {
      bone: string;
      point: THREE.Vector3;
      gathered?: THREE.Vector3;
    }[];
  }[] = [];
  const house: number = person === "carina" ? 0x245d46 : 0x8e303b;
  const trim: number = person === "carina" ? 0xc2cbc6 : 0xd6b259;

  /** Reuse an opaque two-sided cloth material for each garment color. */
  function material(color: number): THREE.MeshStandardMaterial {
    if (!materials.has(color))
      materials.set(
        color,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 1,
          side: THREE.DoubleSide,
          flatShading: true,
        }),
      );
    return materials.get(color)!;
  }

  /** Bind one rigid flat polygon to an existing torso frame. */
  function polygon(bone: string, vertices: number[], color: number): void {
    const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    const indices: number[] = [];
    for (let index: number = 1; index < vertices.length / 3 - 1; index++)
      indices.push(0, index, index + 1);
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometries.push(geometry);
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, material(color));
    drawing.bones.get(bone)!.add(mesh);
    objects.push(mesh);
  }

  // Paired pointed collar, a tapered tie, diagonal stripes and visible V trim.
  for (const sign of [-1, 1]) {
    polygon(
      "chest",
      [0.136, 0.13, 0, 0.136, 0.13, sign * 0.08, 0.138, 0.045, sign * 0.04],
      0xf5f2e8,
    );
    polygon(
      "chest",
      [
        0.119,
        0.13,
        sign * 0.09,
        0.12,
        0.12,
        sign * 0.1,
        0.12,
        -0.095,
        0,
        0.119,
        -0.08,
        0,
      ],
      0xb5b6b0,
    );
    polygon(
      "chest",
      [
        0.113,
        0.17,
        sign * 0.145,
        0.124,
        0.075,
        sign * 0.075,
        0.115,
        -0.4,
        sign * 0.065,
        0.09,
        -0.4,
        sign * 0.155,
      ],
      0x171d20,
    );
    polygon(
      "chest",
      [
        0.126,
        0.075,
        sign * 0.075,
        0.126,
        0.06,
        sign * 0.085,
        0.119,
        -0.4,
        sign * 0.075,
        0.117,
        -0.4,
        sign * 0.065,
      ],
      house,
    );
  }
  polygon(
    "chest",
    [
      0.146, 0.1, 0, 0.146, 0.06, 0.018, 0.146, -0.105, 0.016, 0.146, -0.13, 0,
      0.146, -0.105, -0.016, 0.146, 0.06, -0.018,
    ],
    house,
  );
  for (let index: number = 0; index < 3; index++) {
    const y: number = 0.035 - index * 0.045;
    polygon(
      "chest",
      [
        0.148,
        y + 0.012,
        -0.017,
        0.148,
        y - 0.006,
        0.017,
        0.148,
        y - 0.016,
        0.017,
        0.148,
        y + 0.002,
        -0.017,
      ],
      trim,
    );
  }
  polygon(
    "chest",
    [
      0.13, 0.015, 0.1, 0.13, 0.015, 0.14, 0.13, -0.03, 0.14, 0.13, -0.045,
      0.12, 0.13, -0.03, 0.1,
    ],
    house,
  );

  /** Bridge real upper and lower garment supports with one connected surface. */
  function cloth(
    bindings: {
      bone: string;
      point: THREE.Vector3;
      gathered?: THREE.Vector3;
    }[],
    indices: number[],
    color: number,
  ): void {
    const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    const attribute: THREE.BufferAttribute = new THREE.BufferAttribute(
      new Float32Array(bindings.length * 3),
      3,
    );
    geometry.setAttribute("position", attribute);
    geometry.setIndex(indices);
    geometries.push(geometry);
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, material(color));
    mesh.frustumCulled = false;
    drawing.object.add(mesh);
    objects.push(mesh);
    followers.push({ attribute, bindings });
  }

  const back: { bone: string; point: THREE.Vector3 }[] = [];
  const backIndices: number[] = [];
  for (let ring: number = 0; ring < 3; ring++)
    for (let index: number = 0; index < 5; index++) {
      const z: number = (index - 2) * 0.075;
      const x: number = -0.135 + 0.045 * (z / 0.15) ** 2;
      back.push({
        bone: ring === 2 ? "hips" : "chest",
        point: new THREE.Vector3(
          x,
          ring === 0 ? 0.115 : ring === 1 ? -0.15 : 0.06,
          z,
        ),
      });
    }
  for (let ring: number = 0; ring < 2; ring++)
    for (let index: number = 0; index < 4; index++) {
      const first: number = ring * 5 + index;
      backIndices.push(
        first,
        first + 5,
        first + 1,
        first + 1,
        first + 5,
        first + 6,
      );
    }
  cloth(back, backIndices, 0x171d20);

  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1;
    const ring: [number, number][] = [
      [0.105, sign * 0.09],
      [-0.015, sign * 0.16],
      [-0.12, 0],
    ];
    const bindings: {
      bone: string;
      point: THREE.Vector3;
      gathered?: THREE.Vector3;
    }[] = [];
    for (const [x, z] of ring)
      bindings.push({ bone: "hips", point: new THREE.Vector3(x, 0.06, z) });
    for (const [x, z] of ring)
      bindings.push({
        bone: `${side}UpperLeg`,
        point: new THREE.Vector3(x, -0.52, z - sign * 0.09),
        gathered: new THREE.Vector3(x * 0.65, -0.3, z - sign * 0.09),
      });
    cloth(bindings, [0, 3, 1, 1, 3, 4, 1, 4, 2, 2, 4, 5], 0x171d20);
  }
  if (person === "carina") {
    const bindings: {
      bone: string;
      point: THREE.Vector3;
      gathered?: THREE.Vector3;
    }[] = [];
    const indices: number[] = [];
    for (let ring: number = 0; ring < 2; ring++)
      for (let index: number = 0; index < 16; index++) {
        const angle: number = (index / 16) * Math.PI * 2;
        const pleat: number = index % 2 === 0 ? 1 : 0.94;
        const z: number = Math.sin(angle) * (ring === 0 ? 0.15 : 0.19) * pleat;
        bindings.push(
          ring === 0
            ? {
                bone: "hips",
                point: new THREE.Vector3(Math.cos(angle) * 0.12, 0.025, z),
              }
            : {
                bone: z >= 0 ? "leftUpperLeg" : "rightUpperLeg",
                point: new THREE.Vector3(
                  Math.cos(angle) * 0.15 * pleat,
                  -0.29,
                  z - (z >= 0 ? 0.09 : -0.09),
                ),
                gathered: new THREE.Vector3(
                  Math.cos(angle) * 0.105 * pleat,
                  -0.18,
                  z * 0.85 - (z >= 0 ? 0.09 : -0.09),
                ),
              },
        );
      }
    for (let index: number = 0; index < 16; index++) {
      const next: number = (index + 1) % 16;
      indices.push(index, 16 + index, next, next, 16 + index, 16 + next);
    }
    cloth(bindings, indices, 0x555a5e);
  }
  return {
    update: (crouch: number = 0): void => {
      if (!Number.isFinite(crouch) || crouch < 0 || crouch > 1)
        throw new Error("Gathered garment amount must lie within0–1");
      for (const follower of followers) {
        for (let index: number = 0; index < follower.bindings.length; index++) {
          const binding: (typeof follower.bindings)[number] =
            follower.bindings[index]!;
          const local: THREE.Vector3 = binding.point.clone();
          if (binding.gathered !== undefined)
            local.lerp(binding.gathered, crouch);
          const point: THREE.Vector3 = drawing.bones
            .get(binding.bone)!
            .localToWorld(local);
          drawing.object.worldToLocal(point);
          follower.attribute.setXYZ(index, point.x, point.y, point.z);
        }
        follower.attribute.needsUpdate = true;
      }
      for (const geometry of geometries) geometry.computeVertexNormals();
    },
    dispose: (): void => {
      for (const object of objects) object.removeFromParent();
      for (const geometry of geometries) geometry.dispose();
      for (const value of materials.values()) value.dispose();
    },
  };
}
