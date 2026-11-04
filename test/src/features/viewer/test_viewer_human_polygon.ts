import {
  type AutoMovieHumanPolygon,
  buildHumanCartoonFace,
  buildHumanPolygon,
} from "@automovie/viewer/human-polygon";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createHumanPolygonFixture } from "../internal/createHumanPolygonFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The promoted original polygon drawing keeps geometry and actual probe frames.
 *
 * Scenarios:
 *
 * 1. Synthetic source neck/head points and an original procedural shin section
 * reach the actual registered mesh unchanged in the rest-joint-origin frame.
 * 2. A custom midfoot placement, a quarter-turned forearm and an actor parent
 * transform apply once to both surface and diagnostics, including paused probes.
 * 3. Palette replacement retains mesh buffers and pose, equal RGB values share
 * materials and invalid RGB or incomplete/duplicate/nonfinite poses refuse.
 * 4. The original cartoon face consumes actual head triangles, keeps explicit
 * unsupported fields and remains separately owned during drawing retirement.
 * 5. Drawing disposal retires each owned geometry/material once, clears its
 * registries and makes further pose/palette updates refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds through the optional public entry, reads actual mesh positions/indices and bone-group world transforms, replaces palettes/poses, constructs a face on the actual front and counts native disposal events; catches redesigned source rings, lost custom bones, wrong local frames, double root/parent composition, stale diagnostics, partial invalid writes and attached-resource overreach.
 * @evidence contracts/testing.md#independent-expectations Fixture courses are eight literal phase samples; the head must contain those points minus its rest joint and a procedural shin's first point is its supplied radius along +X. A forearm probe (0.04,0,0), z quarter-turn and placement (2,3,4), followed by actor y quarter-turn and translation (1,0,0), gives world (5,3.04,-2). Palette and resource expectations use actual identities/events rather than source matching or implementation snapshots.
 * @evidence contracts/testing.md#distinguishing-cases Covers source-owned and procedural sections, custom non-humanoid foot/toe bones, nonidentity root and bone rotation, surface/diagnostic agreement, equal/different/unmatched colours, invalid pose variants, neutral/expressive face output, explicit unsupported actions, disposal repetition and post-disposal refusal; real Human inputs and hardware appearance remain the consuming host's verification.
 * @evidence contracts/testing.md#execution-ownership One portable CPU unit calls maintained public Viewer entries over a small synthetic descriptor, starts no Human generator, browser, renderer, process or installation, and owns its ordinary Three objects.
 */
