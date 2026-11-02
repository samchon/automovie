import { TestValidator } from "@nestia/e2e";
import { nclose } from "../internal/nclose";
import { skinAutoMovieMesh } from "../../../../packages/engine/src/skinning/skinAutoMovieMesh";
import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieMeshSkin } from "@automovie/interface";
import { AutoMovieHumanMouth } from "../../../../packages/human/src/generation/AutoMovieHumanMouth";
import { AutoMovieHumanMouthBinding } from "../../../../packages/human/src/generation/AutoMovieHumanMouthBinding";
import { AutoMovieHumanMouthDeformation as Deformation } from "../../../../packages/human/src/expression/AutoMovieHumanMouthDeformation";
import { AutoMovieHumanMouthExpression as Expression } from "../../../../packages/human/src/expression/AutoMovieHumanMouthExpression";


/** Mouth measurement follows the consumer's bind field and declared skinning.
 *
 * Scenarios:
 * 1. Half head and half jaw at a right angle follows the rigid half angle under DQ; the made LBS oracle disagrees.
 * 2. A jaw-fixed interior point leaves a head-fixed posterior box and stays inside its shared-jaw lining.
 * 3. The molar attachment preserves its incoming weights.
 * 4. An enclosed point leaves a lining whose lip field was omitted and remains enclosed when both receive that field.
 *
 * @evidence contracts/testing.md#behavioral-verification Uses the engine's real skinAutoMovieMesh, the live posterior-lining binding helper and the real lip-pucker field. The two made oracle defects, LBS and omission of the lining field, are asserted to fail their correct geometric observations; the corresponding DQ and matching-field cases must pass.
 * @evidence contracts/testing.md#independent-expectations A point ten units from a hinge rotated by a blended 45 degree rigid transform is at (sqrt(50), sqrt(50)); a convex box contains its centre after both undergo the same rigid transform or smooth local field. Directed half-space tests read the actual box triangles and do not read a construction fit. A 1e-10 arithmetic allowance covers double-precision quaternion operations.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts DQ with LBS, matching and mismatched attachments, unchanged molar and posterior transfer, and matching and omitted lining displacement. Whole-person anatomy, aperture topology and all fifteen visemes remain with test_human_mouth.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU test over a synthetic mouth and meshes. It starts no whole-person generation, host, renderer or GPU.
 */
