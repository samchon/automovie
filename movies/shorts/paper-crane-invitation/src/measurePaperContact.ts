import * as THREE from "three";
import { measurePaperSkin } from "./measurePaperSkin";

/**
 * Inspect original material witnesses against the actual finite folded-paper box.
 * @evidence contracts/common.md#implementation-and-ownership Opposite box faces come from the supplied emitted geometry and world transform. Each witness projects onto its own finite face; bounds, three-millimetre surface distances and opposing oriented normals are independent conditions. Every supplied mesh must provide examined finite indexed/nonindexed triangles; malformed/empty coverage, including nonscalar/normalized/unsupported index layouts that differ from raw WebGL element consumption, is retained as invalid rather than silently passing. Every supplied original skin triangle is transformed into this same box frame and tested against its interior inset by one micrometre to distinguish boundary touch. Original geometric edge closure and three-ray parity also reject a tab fully contained inside a skin solid without crossing its boundary; open, ambiguous and boundary shells stay invalid coverage. Raw pair distance is telemetry, not a coincidence objective. No geometry or pose changes.
 * @evidence contracts/common.md#authoring-interface Supply the real paper base mesh, transported index/thumb points and normals, and original hand meshes. Result certifies these finite tab contacts/interior intersections only; it does not certify wing collisions, force balance or the complete scene. Caller retains ownership timing and visual inspection.
 */
export function measurePaperContact(base: THREE.Mesh, contact: { index: THREE.Vector3; thumb: THREE.Vector3; indexNormal: THREE.Vector3; thumbNormal: THREE.Vector3 }, skin: readonly THREE.Mesh[]): { valid: boolean; frontError: number; backError: number; withinFaces: boolean; normalAlignment: [number,number]; intersections: number; containments:number; trianglesExamined: number; coverageComplete: boolean; invalidMeshes: string[]; triangleCoverage: {name:string;examined:number;intersections:number;closed:boolean;containsPaper:boolean;determinate:boolean}[] } {
  if (!(base.geometry instanceof THREE.BoxGeometry) || skin.length === 0) throw new Error("Paper contact requires the emitted box and nonempty original skin");
  base.updateWorldMatrix(true,false);
  base.geometry.computeBoundingBox();
  const bounds: THREE.Box3 | null = base.geometry.boundingBox;
  if(!bounds)throw new Error("Paper contact requires finite emitted bounds");
  const normal: THREE.Vector3 = new THREE.Vector3(0,0,1).transformDirection(base.matrixWorld);
  const i: THREE.Vector3 = base.worldToLocal(contact.index.clone());
  const t: THREE.Vector3 = base.worldToLocal(contact.thumb.clone());
  const within: (p: THREE.Vector3) => boolean = (p: THREE.Vector3): boolean => p.x>=bounds.min.x && p.x<=bounds.max.x && p.y>=bounds.min.y && p.y<=bounds.max.y;
  const withinFaces: boolean = within(i)&&within(t);
  const face: (p: THREE.Vector3,z: number) => THREE.Vector3 = (p: THREE.Vector3,z: number): THREE.Vector3 => base.localToWorld(new THREE.Vector3(THREE.MathUtils.clamp(p.x,bounds.min.x,bounds.max.x),THREE.MathUtils.clamp(p.y,bounds.min.y,bounds.max.y),z));
  const frontError: number=contact.index.distanceTo(face(i,bounds.max.z));
  const backError: number=contact.thumb.distanceTo(face(t,bounds.min.z));
  const normalAlignment: [number,number]=[-contact.indexNormal.dot(normal),contact.thumbNormal.dot(normal)];
  const volume:ReturnType<typeof measurePaperSkin>=measurePaperSkin(base,skin);
  const {intersections,containments,trianglesExamined,coverageComplete,invalidMeshes,triangleCoverage}=volume;
  return {valid:volume.valid&&withinFaces&&frontError<=0.003&&backError<=0.003&&normalAlignment.every((v: number): boolean=>Number.isFinite(v)&&v>0.25)&&contact.indexNormal.dot(contact.thumbNormal)<-0.25&&i.z>=bounds.max.z-0.000001&&t.z<=bounds.min.z+0.000001&&intersections===0&&containments===0,frontError,backError,withinFaces,normalAlignment,intersections,containments,trianglesExamined,coverageComplete,invalidMeshes,triangleCoverage};
}
