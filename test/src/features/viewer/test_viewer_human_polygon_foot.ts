import { AutoMovieHumanSkeleton as Skeleton } from "@automovie/human";
import { type AutoMovieHumanPolygon as Polygon, type AutoMovieHumanPolygonFoot as Foot, buildHumanPolygon } from "@automovie/viewer/human-polygon";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { HumanPeople } from "../internal/HumanPeople";
import { nclose } from "../internal/predicates";

/**
 * Real Human source feet reach the original emitter without losing identity.
 *
 * Scenarios:
 * 1. Male/female canonical feet preserve every course point, source landmark
 * address and neutral shared seam in the actual Float32 module attributes.
 * 2. Every other original part, including toes, keeps identical buffers.
 * 3. Actual whole-foot vertices determine initial height/contact metadata;
 * named landmarks retain intrinsic heights rather than a fitted contact plane.
 * 4. A clinical Midfoot/toe pose moves the separately bound modules, preserves
 * geometry and fixed initial metadata, and leaves the hindfoot in its own frame.
 *
 * @evidence contracts/testing.md#behavioral-verification Prepares actual public Human evaluators using existing calibrated people, builds the public original polygon with/without its optional source feet, reads actual mesh attributes/world matrices and applies a real clinical articulated pose. Checks all source vertices, emitted witness addresses, initial seam, nonfoot/toe buffer parity, full-foot support and independent module motion.
 * @evidence contracts/testing.md#independent-expectations Source vertex i at course c must occupy Float32(source minus its owning rest joint) at c*N+i; this registered-frame identity is independent of the emitter. A shared source seam must coincide after neutral placement within serialization error. Full-foot minimum is independently reduced over the actual Foot descendant meshes, including toes; numerical-contact subset follows their actual heights rather than an assumed three-point floor. Clinical Midfoot motion must not rotate its ancestor Subtalar.
 * @evidence contracts/testing.md#distinguishing-cases Covers bilateral male/female sources, all retained courses, nonuniform source phases, complete toe population, legacy omission, neutral and articulated placement, immutable descriptor sharing and fixed measurement lifetime. It does not claim continuous skin, watertight joints, floor admission for an authored pose or rendered appearance.
 * @evidence contracts/testing.md#execution-ownership One discoverable CPU unit uses public Human Skeleton and Viewer polygon entries over HumanPeople's existing calibration, owns/disposes its Three geometry, and starts no dense skin, renderer, browser, process or installation. The operator owns execution and actual visual review.
 */