export function test_viewer_human_polygon(): void {
  const input: AutoMovieHumanPolygon.IInput = createHumanPolygonFixture();
  const drawing: AutoMovieHumanPolygon.IDrawing = buildHumanPolygon(input, {
    partColors: {
      leftLowerArm: 0xff2233,
      rightLowerArm: 0xff2233,
      ignored: 0x123456,
    },
  });
  const defects: string[] = [];
  const check: (label: string, passed: boolean) => void = (
    label: string,
    passed: boolean,
  ): void => {
    if (!passed) defects.push(label);
  };
  const head: THREE.Mesh = drawing.parts.get("head")!;
  const headPositions: THREE.BufferAttribute = head.geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const headJoint: AutoMovieHumanPolygon.IBone = input.bones.find(
    (bone: AutoMovieHumanPolygon.IBone): boolean => bone.bone === "head",
  )!;
  const courses: AutoMovieHumanPolygon.IExteriorSection[] = [
    input.neckSurface!.sections.at(-1)!,
    ...input.neckSurface!.headSections,
  ];
  check(
    "head uses actual source courses",
    courses.every(
      (
        course: AutoMovieHumanPolygon.IExteriorSection,
        layer: number,
      ): boolean =>
        course.points.every(
          (point: [number, number, number], i: number): boolean =>
            nclose(
              headPositions.getX(layer * 8 + i),
              point[0] - headJoint.position[0],
              1e-7,
            ) &&
            nclose(
              headPositions.getY(layer * 8 + i),
              point[1] - headJoint.position[1],
              1e-7,
            ) &&
            nclose(
              headPositions.getZ(layer * 8 + i),
              point[2] - headJoint.position[2],
              1e-7,
            ),
        ),
    ),
  );
  check(
    "head retains original crown fan population",
    headPositions.count === 26 && head.geometry.index!.count === 144,
  );
  const shin: THREE.BufferAttribute = drawing.parts
    .get("leftLowerLeg")!
    .geometry.getAttribute("position") as THREE.BufferAttribute;
  check(
    "procedural shin radius unchanged",
    nclose(shin.getX(0), 0.05, 1e-7) &&
      nclose(shin.getY(0), 0, 1e-7) &&
      nclose(shin.getZ(0), 0, 1e-7),
  );
  check(
    "custom bone registries expose actual parts",
    drawing.parts.has("leftMidfoot") &&
      drawing.parts.has("rightSubtalar") &&
      drawing.bones.get("leftMidfoot") ===
        drawing.parts.get("leftMidfoot")!.parent &&
      drawing.bindings.get("leftMidfoot")!.length === 2,
  );
  check(
    "original palette shares equal RGB",
    drawing.parts.get("leftLowerArm")!.material ===
      drawing.parts.get("rightLowerArm")!.material,
  );
  const ancestor: THREE.Group = new THREE.Group();
  ancestor.position.set(1, 0, 0);
  ancestor.quaternion.set(0, Math.SQRT1_2, 0, Math.SQRT1_2);
  ancestor.add(drawing.object);
  const changed: AutoMovieHumanPolygon.IPlacement[] = input.posed.map(
    (
      placement: AutoMovieHumanPolygon.IPlacement,
    ): AutoMovieHumanPolygon.IPlacement => ({
      ...placement,
      position:
        placement.bone === "leftLowerArm"
          ? [2, 3, 4]
          : placement.bone === "leftMidfoot"
            ? [0.5, 0.2, 0.3]
            : [...placement.position],
      rotation:
        placement.bone === "leftLowerArm"
          ? [0, 0, Math.SQRT1_2, Math.SQRT1_2]
          : [...placement.rotation],
    }),
  );
  const forearm: THREE.Group = drawing.bones.get("leftLowerArm")!;
  const vertexBuffer: THREE.BufferAttribute = drawing.parts
    .get("leftLowerArm")!
    .geometry.getAttribute("position") as THREE.BufferAttribute;
  drawing.setPose({ posed: changed });
  const world: THREE.Vector3 = new THREE.Vector3(0.04, 0, 0).applyMatrix4(
    forearm.matrixWorld,
  );
  check(
    "actual paused probe composes once",
    world.distanceTo(new THREE.Vector3(5, 3.04, -2)) < 1e-7,
  );
  check(
    "surface and construction share pose",
    drawing.bindings
      .get("leftLowerArm")!
      .every((object: THREE.Object3D): boolean =>
        object.matrixWorld.elements.every((value: number, i: number): boolean =>
          nclose(value, forearm.matrixWorld.elements[i]!, 1e-12),
        ),
      ),
  );
  const custom: THREE.Vector3 = new THREE.Vector3().setFromMatrixPosition(
    drawing.bones.get("leftMidfoot")!.matrixWorld,
  );
  check(
    "custom midfoot placement applies",
    custom.distanceTo(new THREE.Vector3(1.3, 0.2, -0.5)) < 1e-7,
  );
  drawing.setPartColors({ leftLowerArm: 0x3366ff });
  check(
    "palette preserves buffers and pose",
    drawing.parts.get("leftLowerArm")!.geometry.getAttribute("position") ===
      vertexBuffer &&
      new THREE.Vector3(0.04, 0, 0)
        .applyMatrix4(forearm.matrixWorld)
        .distanceTo(world) < 1e-12,
  );
  const observed: THREE.Object3D[] = [...drawing.bindings.values()].flat();
  const unchanged: number[][] = observed.map(
    (object: THREE.Object3D): number[] => [
      ...object.position.toArray(),
      ...object.quaternion.toArray(),
      ...object.matrixWorld.elements,
    ],
  );
  const invalid: AutoMovieHumanPolygon.IPlacement[][] = [
    changed.filter(
      (placement: AutoMovieHumanPolygon.IPlacement): boolean =>
        placement.bone !== "leftMidfoot",
    ),
    [...changed, changed[0]!],
    changed.map(
      (
        placement: AutoMovieHumanPolygon.IPlacement,
      ): AutoMovieHumanPolygon.IPlacement =>
        placement.bone === "leftMidfoot"
          ? { ...placement, position: [NaN, 0, 0] }
          : placement,
    ),
    changed.map(
      (
        placement: AutoMovieHumanPolygon.IPlacement,
      ): AutoMovieHumanPolygon.IPlacement =>
        placement.bone === "leftMidfoot"
          ? { ...placement, rotation: [0, 0, 0, 2] }
          : placement,
    ),
  ];
  for (const [index, posed] of invalid.entries()) {
    // An early valid write would visibly change hips before a late refusal.
    const attempted: AutoMovieHumanPolygon.IPlacement[] = posed.map(
      (placement: AutoMovieHumanPolygon.IPlacement): AutoMovieHumanPolygon.IPlacement =>
        placement.bone === "hips"
          ? { ...placement, position: [9, 9, 9] }
          : placement,
    );
    check(
      `invalid pose ${index} refuses`,
      throwsError((): void => drawing.setPose({ posed: attempted })),
    );
    check(
      `invalid pose ${index} is atomic`,
      observed.every((object: THREE.Object3D, slot: number): boolean =>
        [...object.position.toArray(), ...object.quaternion.toArray(), ...object.matrixWorld.elements].every(
          (value: number, i: number): boolean => nclose(value, unchanged[slot]![i]!, 0),
        ),
      ),
    );
  }
  check(
    "invalid palette refuses",
    throwsError((): void => drawing.setPartColors({ leftLowerArm: -1 })),
  );
  const front: number | undefined = drawing.head.frontAt(0.02, 0);
  check(
    "actual front query remains source-owned",
    front !== undefined && nclose(front, 0.1, 1e-7),
  );
  const neutralFace: ReturnType<typeof buildHumanCartoonFace> = buildHumanCartoonFace(drawing.head);
  check("omitted expression draws neutral closed mouth", neutralFace.unsupported.length === 0 && neutralFace.object.children.some((object: THREE.Object3D): boolean => object.name === "human.cartoon.mouth.closed"));
  neutralFace.dispose();
  const face: ReturnType<typeof buildHumanCartoonFace> = buildHumanCartoonFace(
    drawing.head,
    {
      units: [
        { unit: "lipCornerPuller", intensity: 0.6, side: "both" },
        { unit: "unrepresentedAction", intensity: 0.5, side: "left" },
      ],
      mouth: { tongue: {} },
    },
    { jaw: { opening: 5 }, eyes: { left: { horizontal: 10 } } },
  );
  drawing.head.object.add(face.object);
  check(
    "face reports unsupported input explicitly",
    face.unsupported.includes("unrepresentedAction") &&
      face.unsupported.includes("mouth.tongue") &&
      face.object.children.some(
        (object: THREE.Object3D): boolean =>
          object.name === "human.cartoon.mouth.open",
      ),
  );
  const geometries: Set<THREE.BufferGeometry> = new Set();
  const materials: Set<THREE.Material> = new Set();
  drawing.object.traverse((object: THREE.Object3D): void => {
    if (object === face.object || face.object.children.includes(object)) return;
    const mesh: THREE.Mesh = object as THREE.Mesh;
    if (mesh.geometry !== undefined) geometries.add(mesh.geometry);
    if (mesh.material !== undefined)
      for (const material of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material])
        materials.add(material);
  });
  let geometryDisposals: number = 0;
  let materialDisposals: number = 0;
  let faceDisposals: number = 0;
  for (const geometry of geometries)
    geometry.addEventListener("dispose", (): void => {
      geometryDisposals++;
    });
  for (const material of materials)
    material.addEventListener("dispose", (): void => {
      materialDisposals++;
    });
  (face.object.children[0] as THREE.Mesh).geometry.addEventListener(
    "dispose",
    (): void => {
      faceDisposals++;
    },
  );
  drawing.dispose();
  drawing.dispose();
  check(
    "owned geometry and materials retire once",
    geometryDisposals === geometries.size &&
      materialDisposals === materials.size,
  );
  check("attached face remains separately owned", faceDisposals === 0);
  check(
    "terminal drawing clears registries",
    drawing.parts.size === 0 &&
      drawing.bones.size === 0 &&
      drawing.bindings.size === 0 &&
      drawing.object.parent === null,
  );
  check(
    "terminal pose and palette refuse",
    throwsError((): void => drawing.setPose(input)) &&
      throwsError((): void => drawing.setPartColors()),
  );
  face.dispose();
  check("face owner retires its geometry", faceDisposals === 1);
  TestValidator.equals(
    "original polygon public geometry and pose contract",
    defects,
    [],
  );
}
