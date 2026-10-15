import {
  type AutoMovieSurfaceTier,
  type IAutoMovieResolvedBone,
  type IAutoMovieSurfaceCage,
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSurfaceRig,
  type IAutoMovieSweepBinding,
  poseAutoMovieSurfaceNetwork,
  rigAutoMovieSurfaceNetwork,
  sampleAutoMovieSurfaceNetwork,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { type IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/namedFacts";

/** An arm-like tube 0.6 m long and 0.04 m in radius along `+X`, its spine through the shoulder, elbow and wrist, open at both ends. */
const ARM: IAutoMovieSurfaceNetwork = {
  sweeps: {
    arm: {
      spine: { points: [{ x: 0, y: 0, z: 0 }, { x: 0.3, y: 0, z: 0 }, { x: 0.6, y: 0, z: 0 }], normal: { x: 0, y: 1, z: 0 } },
      stations: [0, 0.25, 0.5, 0.75, 1].map((at: number) => ({
        at,
        section: { type: "superellipse" as const, right: 0.04, up: 0.04, left: 0.04, down: 0.04, exponents: [2, 2, 2, 2] as [number, number, number, number] },
      })),
    },
  },
  patches: [
    {
      type: "sweep",
      name: "arm",
      sweep: "arm",
      u: [0, 1],
      v: [0, 1],
      rows: { lowest: 4, low: 8, medium: 16, high: 32 },
      columns: { lowest: 4, low: 8, medium: 12, high: 16 },
    },
  ],
};

/** The tube on the upper arm and forearm, with a joint station at the elbow. */
const BINDING: IAutoMovieSweepBinding = {
  points: ["leftUpperArm", "leftLowerArm", "leftLowerArm"],
  stations: [["leftUpperArm"], ["leftUpperArm"], ["leftUpperArm", "leftLowerArm"], ["leftLowerArm"], ["leftLowerArm"]],
};

const bone = (name: IAutoMovieResolvedBone["bone"], x: number, rotation: IAutoMovieQuaternion): IAutoMovieResolvedBone => ({
  bone: name,
  localRotation: rotation,
  worldPosition: { x, y: 0, z: 0 },
  worldRotation: rotation,
});

/** Volume enclosed by a cage's subdivided limit surface with each open end closed by a fan from its centroid, by the divergence theorem. */
const enclosed = (positions: ArrayLike<number>, faces: number[][]): number => {
  const surface = subdivideAutoMovieSurface({ cage: { positions: Array.from(positions), faces }, levels: 2 });
  const p = (i: number): number[] => [surface.limitPositions[3 * i]!, surface.limitPositions[3 * i + 1]!, surface.limitPositions[3 * i + 2]!];
  let volume: number = 0;
  const triangle = (a: number[], b: number[], c: number[]): void => {
    volume += (a[0]! * (b[1]! * c[2]! - b[2]! * c[1]!) - a[1]! * (b[0]! * c[2]! - b[2]! * c[0]!) + a[2]! * (b[0]! * c[1]! - b[1]! * c[0]!)) / 6;
  };
  const directed: Set<string> = new Set();
  for (let f: number = 0; f < surface.faces.length / 4; ++f) {
    const q: number[] = [0, 1, 2, 3].map((k: number): number => surface.faces[4 * f + k]!);
    triangle(p(q[0]!), p(q[1]!), p(q[2]!));
    triangle(p(q[0]!), p(q[2]!), p(q[3]!));
    for (let k: number = 0; k < 4; ++k) directed.add(`${q[k]},${q[(k + 1) % 4]}`);
  }
  // each boundary loop, followed against its faces' winding, closed by a fan from its centroid
  const next: Map<number, number> = new Map();
  for (const edge of directed) {
    const [a, b] = edge.split(",").map(Number) as [number, number];
    if (!directed.has(`${b},${a}`)) next.set(b, a);
  }
  const seen: Set<number> = new Set();
  for (const start of next.keys()) {
    if (seen.has(start)) continue;
    const loop: number[] = [];
    let k: number = start;
    do {
      loop.push(k);
      seen.add(k);
      k = next.get(k)!;
    } while (k !== start);
    const centre: number[] = [0, 1, 2].map((axis: number): number => loop.reduce((sum: number, i: number): number => sum + p(i)[axis]!, 0) / loop.length);
    loop.forEach((i: number, j: number): void => triangle(centre, p(i), p(loop[(j + 1) % loop.length]!)));
  }
  return volume;
};

/**
 * Volume preservation keeps a re-swept tube's rest volume at a 120-degree
 * bend, measured independently on its subdivided limit surface.
 *
 * Scenarios:
 *
 * 1. Posed with volume preservation, the rig writes the cage that sampling
 *    the posed network gives, within 1e-9 m.
 * 2. The measurement matches the cylinder's `pi r^2 L` at rest within 0.5
 *    percent.
 * 3. An arm tube bent 120 degrees at the elbow keeps its rest volume within
 *    0.5 percent with volume preservation at the medium tier, while plain
 *    re-sweeping changes it by more than 1 percent.
 *
 * @evidence contracts/testing.md#behavioral-verification Poses rigs of a bound tube with `rigAutoMovieSurfaceNetwork` and measures their limit surfaces; a rig that skipped the joint rescale, settled it against a wrong volume or scaled the wrong stations fails, while any rescale that restores the measured volume passes.
 * @evidence contracts/testing.md#independent-expectations The volume is the divergence theorem over the twice-subdivided limit surface closed by centroid fans, checked against the cylinder's volume at rest, not the engine's swept-volume integral; the record path is the engine's separate posing and sampling. Its limitation: a self-intersecting region would count twice, which this radius and bend avoid.
 * @evidence contracts/testing.md#distinguishing-cases Covers preserved and plain posing, the oracle at rest and the rig against the record path under preservation; that equality on the branched body is owned by the rig pose test.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_rig_volume` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_rig_volume(): void {
  const straight: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const elbow: IAutoMovieQuaternion = { x: 0, y: 0, z: Math.sin(Math.PI / 3), w: Math.cos(Math.PI / 3) };
  const rest: IAutoMovieResolvedBone[] = [bone("leftUpperArm", 0, straight), bone("leftLowerArm", 0.3, straight)];
  const bent: IAutoMovieResolvedBone[] = [bone("leftUpperArm", 0, straight), bone("leftLowerArm", 0.3, elbow)];
  const bindings: { sweeps: Record<string, IAutoMovieSweepBinding> } = { sweeps: { arm: BINDING } };
  const rests: Map<AutoMovieSurfaceTier, number> = new Map();
  const ratio = (tier: AutoMovieSurfaceTier, preserveVolume: boolean): number => {
    const rig: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({ network: ARM, tier, bindings, rest, preserveVolume });
    const positions: Float64Array = new Float64Array(rig.cage.cage.positions.length);
    rig.pose(bent, positions);
    if (!rests.has(tier)) rests.set(tier, enclosed(rig.cage.cage.positions, rig.cage.cage.faces));
    return enclosed(positions, rig.cage.cage.faces) / rests.get(tier)!;
  };
  const record: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network: poseAutoMovieSurfaceNetwork({ network: ARM, bindings, rest, posed: bent, preserveVolume: true }),
    tier: "medium",
  });
  const preserved: Float64Array = new Float64Array(record.cage.positions.length);
  rigAutoMovieSurfaceNetwork({ network: ARM, tier: "medium", bindings, rest, preserveVolume: true }).pose(bent, preserved);
  TestValidator.equals(
    "volume preservation keeps the rest volume at a 120-degree bend",
    namedFacts([
      ["record", (): boolean => preserved.every((x: number, k: number): boolean => Math.abs(x - record.cage.positions[k]!) <= 1e-9)],
      ["medium", (): boolean => Math.abs(ratio("medium", true) - 1) < 0.005],
      ["oracle", (): boolean => Math.abs(rests.get("medium")! / (Math.PI * 0.04 * 0.04 * 0.6) - 1) < 0.005],
      ["plain", (): boolean => Math.abs(ratio("medium", false) - 1) > 0.01],
    ]),
    { record: true, medium: true, oracle: true, plain: true },
  );
}
