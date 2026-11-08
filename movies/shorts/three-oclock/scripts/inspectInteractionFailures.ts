import type { AutoMovieHumanGrounding, IAutoMovieHumanPose } from "@automovie/human";
import { writeFile } from "node:fs/promises";
import * as THREE from "three";

import { createArmControls } from "../src/actors/createArmControls";
import { createFootControls } from "../src/actors/createFootControls";
import { createHumanActor } from "../src/actors/createHumanActor";
import { createHumanParameters } from "../src/actors/createHumanParameters";
import { createNoteGrip } from "../src/actors/createNoteGrip";
import { evaluateExchange } from "../src/actors/evaluateExchange";

/**
 * Complete one read-only physical failure round through the real public consumer.
 *
 * @evidence contracts/common.md#implementation-and-ownership Reconstructs the original two actor factories with neck/foot surfaces and real shoes, runs the unchanged current foot/arm callers on every known failed support plus adjacent cases, and preserves full numerical reasons, iterations, bounds and actual hand skin triangles. At32/34s it derives the actual sheet from Carina's unchanged pinch and intersects receiver skin triangles with that finite box. No options, goals, solver budget or source geometry change and no successful-delivery claim enters this diagnostic.
 * @evidence contracts/common.md#authoring-interface Run from this production using ttsx; writes only raw .cache/motion-viewer/post-rollback-round/physical-detail.json. Original exact evaluated parameters and source-stage frame indices accompany data. The scene's saved865rows must independently match these repeated caller results before using them to classify causes. This is CPU geometry inspection, not actual Viewer/playback or a candidate repair. All temporary actor/mesh resources retire after collection.
 */
