import * as THREE from "three";

/**
 * Inspect two real world skin witnesses against a placed finite paper mesh.
 *
 * @evidence contracts/common.md#implementation-and-ownership Reads actual geometry bounds and current rigid world transform, converts original world witnesses into that frame and requires opposite exterior thickness faces, finite in-face projections and the supplied exterior clearance per face (default1mm, explicit new-tail3mm). It refuses penetration and degenerate/scaled placement. A scalar finger gap cannot pass a translated or misoriented sheet. This is two-point coarse contact, not friction or full-hand collision proof.
 * @evidence contracts/common.md#authoring-interface The paper's thin dimension is localX, localY is its height and localZ its width, all metres. Supply actual current skin points, index on negativeX and other on positiveX. The default1mm retains the accepted earlier sequence; the new pickup explicitly supplies the same3mm coarse allowance as body/arm reach. tolerance must be finite and nonnegative. Neither policy permits an interior face or beyond-edge point;1e-8m edge slack handles floating-point equality at the held edge. Original IK target residual is independent of this measurement.
 */
export function measurePaperContact(paper: THREE.Mesh, first: THREE.Vector3, second: THREE.Vector3, tolerance: number = 0.001): {
  admitted: boolean;
  error: number;
  oppositeExteriorSides: boolean;
  insideFiniteFaces: boolean;
  localWitnesses: [number[], number[]];
} {
  paper.updateWorldMatrix(true, false);
  paper.geometry.computeBoundingBox();
  const bounds: THREE.Box3 | null = paper.geometry.boundingBox;
  const position: THREE.Vector3 = new THREE.Vector3();
  const rotation: THREE.Quaternion = new THREE.Quaternion();
  const scale: THREE.Vector3 = new THREE.Vector3();
  paper.matrixWorld.decompose(position, rotation, scale);
  const valid: boolean = bounds !== null && Number.isFinite(tolerance) && tolerance >= 0 && [...first.toArray(), ...second.toArray(), ...paper.matrixWorld.elements].every(Number.isFinite)
    && Math.abs(paper.matrixWorld.determinant() - 1) < 1e-6 && scale.toArray().every((value: number): boolean => Math.abs(value - 1) < 1e-6);
  if (!valid) return { admitted: false, error: Infinity, oppositeExteriorSides: false, insideFiniteFaces: false, localWitnesses: [[], []] };
  const a: THREE.Vector3 = paper.worldToLocal(first.clone());
  const b: THREE.Vector3 = paper.worldToLocal(second.clone());
  const oppositeExteriorSides: boolean = a.x <= bounds!.min.x + 1e-9 && b.x >= bounds!.max.x - 1e-9;
  const insideFiniteFaces: boolean = [a, b].every((point: THREE.Vector3): boolean => point.y >= bounds!.min.y - 1e-8 && point.y <= bounds!.max.y + 1e-8 && point.z >= bounds!.min.z - 1e-8 && point.z <= bounds!.max.z + 1e-8);
  const error: number = Math.max(Math.abs(a.x - bounds!.min.x), Math.abs(b.x - bounds!.max.x));
  return { admitted: oppositeExteriorSides && insideFiniteFaces && error <= tolerance, error, oppositeExteriorSides, insideFiniteFaces, localWitnesses: [a.toArray(), b.toArray()] };
}
