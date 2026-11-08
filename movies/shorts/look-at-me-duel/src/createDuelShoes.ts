import { AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type AutoMovieHumanSupportFrame, type IAutoMovieHumanPose } from "@automovie/human";
import type { AutoMovieHumanPolygon } from "@automovie/viewer/human-polygon";
import * as THREE from "three";

/** One actual emitted shoe-sole point in its registered rigid bone frame. */
type SolePoint = AutoMovieHumanSupportFrame.IPoint;

/**
 * Construct two closed school shoes over the actual neutral foot/toe population.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public FK places the actual foot/toe vertices at the movie's0/−5/−15degree MTP controls. Their union dimensions a padded bevelled closed loft with a flat sole; its underside stays below the complete Human foot population. Original Human surfaces remain present. Every emitted shoe vertex joins the floor constraints. Actual Float32 heel and front-sole witnesses belong to this same shell; the front witness permits a forefoot pivot without driving a rigid toe extension into the floor.
 * @evidence contracts/common.md#authoring-interface Supply the matching neutral polygon drawing/output and evaluator before actor-root placement. Body axes are+X forward,+Y up,+Z left; sampled public placements convert mesh vertices into this frame before shoe points convert once into the actual Subtalar frame. The anatomical toe controls remain inside the rigid shoe only over the inspected range; changed midfoot/toe controls require renewed containment. Returned ball fields name front-sole witnesses, not anatomical landmarks. Dispose owned meshes/material once.
 */