export async function inspectInteractionFailures(): Promise<void> {
  const failures: Record<"carina" | "harry", number[]> = { carina: [3, 315, 630, 642], harry: [368, 390, 412, 441, 442, 453, 454] };
  type Packet = { bone: string; vertices: number[][]; triangles: number[] };
  type Detail = { point: number[]; normal?: number[]; parts: Packet[]; paper?: { position: number[]; quaternion: number[] } };
  const details: Record<string, Partial<Record<"carina" | "harry", Detail>>> = {};
  const cases: object[] = [];
  const parameters: object = { carina: createHumanParameters("carina"), harry: createHumanParameters("harry") };
  const paper: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.15, 0.1), new THREE.MeshBasicMaterial());
  for (const person of ["carina", "harry"] as const) {
    const actor: ReturnType<typeof createHumanActor> = createHumanActor(person);
    try {
      const feet: ReturnType<typeof createFootControls> = createFootControls(actor);
      const grip: ReturnType<typeof createNoteGrip> | undefined = person === "carina" ? createNoteGrip(actor) : undefined;
      const arms: ReturnType<typeof createArmControls> = createArmControls(actor, grip?.anchor);
      const frames: number[] = [...new Set([...failures[person].flatMap((frame: number): number[] => [frame - 1, frame, frame + 1]), 768, 816])].sort((a: number, b: number): number => a - b);
      for (const frame of frames) {
        const action: ReturnType<typeof evaluateExchange> = evaluateExchange(person, frame / 24, feet.reference);
        if (grip !== undefined) { action.pose.arms!.right.hand = grip.hand; action.pose.arms!.right.forearm = { pronation: grip.forearmPronation }; }
        actor.object.position.copy(action.position); actor.object.rotation.set(0, action.heading, 0); actor.object.updateMatrixWorld(true);
        const fitted: AutoMovieHumanGrounding.IResult = feet.fit({}, action.left, action.right);
        actor.object.position.fromArray(fitted.root.translation); actor.object.updateMatrixWorld(true);
        let pose: IAutoMovieHumanPose = { ...fitted.pose, ...(action.pose.arms === undefined ? {} : { arms: action.pose.arms }), ...(action.pose.head === undefined ? {} : { head: action.pose.head }),
          ...(action.pose.spine === undefined ? {} : { spine: action.pose.spine }), ...(action.pose.neck === undefined ? {} : { neck: action.pose.neck }) };
        let armError: number = 0;
        if (action.rightTarget !== undefined) { const result: ReturnType<typeof arms.fit> = arms.fit(pose, action.rightTarget, action.targetWeight ?? 1); pose = result.pose; armError = result.error; }
        const output: ReturnType<typeof actor.setPose> = actor.setPose(pose, action.face);
        cases.push({ person, frame, status: fitted.status, error: fitted.error, supportError: fitted.supportError, floorMinimum: fitted.floorMinimum,
          iterations: fitted.iterations, reason: fitted.reason, activeBounds: fitted.activeBounds, quadratic: fitted.quadratic, armError, pose, root: fitted.root,
          leftGoal: action.left.toArray(), rightGoal: action.right.toArray(), clamped: output.clamped });
        if (frame !== 768 && frame !== 816) continue;
        const parts: Packet[] = [];
        for (const [bone, mesh] of actor.drawing.parts) {
          if (!actor.rightHandParts.includes(mesh)) continue;
          const attribute: THREE.BufferAttribute = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
          const vertices: number[][] = Array.from({ length: attribute.count }, (_value: unknown, index: number): number[] => mesh.localToWorld(new THREE.Vector3().fromBufferAttribute(attribute, index)).toArray());
          const indices: THREE.BufferAttribute | null = mesh.geometry.getIndex();
          parts.push({ bone, vertices, triangles: indices === null ? Array.from({ length: attribute.count }, (_value: unknown, index: number): number => index) : Array.from(indices.array) });
        }
        const detail: Detail = { point: actor.point("rightHand", new THREE.Vector3(...arms.anchor.localPoint)).toArray(), parts };
        if (arms.palmNormal !== undefined) detail.normal = arms.palmNormal.clone().transformDirection(actor.drawing.bones.get("rightHand")!.matrixWorld).toArray();
        if (grip !== undefined) { grip.update(paper); detail.paper = { position: paper.position.toArray(), quaternion: paper.quaternion.toArray() }; }
        (details[frame] ??= {})[person] = detail;
      }
    } finally { actor.dispose(); }
  }
  const intersections: object[] = [];
  paper.geometry.computeBoundingBox();
  for (const [frame, pair] of Object.entries(details)) {
    const sheet: NonNullable<Detail["paper"]> = pair.carina!.paper!;
    const inverse: THREE.Matrix4 = new THREE.Matrix4().compose(new THREE.Vector3(...sheet.position), new THREE.Quaternion(...sheet.quaternion), new THREE.Vector3(1, 1, 1)).invert();
    const hits: { bone: string; triangles: number[] }[] = [];
    for (const part of pair.harry!.parts) {
      const triangles: number[] = [];
      for (let index: number = 0; index < part.triangles.length; index += 3) {
        const points: THREE.Vector3[] = [0, 1, 2].map((offset: number): THREE.Vector3 => new THREE.Vector3(...part.vertices[part.triangles[index + offset]!]!).applyMatrix4(inverse));
        if (paper.geometry.boundingBox!.intersectsTriangle(new THREE.Triangle(points[0]!, points[1]!, points[2]!))) triangles.push(index / 3);
      }
      if (triangles.length !== 0) hits.push({ bone: part.bone, triangles });
    }
    intersections.push({ frame: Number(frame), receiverPaperIntersections: hits });
  }
  await writeFile(".cache/motion-viewer/post-rollback-round/physical-detail.json", JSON.stringify({ scope: "Read-only original caller reconstruction; no delivery admission", parameters, cases, details, intersections }, null, 2) + "\n");
  paper.geometry.dispose(); (paper.material as THREE.Material).dispose();
  console.log(`Collected ${cases.length} original fit cases and two actual hand/paper geometry packets per cast.`);
}

void inspectInteractionFailures().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
