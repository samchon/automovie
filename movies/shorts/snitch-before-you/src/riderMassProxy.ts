import * as THREE from "three";

/**
 * Resolve an explicitly authored unit-mass diagnostic from actual FK segments.
 * Fractions are torso.50,head.08,each upperarm.03,forearm.02,hand.005,
 * thigh.10,shin.045,foot.01. They sum to1 and are a coarse scene proxy,
 * not measured teenage anatomy, muscle capacity or injury safety.
 *
 * @evidence contracts/common.md#implementation-and-ownership Uses the actual displayed world joints and fixed disclosed fractions to return centre, point masses and second moment per unit mass. Does not substitute wrist fit for dynamics or infer mass from height.
 * @evidence contracts/common.md#authoring-interface Accepts a world-metre joint reader and returns owned vectors. Missing joint handling belongs to that reader. The caller derives velocities, forces and angular momentum over the common clock; this function supplies no balance verdict.
 */
export function riderMassProxy(point: (bone: string) => THREE.Vector3): { centre: THREE.Vector3; points: { weight: number; position: THREE.Vector3 }[]; secondMoment: number } {
  const points: { weight: number; position: THREE.Vector3 }[] = [
    { weight: 0.50, position: point("hips").lerp(point("neck"), 0.5) },
    { weight: 0.08, position: point("head") },
  ];
  for (const side of ["left", "right"] as const) {
    for (const [from, to, weight] of [["UpperArm", "LowerArm", 0.03], ["LowerArm", "Hand", 0.02], ["UpperLeg", "LowerLeg", 0.10], ["LowerLeg", "Foot", 0.045]] as const)
      points.push({ weight, position: point(side + from).lerp(point(side + to), 0.5) });
    points.push({ weight: 0.005, position: point(side + "Hand") }, { weight: 0.01, position: point(side + "Foot") });
  }
  const centre: THREE.Vector3 = points.reduce((c: THREE.Vector3, p: { weight: number; position: THREE.Vector3 }): THREE.Vector3 => c.addScaledVector(p.position, p.weight), new THREE.Vector3());
  const secondMoment: number = points.reduce((sum: number, p: { weight: number; position: THREE.Vector3 }): number => sum + p.weight * p.position.distanceToSquared(centre), 0);
  return { centre, points, secondMoment };
}
