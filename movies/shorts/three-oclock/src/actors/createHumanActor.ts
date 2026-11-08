import {
  AutoMovieHumanSkeleton,
  type AutoMovieHumanSupportFrame,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import {
  type AutoMovieHumanPolygon,
  buildHumanCartoonFace,
  buildHumanPolygon,
} from "@automovie/viewer";
import * as THREE from "three";

import { createHumanParameters } from "./createHumanParameters";
import { createHumanUniform } from "./createHumanUniform";
import { createSchoolShoes } from "./createSchoolShoes";

/**
 * Own one public Human polygon performer and its coarse school uniform.
 * Human supplies anatomy/FK and the Viewer supplies polygon geometry; the
 * production owns identity cues, garments and whole-character placement.
 *
 * @evidence contracts/common.md#implementation-and-ownership Prepares the public Human skeleton with full neck and foot exterior once, builds its public polygon consumer, and reuses those exact bones for absolute clinical poses and attachments. Garment pieces are bound to actual limb frames rather than a competing skeleton.
 * @evidence contracts/common.md#authoring-interface Returns one owned actor group, evaluator, drawing, absolute pose, world-space bone witness port and right-hand mesh population traced through actual skeleton ancestry. Polygon bone groups are flat scene carriers, so a single group's bounds do not include separately carried fingers. The optional bounded gatheredGarment amount controls only the coarse clothing fold; default zero preserves earlier poses. Caller owns root placement/clock; dispose retires drawing, faces and accessories once.
 */
export function createHumanActor(person: "carina" | "harry"): {
  object: THREE.Group;
  drawing: AutoMovieHumanPolygon.IDrawing;
  evaluate: AutoMovieHumanSkeleton.PoseEvaluator;
  neutral: AutoMovieHumanSkeleton.IOutput;
  shoePoints: readonly AutoMovieHumanSupportFrame.IPoint[];
  rightHandParts: readonly THREE.Mesh[];
  setPose: (
    pose: IAutoMovieHumanPose,
    face?: "neutral" | "smirk" | "surprise" | "smile",
    gatheredGarment?: number,
  ) => AutoMovieHumanSkeleton.IOutput;
  point: (bone: string, local?: THREE.Vector3) => THREE.Vector3;
  dispose: () => void;
} {
  const evaluate: AutoMovieHumanSkeleton.PoseEvaluator =
    AutoMovieHumanSkeleton.prepare(createHumanParameters(person), {
      neckSurface: true,
      footSurface: true,
    });
  const neutral: AutoMovieHumanSkeleton.IOutput = evaluate({});
  const colors: Record<string, number> = {};
  for (const bone of neutral.bones) {
    colors[bone.bone] =
      /head|neck|jaw|Hand|Thumb|Index|Middle|Ring|Little/.test(bone.bone)
        ? 0xe8bfa9
        : /Foot|Toes/.test(bone.bone)
          ? 0x14181b
          : 0x24272b;
  }
  colors.chest = 0x373b3e;
  colors.spine = 0x373b3e;
  const drawing: AutoMovieHumanPolygon.IDrawing = buildHumanPolygon(neutral, {
    partColors: colors,
  });
  const parents: Map<string, string | null> = new Map(
    neutral.bones.map(
      (bone: AutoMovieHumanSkeleton.IBone): [string, string | null] => [
        bone.bone,
        bone.parent,
      ],
    ),
  );
  const rightHandParts: THREE.Mesh[] = [];
  for (const [bone, mesh] of drawing.parts) {
    let ancestor: string | null | undefined = bone;
    while (
      ancestor !== undefined &&
      ancestor !== null &&
      ancestor !== "rightHand"
    )
      ancestor = parents.get(ancestor);
    if (ancestor === "rightHand") rightHandParts.push(mesh);
  }
  drawing.sections.visible = false;
  const object: THREE.Group = new THREE.Group();
  object.name = person;
  object.add(drawing.object);
  const geometries: Set<THREE.BufferGeometry> = new Set();
  const materials: Map<number, THREE.MeshStandardMaterial> = new Map();

  /** Reuse one owned rough material per accessory colour. */
  function material(color: number): THREE.MeshStandardMaterial {
    if (!materials.has(color))
      materials.set(
        color,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.9,
          flatShading: true,
        }),
      );
    return materials.get(color)!;
  }

  /** Attach an owned mesh in the public bone-local bind frame. */
  function attach(
    bone: string,
    geometry: THREE.BufferGeometry,
    color: number,
    position: THREE.Vector3,
  ): THREE.Mesh {
    const parent: THREE.Group | undefined = drawing.bones.get(bone);
    if (parent === undefined)
      throw new Error(`Human uniform needs actual bone ${bone}`);
    geometries.add(geometry);
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const uniform: ReturnType<typeof createHumanUniform> = createHumanUniform(
    drawing,
    person,
  );
  const shoes: ReturnType<typeof createSchoolShoes> = createSchoolShoes(
    drawing,
    neutral,
  );

  const head: AutoMovieHumanPolygon.IDrawing["head"] = drawing.head;
  const size: THREE.Vector3 = new THREE.Vector3(...head.max).sub(
    new THREE.Vector3(...head.min),
  );
  const centre: THREE.Vector3 = new THREE.Vector3(...head.max)
    .add(new THREE.Vector3(...head.min))
    .multiplyScalar(0.5);
  const hair: THREE.Mesh = attach(
    "head",
    new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.54),
    person === "carina" ? 0xdccd9f : 0x272321,
    centre.clone().add(new THREE.Vector3(-0.007, size.y * 0.22, 0)),
  );
  hair.scale.set(size.x * 0.57, size.y * 0.4, size.z * 0.57);
  if (person === "carina")
    attach(
      "head",
      new THREE.BoxGeometry(size.x * 0.3, size.y * 0.68, size.z * 1.05),
      0xdccd9f,
      new THREE.Vector3(
        head.min[0] - 0.004,
        centre.y - size.y * 0.06,
        centre.z,
      ),
    );
  if (person === "harry") {
    for (const sign of [-1, 1]) {
      const ring: THREE.Mesh = attach(
        "head",
        new THREE.TorusGeometry(size.z * 0.16, 0.003, 5, 12),
        0x15191e,
        new THREE.Vector3(
          head.max[0] + 0.011,
          centre.y + size.y * 0.13,
          sign * size.z * 0.2,
        ),
      );
      ring.rotation.y = Math.PI / 2;
    }
    attach(
      "head",
      new THREE.BoxGeometry(0.005, 0.005, size.z * 0.13),
      0x15191e,
      new THREE.Vector3(head.max[0] + 0.011, centre.y + size.y * 0.13, 0),
    );
  }
  const faces: Map<
    string,
    ReturnType<typeof buildHumanCartoonFace>
  > = new Map();
  for (const name of ["neutral", "smirk", "surprise", "smile"] as const)
    for (const opening of [0, 4, 8, 12]) {
      const face: ReturnType<typeof buildHumanCartoonFace> =
        buildHumanCartoonFace(
          head,
          {
            units:
              name === "neutral"
                ? []
                : name === "smirk"
                  ? [{ unit: "lipCornerPuller", intensity: 0.25, side: "left" }]
                  : name === "surprise"
                    ? [{ unit: "upperLidRaiser", intensity: 0.5, side: "both" }]
                    : [
                        {
                          unit: "lipCornerPuller",
                          intensity: 0.35,
                          side: "both",
                        },
                      ],
          },
          { jaw: { opening } },
        );
      if (face.unsupported.length !== 0)
        throw new Error(
          `Unsupported authored face: ${face.unsupported.join(", ")}`,
        );
      face.object.visible = name === "neutral" && opening === 0;
      head.object.add(face.object);
      faces.set(`${name}-${opening}`, face);
    }
  let disposed: boolean = false;
  return {
    object,
    drawing,
    evaluate,
    neutral,
    shoePoints: shoes.points,
    rightHandParts,
    setPose: (
      pose: IAutoMovieHumanPose,
      face: "neutral" | "smirk" | "surprise" | "smile" = "neutral",
      gatheredGarment: number = 0,
    ): AutoMovieHumanSkeleton.IOutput => {
      const output: AutoMovieHumanSkeleton.IOutput = evaluate(pose);
      drawing.setPose(output);
      const opening: number = Math.max(
        0,
        Math.min(12, Math.round((pose.head?.jaw?.opening ?? 0) / 4) * 4),
      );
      for (const [name, entry] of faces)
        entry.object.visible = name === `${face}-${opening}`;
      object.updateMatrixWorld(true);
      uniform.update(gatheredGarment);
      return output;
    },
    point: (
      bone: string,
      local: THREE.Vector3 = new THREE.Vector3(),
    ): THREE.Vector3 => {
      const frame: THREE.Group | undefined = drawing.bones.get(bone);
      if (frame === undefined)
        throw new Error(`Human point needs actual bone ${bone}`);
      return frame.localToWorld(local.clone());
    },
    dispose: (): void => {
      if (disposed) return;
      disposed = true;
      for (const face of faces.values()) face.dispose();
      uniform.dispose();
      shoes.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const value of materials.values()) value.dispose();
      drawing.dispose();
      object.clear();
    },
  };
}