export function createDuelShoes(drawing: AutoMovieHumanPolygon.IDrawing, rest: AutoMovieHumanSkeleton.IOutput, evaluate: AutoMovieHumanSkeleton.PoseEvaluator): {
  points: readonly SolePoint[];
  ball: { left: SolePoint; right: SolePoint };
  heel: { left: SolePoint; right: SolePoint };
  parts: ReadonlyMap<"left" | "right", THREE.Mesh>;
  dispose: () => void;
} {
  const parents: Map<string, string | null> = new Map(rest.bones.map((bone: AutoMovieHumanSkeleton.IBone): [string, string | null] => [bone.bone, bone.parent]));
  const points: SolePoint[] = [];
  const balls: { left?: SolePoint; right?: SolePoint } = {};
  const heels: { left?: SolePoint; right?: SolePoint } = {};
  const parts: Map<"left" | "right", THREE.Mesh> = new Map();
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0x111719, roughness: 0.85 });
  drawing.object.updateWorldMatrix(true, true);
  for (const side of ["left", "right"] as const) {
    const parent: THREE.Group | undefined = drawing.bones.get(`${side}Subtalar`);
    if (parent === undefined) throw new Error(`Missing actual ${side} shoe attachment`);
    const cloud: THREE.Vector3[] = [];
    const samples: AutoMovieHumanSkeleton.IOutput[] = [0, -5, -15].map((mtpFlexion: number): AutoMovieHumanSkeleton.IOutput => {
      const toe: { mtpFlexion: number } = { mtpFlexion };
      const foot: NonNullable<NonNullable<IAutoMovieHumanPose["legs"]>["left"]["foot"]> = { hallux: toe, second: toe, third: toe, fourth: toe, fifth: toe };
      return evaluate({ legs: { left: { foot }, right: { foot } } });
    });
    let wholeMinimum: number = Infinity;
    for (const [bone, mesh] of drawing.parts) {
      let ancestor: string | null | undefined = bone;
      while (ancestor !== undefined && ancestor !== null && ancestor !== `${side}Foot`) ancestor = parents.get(ancestor);
      if (ancestor !== `${side}Foot`) continue;
      const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
      for (const sample of samples) {
        const placement: AutoMovieHumanSkeleton.IPlacement = sample.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === bone)!;
        for (let index: number = 0; index < attribute.count; index++) {
          const point: THREE.Vector3 = new THREE.Vector3(attribute.getX(index), attribute.getY(index), attribute.getZ(index)).applyQuaternion(new THREE.Quaternion(...placement.rotation)).add(new THREE.Vector3(...placement.position));
          wholeMinimum = Math.min(wholeMinimum, point.y);
          if (bone !== `${side}Foot`) cloud.push(point);
        }
      }
    }
    if (cloud.length === 0) throw new Error(`Missing actual ${side} foot/toe envelope`);
    const bounds: THREE.Box3 = new THREE.Box3().setFromPoints(cloud);
    const length: number = bounds.max.x - bounds.min.x + 0.024;
    const heelX: number = bounds.min.x - 0.012;
    const ballX: number = heelX + length * 0.65;
    const toeX: number = heelX + length;
    const soleY: number = wholeMinimum - 0.008;
    const centreZ: number = (bounds.min.z + bounds.max.z) / 2;
    const halfWidth: number = (bounds.max.z - bounds.min.z) / 2 + 0.015;
    const upper: number = bounds.max.y + 0.020;
    const stations: { x: number; low: number; high: number; width: number }[] = [
      { x: heelX, low: soleY, high: upper, width: halfWidth },
      { x: ballX, low: soleY, high: upper, width: halfWidth + 0.003 },
      { x: toeX, low: soleY, high: upper, width: halfWidth },
    ];
    const segments: number = 12;
    const positions: number[] = [];
    const indices: number[] = [];
    for (const station of stations) {
      for (let index: number = 0; index < segments; index++) {
        const bevel: number = 0.004;
        const ring: [number, number][] = [[station.low + bevel, station.width], [station.high - bevel, station.width], [station.high, station.width - bevel], [station.high, 0], [station.high, -station.width + bevel], [station.high - bevel, -station.width], [station.low + bevel, -station.width], [station.low, -station.width + bevel], [station.low, -station.width / 2], [station.low, 0], [station.low, station.width / 2], [station.low, station.width - bevel]];
        const point: THREE.Vector3 = new THREE.Vector3(station.x, ring[index]![0], centreZ + ring[index]![1]);
        parent.worldToLocal(point);
        positions.push(point.x, point.y, point.z);
      }
    }
    for (let row: number = 0; row < stations.length - 1; row++) {
      for (let column: number = 0; column < segments; column++) {
        const a: number = row * segments + column;
        const next: number = row * segments + (column + 1) % segments;
        indices.push(a, a + segments, next, a + segments, next + segments, next);
      }
    }
    for (const end of [0, stations.length - 1]) {
      const station: (typeof stations)[number] = stations[end]!;
      const centre: THREE.Vector3 = parent.worldToLocal(new THREE.Vector3(station.x, (station.low + station.high) / 2, centreZ));
      const capIndex: number = positions.length / 3;
      positions.push(centre.x, centre.y, centre.z);
      for (let column: number = 0; column < segments; column++) {
        const a: number = end * segments + column;
        const b: number = end * segments + (column + 1) % segments;
        indices.push(...(end === 0 ? [capIndex, a, b] : [capIndex, b, a]));
      }
    }
    const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
    mesh.name = `closed ${side} school shoe`;
    parent.add(mesh);
    parts.set(side, mesh);
    const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = geometry.getAttribute("position");
    const bone: AutoMovieHumanRigControls.Joint = AutoMovieHumanRigControls.joint(`${side}Subtalar`);
    for (let index: number = 0; index < attribute.count; index++) points.push({ bone, localPoint: [attribute.getX(index), attribute.getY(index), attribute.getZ(index)] });
    heels[side] = { bone, localPoint: [attribute.getX(9), attribute.getY(9), attribute.getZ(9)] };
    const ballIndex: number = segments * 2 + 9;
    balls[side] = { bone, localPoint: [attribute.getX(ballIndex), attribute.getY(ballIndex), attribute.getZ(ballIndex)] };
  }
  return { points, ball: { left: balls.left!, right: balls.right! }, heel: { left: heels.left!, right: heels.right! }, parts,
    dispose: (): void => { for (const mesh of parts.values()) { mesh.removeFromParent(); mesh.geometry.dispose(); } material.dispose(); parts.clear(); },
  };
}
