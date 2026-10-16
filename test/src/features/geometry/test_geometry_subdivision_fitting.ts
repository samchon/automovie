import {
  type IAutoMovieSubdivisionCage,
  type IAutoMovieSubdivisionSurface,
  evaluateSubdivisionLevel,
  fitAutoMovieSubdivisionRegions,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { subdivisionGrid } from "../internal/subdivisionGrid";
import { throwsError } from "../internal/throwsError";

/**
 * A generating hierarchy holds independent control and limit constraints
 * without changing render resolution or indexed UV identities.
 *
 * Scenarios:
 *
 * 1. A planar 4-by-4 quad grid keeps all coarse boundary controls and the
 *    centre coarse control anchored while its independent centre limit target
 *    rises by 0.2 metres. Two fitting refinements retain the original L2 budget.
 * 2. A translated copy gives translated geometry, with the same independent
 *    target, fixed boundary trace and indexed UV topology.
 * 3. Empty regions retain ordinary subdivision. Overlapping regions, an
 *    a crease incident to the target and render level one are refused; a
 *    crease outside the target fan preserves its actual refinement.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the public region fitter and completed-domain evaluator, asserting the authored centre limit target, fixed boundary trace, unchanged render budget and UV identity; discarding the limit equation merely because the same coarse control is anchored fails the raised-centre assertion.
 * @evidence contracts/testing.md#independent-expectations The centre target is authored independently of the solver, the planar anchored cubic boundary has z=0, translation is an affine physical invariance, and two uniform refinements require exactly sixteen child quads per source quad. UV identity compares to the separately maintained ordinary subdivision path; it is not a geometric oracle.
 * @evidence contracts/testing.md#distinguishing-cases Covers simultaneous distinct control/limit roles, zero-region identity, translation, explicit coincident-valued UV indices, overlap, crease and minimum render-level refusal. It does not claim global embedding, clinical measurement or pose correctness; generic subdivision admission and masks remain owned by existing subdivision tests.
 * @evidence contracts/testing.md#execution-ownership A portable discoverable unit entry invoking the maintained geometry and quadratic APIs on formula-generated cages, without starting a process, consumer, browser or GPU.
 */
export function test_geometry_subdivision_fitting(): void {
  const grid: IAutoMovieSubdivisionCage = subdivisionGrid(4, 4, (): number => 0);
  const uvs: number[] = [];
  const uvFaces: number[][] = grid.faces.map((face: readonly number[]): number[] => face.map((v: number): number => {
    const index: number = uvs.length / 2;
    uvs.push((v % 5) / 4, Math.floor(v / 5) / 4);
    return index;
  }));
  const cage: IAutoMovieSubdivisionCage = { ...grid, uvs, uvFaces };
  const faces: Set<number> = new Set(cage.faces.map((_: readonly number[], f: number): number => f));
  const anchors: Set<number> = new Set(Array.from({ length: 25 }, (_: unknown, v: number): number => v).filter((v: number): boolean => v % 5 === 0 || v % 5 === 4 || v < 5 || v >= 20 || v === 12));
  const region: Parameters<typeof fitAutoMovieSubdivisionRegions>[0]["regions"][number] = { faces, samples: new Map(), limitTargets: new Map([[12, [2, 2, 0.2]]]), anchors };
  const original: string = JSON.stringify(cage);
  const fitted: IAutoMovieSubdivisionSurface = evaluateSubdivisionLevel(fitAutoMovieSubdivisionRegions({ cage, regions: [region] }).level);
  const baseline: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({ cage, levels: 2 });
  TestValidator.predicate("independent limit equality survives a control anchor at the same index", nclose(fitted.limitPositions[3 * 12]!, 2, 1e-8) && nclose(fitted.limitPositions[3 * 12 + 1]!, 2, 1e-8) && nclose(fitted.limitPositions[3 * 12 + 2]!, 0.2, 1e-8));
  TestValidator.predicate("anchored planar boundary trace stays planar", [...anchors].filter((v: number): boolean => v !== 12).every((v: number): boolean => nclose(fitted.limitPositions[3 * v + 2]!, 0, 1e-8)));
  TestValidator.equals("fitting uses the source L2 render budget", fitted.faces.length, cage.faces.length * 16 * 4);
  TestValidator.equals("physical topology is unchanged", fitted.faces, baseline.faces);
  TestValidator.equals("UV identities are unchanged even when independent indices have equal values", fitted.uvFaces, baseline.uvFaces);
  TestValidator.predicate("UV values follow the existing subdivision field", fitted.uvs!.every((value: number, i: number): boolean => nclose(value, baseline.uvs![i]!, 1e-12)));
  TestValidator.equals("caller input is not mutated", JSON.stringify(cage), original);
  const shift: number[] = [0.3, -0.7, 1.1];
  const moved: IAutoMovieSubdivisionSurface = evaluateSubdivisionLevel(fitAutoMovieSubdivisionRegions({ cage: { ...cage, positions: cage.positions.map((value: number, i: number): number => value + shift[i % 3]!) }, regions: [{ ...region, limitTargets: new Map([[12, [2.3, 1.3, 1.3]]]) }] }).level);
  TestValidator.predicate("fitting is translation covariant", moved.limitPositions.every((value: number, i: number): boolean => nclose(value, fitted.limitPositions[i]! + shift[i % 3]!, 1e-8)));
  const empty: IAutoMovieSubdivisionSurface = evaluateSubdivisionLevel(fitAutoMovieSubdivisionRegions({ cage, regions: [] }).level);
  TestValidator.predicate("no regions leaves ordinary subdivision unchanged", empty.limitPositions.every((value: number, i: number): boolean => nclose(value, baseline.limitPositions[i]!, 1e-12)));
  TestValidator.predicate("overlapping domains are refused", throwsError((): unknown => fitAutoMovieSubdivisionRegions({ cage, regions: [region, region] }), "disjoint"));
  TestValidator.predicate("creases incident to an active target are refused", throwsError((): unknown => fitAutoMovieSubdivisionRegions({ cage: { ...cage, creases: [{ from: 7, to: 12, sharpness: 1 }] }, regions: [region] }), "crease"));
  const supported: IAutoMovieSubdivisionSurface = evaluateSubdivisionLevel(fitAutoMovieSubdivisionRegions({ cage: { ...cage, creases: [{ from: 6, to: 7, sharpness: 1 }] }, regions: [region] }).level);
  TestValidator.predicate("support creases outside the target fan do not alter the limit equation", nclose(supported.limitPositions[3 * 12 + 2]!, 0.2, 1e-8));
  TestValidator.predicate("a fitted generating domain requires render level two or above", throwsError((): unknown => fitAutoMovieSubdivisionRegions({ cage, regions: [region], levels: 1 }), "integer from 2 to 6"));
}