export function test_viewer_human_polygon_foot(): void {
  const defects: string[] = [];
  for (const name of ["m1", "f1"]) {
    const person: HumanPeople.IPerson = HumanPeople.person(name);
    const evaluate: Skeleton.PoseEvaluator = Skeleton.prepare(person.params, { calibration: person.body, neckSurface: true, footSurface: true });
    const input: Polygon.IInput = evaluate({});
    const source: Readonly<Foot.IInput> = input.footSurface!;
    const sourceBefore: string = JSON.stringify(source);
    const drawing: Polygon.IDrawing = buildHumanPolygon(input);
    const legacy: Polygon.IDrawing = buildHumanPolygon({ bones: input.bones, posed: input.posed, neckSurface: input.neckSurface });
    const check: (label: string, valid: boolean) => void = (label: string, valid: boolean): void => { if (!valid) defects.push(`${name}: ${label}`); };
    try {
      check("legacy does not invent plantar observations", legacy.plantarLandmarks === undefined && legacy.plantarSupport === undefined);
      for (const [bone, mesh] of drawing.parts) {
        if (/^(left|right)(Subtalar|Midfoot)$/.test(bone)) continue;
        const other: THREE.Mesh = legacy.parts.get(bone)!;
        const actual: ArrayLike<number> = mesh.geometry.getAttribute("position").array;
        const expected: ArrayLike<number> = other.geometry.getAttribute("position").array;
        check(`${bone} unchanged original vertices`, actual.length === expected.length && Array.from(actual).every((value: number, index: number): boolean => value === expected[index]));
        const indices: ArrayLike<number> = mesh.geometry.index!.array;
        const oldIndices: ArrayLike<number> = other.geometry.index!.array;
        check(`${bone} unchanged original triangles`, indices.length === oldIndices.length && Array.from(indices).every((value: number, index: number): boolean => value === oldIndices[index]));
      }
      for (const side of ["left", "right"] as const) {
        const foot: Foot.ISide = source[side];
        for (const module of [foot.hindfoot, foot.forefoot]) {
          const mesh: THREE.Mesh = drawing.parts.get(module.bone)!;
          const positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
          const rest: Polygon.IBone = input.bones.find((bone: Polygon.IBone): boolean => bone.bone === module.bone)!;
          const count: number = module.courses[0]!.points.length;
          for (let course: number = 0; course < module.courses.length; course++)
            for (let point: number = 0; point < count; point++) {
              const at: number = course * count + point;
              const value: [number, number, number] = module.courses[course]!.points[point]!;
              check(`${module.bone}/${course}/${point} source identity`, positions.getX(at) === Math.fround(value[0] - rest.position[0]) && positions.getY(at) === Math.fround(value[1] - rest.position[1]) && positions.getZ(at) === Math.fround(value[2] - rest.position[2]));
            }
        }
        const read: (bone: Foot.Bone, index: number) => THREE.Vector3 = (bone: Foot.Bone, index: number): THREE.Vector3 => {
          const mesh: THREE.Mesh = drawing.parts.get(bone)!;
          return new THREE.Vector3().fromBufferAttribute(mesh.geometry.getAttribute("position"), index).applyMatrix4(mesh.matrixWorld);
        };
        const count: number = foot.hindfoot.courses[0]!.points.length;
        const offset: number = (foot.hindfoot.courses.length - 1) * count;
        for (let point: number = 0; point < count; point++)
          check(`${side} neutral shared seam`, read(foot.hindfoot.bone, offset + point).distanceTo(read(foot.forefoot.bone, point)) < 1e-7);
        const population: Set<string> = new Set([`${side}Foot`]);
        for (const bone of input.bones)
          if (bone.parent !== null && population.has(bone.parent)) population.add(bone.bone);
        let minimum: number = Infinity;
        let toeVertices: number = 0;
        for (const [bone, mesh] of drawing.parts) {
          if (!population.has(bone)) continue;
          const positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
          if (bone !== foot.hindfoot.bone && bone !== foot.forefoot.bone) toeVertices += positions.count;
          for (let index: number = 0; index < positions.count; index++)
            minimum = Math.min(minimum, new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld).y);
        }
        const support: Foot.IPlantarSupport = drawing.plantarSupport![side];
        check(`${side} complete foot/toe minimum`, toeVertices > 0 && minimum === support.minimumHeight);
        const contacts: Foot.Landmark[] = [];
        for (const landmark of ["plantarHeel", "medialBall", "lateralBall"] as const) {
          const address: Foot.ISourceLandmark = foot.landmarks[landmark];
          const module: Foot.IModule = foot[address.module];
          const witness: Foot.IEmittedLandmark = drawing.plantarLandmarks![side][landmark];
          const index: number = address.course * module.courses[0]!.points.length + address.point;
          const positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = drawing.parts.get(module.bone)!.geometry.getAttribute("position");
          check(`${side}/${landmark} exact emitted address`, witness.bone === module.bone && witness.vertexIndex === index && witness.localPoint[0] === positions.getX(index) && witness.localPoint[1] === positions.getY(index) && witness.localPoint[2] === positions.getZ(index));
          const height: number = read(witness.bone, witness.vertexIndex).y;
          check(`${side}/${landmark} actual initial height`, height === support.landmarkHeights[landmark]);
          if (Math.abs(height - minimum) <= support.measurementTolerance) contacts.push(landmark);
        }
        check(`${side} truthful contact subset`, contacts.join() === support.contactLandmarks.join());
        check(`${side} numerical bound is finite and small`, Number.isFinite(support.measurementTolerance) && support.measurementTolerance > 0 && support.measurementTolerance < 1e-5);
      }
      const originalSupport: unknown = drawing.plantarSupport;
      const originalWitnesses: unknown = drawing.plantarLandmarks;
      const hind: THREE.Matrix4 = drawing.parts.get("leftSubtalar")!.matrixWorld.clone();
      const front: THREE.Matrix4 = drawing.parts.get("leftMidfoot")!.matrixWorld.clone();
      const toe: THREE.Matrix4 = drawing.parts.get("leftHalluxProximal")!.matrixWorld.clone();
      const posed: Skeleton.IOutput = evaluate({ legs: { left: { foot: { midfootSupination: 8, hallux: { mtpFlexion: 12 } } }, right: {} } });
      drawing.setPose(posed);
      check("source descriptor shared, never mutated", posed.footSurface === source && JSON.stringify(source) === sourceBefore && Object.isFrozen(source.left.hindfoot.courses[0]!.points[0]));
      check("Subtalar remains independent", drawing.parts.get("leftSubtalar")!.matrixWorld.elements.every((value: number, index: number): boolean => nclose(value, hind.elements[index]!, 1e-12)));
      check("Midfoot articulates in its own module", !drawing.parts.get("leftMidfoot")!.matrixWorld.equals(front));
      check("Hallux retains separate articulation", !drawing.parts.get("leftHalluxProximal")!.matrixWorld.equals(toe));
      check("initial support references stay fixed under pose", drawing.plantarSupport === originalSupport && drawing.plantarLandmarks === originalWitnesses);
    } finally {
      drawing.dispose();
      legacy.dispose();
    }
  }
  TestValidator.equals("actual original polygon source feet, articulation and full support population", defects, []);
}