export function test_human_mouth_oracle(): void {
  const problems: string[] = [];
  type V3 = [number, number, number];
  const mouth: AutoMovieHumanMouth.IMouth = AutoMovieHumanMouth.create({
    stomion: 0, width: 25, upper: 5, lower: 6, subnasale: 20,
    menton: -45, sex: 0, gonion: -70, contact: (): number => 0,
    front: (): number => 80,
  }).mouth;
  const bones: (angle: number) => IAutoMovieResolvedBone[] = (angle: number): IAutoMovieResolvedBone[] =>
    (["head", "jaw"] as const).map((bone): IAutoMovieResolvedBone => ({
      bone,
      localRotation: { x: 0, y: 0, z: bone === "jaw" ? Math.sin(angle / 2) : 0, w: bone === "jaw" ? Math.cos(angle / 2) : 1 },
      worldPosition: { x: 0, y: 0, z: 0 },
      worldRotation: { x: 0, y: 0, z: bone === "jaw" ? Math.sin(angle / 2) : 0, w: bone === "jaw" ? Math.cos(angle / 2) : 1 },
    }));
  const mesh: (positions: number[], weights: number[]) => IAutoMovieMesh = (positions: number[], weights: number[]): IAutoMovieMesh => ({
    positions, normals: null, uvs: null, indices: null,
    skin: { joints: ["head", "jaw"], method: "dual-quaternion", weights, boneIndices: positions.flatMap((_, i: number): number[] => i % 3 === 0 ? [0, 1, 0, 0] : []) },
  });
  const check: (label: string, value: boolean) => void = (label: string, value: boolean): void => {
    if (!value) problems.push(label);
  };
  const blended: IAutoMovieMesh = mesh([10, 0, 0], [0.5, 0.5, 0, 0]);
  const dq: number[] = skinAutoMovieMesh(blended, bones(0), bones(Math.PI / 2));
  const linear: number[] = skinAutoMovieMesh({ ...blended, skin: { ...blended.skin!, method: "linear" } }, bones(0), bones(Math.PI / 2));
  const expected: number = Math.sqrt(50);
  check("DQ matches the half-angle rigid rotation", nclose(dq[0]!, expected, 1e-10) && nclose(dq[1]!, expected, 1e-10));
  check("Made LBS oracle rejects the same DQ expectation", Math.hypot(linear[0]! - expected, linear[1]! - expected) > 2);
  
  const box: (centre: V3, half: number) => number[] = (centre: V3, half: number): number[] =>
    Array.from({ length: 8 }, (_: unknown, bit: number): number[] =>
      centre.map((value: number, k: number): number => value + ((bit & (1 << k)) === 0 ? -half : half)),
    ).flat();
  const cubeI: number[] = [0, 2, 3, 0, 3, 1, 4, 5, 7, 4, 7, 6, 0, 1, 5, 0, 5, 4, 2, 6, 7, 2, 7, 3, 0, 4, 6, 0, 6, 2, 1, 3, 7, 1, 7, 5];
  const inside: (P: readonly number[], p: readonly number[]) => boolean = (P: readonly number[], p: readonly number[]): boolean => {
    const centre: V3 = [0, 1, 2].map((k: number): number =>
      Array.from({ length: 8 }, (_: unknown, v: number): number => P[3 * v + k]!).reduce((a: number, b: number): number => a + b, 0) / 8,
    ) as V3;
    for (let t: number = 0; t < cubeI.length; t += 3) {
      const at: (v: number) => V3 = (v: number): V3 => [P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!];
      const a: V3 = at(cubeI[t]!);
      const b: V3 = at(cubeI[t + 1]!);
      const c: V3 = at(cubeI[t + 2]!);
      const u: V3 = b.map((v: number, k: number): number => v - a[k]!) as V3;
      const v: V3 = c.map((x: number, k: number): number => x - a[k]!) as V3;
      const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const side: (q: readonly number[]) => number = (q: readonly number[]): number => n.reduce((sum: number, x: number, k: number): number => sum + x * (q[k]! - a[k]!), 0);
      if (side(p) * side(centre) < -1e-12) return false;
    }
    return true;
  };
  const posterior: V3 = [mouth.oropharynx.x - 3, mouth.oropharynx.y, 0];
  const lining: IAutoMovieMesh = mesh(box(posterior, 1), Array.from({ length: 8 }, (): number[] => [1, 0, 0, 0]).flat());
  const jawSkin: IAutoMovieMeshSkin = AutoMovieHumanMouthBinding.lining(mouth, lining.positions, 1, lining.skin!);
  const tongue: IAutoMovieMesh = mesh(posterior, [0, 1, 0, 0]);
  const movedTongue: number[] = skinAutoMovieMesh(tongue, bones(0), bones(0.4));
  const badLining: number[] = skinAutoMovieMesh(lining, bones(0), bones(0.4));
  const goodLining: number[] = skinAutoMovieMesh({ ...lining, skin: jawSkin }, bones(0), bones(0.4));
  check("Made head-fixed posterior lining loses the jaw-fixed tongue", !inside(badLining, movedTongue));
  check("Posterior lining and tongue retain containment under their shared jaw", inside(goodLining, movedTongue));
  const front: IAutoMovieMeshSkin = mesh([mouth.molars.x, 0, 0], [0.4, 0.6, 0, 0]).skin!;
  check("The molar-station attachment keeps its original weights", AutoMovieHumanMouthBinding.lining(mouth, [mouth.molars.x, 0, 0], 1, front).weights.every((w: number, i: number): boolean => nclose(w, front.weights[i]!, 1e-12)));
  
  const context: Deformation.IContext = { mouth, hinge: [-70, 0, 0], span: 100 };
  const resolved: Expression.IResolved = Expression.resolve({ units: [], mouth: { lips: { lipPucker: 1 } } }, 40);
  const field: Deformation.Field = Deformation.field(context, resolved, 0);
  const point: V3 = [80, 1, 0];
  const original: number[] = box(point, 0.01);
  const movedPoint: number[] = Deformation.displace(point, null, 1, field, false, mouth)!.positions;
  const movedBox: number[] = Deformation.displace(original, null, 1, field, false, mouth)!.positions;
  check("Made omission of the lining field reports a crossing", !inside(original, movedPoint));
  check("Applying the same continuous field preserves the enclosed point", inside(movedBox, movedPoint));
  
  TestValidator.predicate("Mouth oracle: " + problems.join("; "), problems.length === 0);
}
