import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";
import { HumanPoseStrain as S } from "../internal/HumanPoseStrain";

/**
 * Verify complete-region strain and the exact offending or omitted face.
 *
 * Scenarios:
 * 1. Unchanged and translated right-angle rigid maps preserve both faces.
 * 2. A late affine threefold defect exceeds the unchanged twofold ceiling and
 *    retains original face, chain, coordinates and actual exported weights.
 * 3. A length-preserving hinge fold reports both neighbours; its normal control
 *    has no folds. Neither case changes the principal-stretch formula.
 * 4. Zero-edge and nonzero-collinear rest faces, a subthreshold sliver and a
 *    region containing only skipped faces are explicitly unavailable.
 * 5. A sliver above the unchanged 1e-9 area threshold remains measurable.
 * 6. Empty regions, invalid rest coordinates, invalid posed coordinates and
 *    finite-coordinate arithmetic overflow remain unavailable with cause ids.
 * 7. Skipped-first/valid-late and valid-first/invalid-last mixtures visit every
 *    selected face, retain the finite witness and cannot certify the region.
 * 8. Collapsed posed faces retain their finite singular-value witness but
 *    cannot certify geometry or folds, even without a selected neighbour.
 * 9. A finite positive compression remains measurable and changes its known
 *    singular value; neighbour-normal cancellation remains unavailable.
 * 10. A mixed overflow/valid scan retains its later finite witness.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the shared triangle consumer on evaluated skins and checks principal stretch, neighbour-relative folds, full-scan counts, complete-region availability and exact original face/vertex/weight witnesses. HumanFixtureAudit collects every scalar, coordinate and category failure; per-case exception capture continues all later cases before one final verdict.
 * @evidence contracts/testing.md#independent-expectations Euclidean rigid maps have singular values one, a diagonal affine map has maximum three, a reflected hinge reverses its neighbours while retaining length, and a collapsed map has singular values zero but no unit face normal. A uniform positive scale has that scale as both singular values. Opposite neighbour normals sum to zero and cannot define a mean direction. Exact cross products establish finite collinearity; analytic triangle areas 0.5e-9 and 2e-9 bracket the unchanged 1e-9 determinant threshold. A complete-region claim requires every selected face and fold direction to be evaluable. Coordinate and strain roundoff allowances are 1e-12 in the fixture's metre coordinate system; ids, counts and categories use exact comparisons. This tests measurement correctness, not anatomical support feasibility.
 * @evidence contracts/testing.md#distinguishing-cases Covers ordinary and defective affine skins, original winding and ownership, positive/zero exported weights, independent rigid and hinge controls, zero-edge and nonzero-collinear rest geometry, slivers below/above threshold, empty and all-skipped regions, nonfinite input and arithmetic, collapsed posed geometry, and late valid/invalid observations. Whole-person pose support, collisions and rendered anatomy remain separate consumers.
 * @evidence contracts/testing.md#execution-ownership Synchronous discoverable CPU entry test_human_pose_strain owns all numbered local mesh cases and invokes only the maintained strain helper and shared collector. It starts no generator, rig, process, browser, native plugin or GPU; the final finish occurs only after every case callback has returned or been caught.
 */
export function test_human_pose_strain(): void {
  const audit: HumanFixtureAudit = new HumanFixtureAudit("pose strain analytic faces", "HumanPoseStrain.measure");
  const rest: S.ISkin = { P: [0, 0, 0, 1, 0, 0, 0, 1, 0, 3, 0, 0, 4, 0, 0, 3, 1, 0], I: [0, 1, 2, 3, 4, 5], tri: [0, 1], chains: ["trunk/0", "leg.left/10"] };
  const binding: S.IBinding = { joints: ["hips", "leftUpperLeg"], boneIndices: [], weights: [] };
  for (let id: number = 0; id < 6; id++) {
    (binding.boneIndices as number[]).push(0, 1, 0, 0);
    (binding.weights as number[]).push(id / 10, 1 - id / 10, 0, 0);
  }
  const rigid: S.ISkin = { ...rest, P: Array.from({ length: 6 }, (_: unknown, id: number): S.V3 => [10 - rest.P[3 * id + 1]!, 5 + rest.P[3 * id]!, 2]).flat() };
  const broken: S.ISkin = { ...rigid, P: Array.from(rigid.P) };
  (broken.P as number[])[12] = (broken.P as number[])[9]!;
  (broken.P as number[])[13] = (broken.P as number[])[10]! + 3;
  const hinge: S.ISkin = { P: [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0], I: [0, 1, 2, 1, 3, 2], tri: [0, 0], chains: ["leg.left/11"] };
  const folded: S.ISkin = { ...hinge, P: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0] };
  const zeroEdge: S.ISkin = face([0, 0, 0, 0, 0, 0, 0, 1, 0], "zero-edge");
  const collinear: S.ISkin = face([0, 0, 0, 1, 1, 0, 2, 2, 0], "nonzero-collinear");
  const sliver: S.ISkin = face([0, 0, 0, 1, 0, 0, 1, 0.5e-9, 0], "subthreshold-sliver");
  const narrow: S.ISkin = face([0, 0, 0, 1, 0, 0, 1, 2e-9, 0], "measurable-sliver");
  const invalid: S.ISkin = face([0, 0, 0, NaN, 0, 0, 0, 1, 0], "invalid-rest");
  const invalidPose: S.ISkin = { ...rest, P: Array.from(rest.P) };
  (invalidPose.P as number[])[0] = NaN;
  const huge: S.ISkin = { ...rest, P: Array.from(rest.P, (value: number): number => value * 1e200) };
  const hugeRest: S.ISkin = face([0, 0, 0, 1e200, 0, 0, 0, 1e200, 0], "finite-rest-basis-overflow");
  const collapsed: S.ISkin = { ...rest, P: Array.from(rest.P, (): number => 0) };
  const allSkipped: S.ISkin = join(collinear, sliver);
  const skippedFirst: S.ISkin = join(collinear, face([3, 0, 0, 4, 0, 0, 3, 1, 0], "valid-late"));
  const invalidLast: S.ISkin = join(face([0, 0, 0, 1, 0, 0, 0, 1, 0], "valid-first"), invalid);
  const overflowFirst: S.ISkin = { ...rest, P: Array.from(rest.P) };
  for (let i: number = 0; i < 9; i++) (overflowFirst.P as number[])[i] = rest.P[i]! * 1e200;

  run(audit, "1 unchanged", rest, rest, [0, 1], binding, (result: S.IOutput): void => {
    complete(audit, result, 1, 2);
    audit.measure("zero mass slots omitted", result.worst?.influences?.[0].length ?? NaN, 1, 0, "count");
    audit.category("actual positive bone retained", result.worst?.influences?.[0][0]?.bone, "leftUpperLeg");
    audit.measure("actual positive mass retained", result.worst?.influences?.[0][0]?.weight ?? NaN, 1, 1e-12, "unit mass");
  });
  run(audit, "1 translated rigid", rest, rigid, [0, 1], binding, (result: S.IOutput): void => complete(audit, result, 1, 2));
  run(audit, "2 late affine defect", rest, broken, [0, 1], binding, (result: S.IOutput): void => {
    complete(audit, result, 3, 2);
    audit.reject("twofold ceiling detects made defect", result.stretch, 0, 2, "x");
    audit.measure("worst source face", result.worst?.triangle ?? NaN, 1, 0, "face id");
    audit.category("worst chain", result.worst?.chain ?? undefined, "leg.left/10");
    audit.vector("worst original vertices", result.worst?.vertices ?? [], [3, 4, 5], 0, "vertex id");
    audit.vector("worst bind coordinates", result.worst?.rest.flat() ?? [], [3, 0, 0, 4, 0, 0, 3, 1, 0], 1e-12, "m");
    audit.vector("worst posed coordinates", result.worst?.posed.flat() ?? [], Array.from(broken.P).slice(9, 18), 1e-12, "m");
    audit.vector("worst bind centroid", result.worst?.restCentroid ?? [], [10 / 3, 1 / 3, 0], 1e-12, "m");
    audit.measure("first vertex influence count", result.worst?.influences?.[0].length ?? NaN, 2, 0, "count");
    audit.category("first influence bone", result.worst?.influences?.[0][0]?.bone, "hips");
    audit.category("second influence bone", result.worst?.influences?.[0][1]?.bone, "leftUpperLeg");
    audit.vector("first vertex positive influences", result.worst?.influences?.[0].map((entry: S.IInfluence): number => entry.weight) ?? [], [0.3, 0.7], 1e-12, "unit mass");
  });
  run(audit, "3 normal hinge", hinge, hinge, [0, 1], undefined, (result: S.IOutput): void => complete(audit, result, 1, 2));
  run(audit, "3 made hinge fold", hinge, folded, [0, 1], undefined, (result: S.IOutput): void => {
    audit.measure("length-preserving fold strain", result.stretch, 1, 1e-12, "x");
    audit.measure("folded neighbour count", result.folded, 2, 0, "count");
    audit.vector("folded source faces", result.foldedTriangles, [0, 1], 0, "face id");
  });
  for (const [label, skin] of [["4 zero edge", zeroEdge], ["4 nonzero collinear", collinear], ["4 subthreshold sliver", sliver]] as const)
    run(audit, label, skin, skin, [0], undefined, (result: S.IOutput): void => unavailable(audit, result, 0, [0], [], "degenerate-rest"));
  run(audit, "4 all skipped", allSkipped, allSkipped, [0, 1], undefined, (result: S.IOutput): void => unavailable(audit, result, 0, [0, 1], [], "degenerate-rest"));
  run(audit, "5 measurable sliver", narrow, narrow, [0], undefined, (result: S.IOutput): void => complete(audit, result, 1, 1));
  run(audit, "6 empty region", rest, rest, [], undefined, (result: S.IOutput): void => {
    audit.check("empty aggregate is unavailable", Number.isNaN(result.stretch));
    audit.category("empty reason", result.availability, "empty-region");
    audit.measure("measured faces", result.measured, 0, 0, "count");
    audit.check("empty scan invents no worst face", result.worst === null);
    audit.measure("empty scan invents no omission", result.unmeasurableTriangles.length, 0, 0, "count");
  });
  run(audit, "6 invalid rest input", invalid, invalid, [0], undefined, (result: S.IOutput): void => unavailable(audit, result, 0, [], [0], "nonfinite-rest-input"));
  run(audit, "6 finite rest basis overflow", hugeRest, hugeRest, [0], undefined, (result: S.IOutput): void => unavailable(audit, result, 0, [], [0], "nonfinite-rest-basis"));
  run(audit, "6 invalid posed input", rest, invalidPose, [0], undefined, (result: S.IOutput): void => unavailable(audit, result, 1, [], [0], "nonfinite-deformation"));
  run(audit, "6 finite arithmetic overflow", rest, huge, [0], undefined, (result: S.IOutput): void => unavailable(audit, result, 1, [], [0], "nonfinite-deformation"));
  run(audit, "7 skipped first valid late", skippedFirst, skippedFirst, [0, 1], undefined, (result: S.IOutput): void => {
    unavailable(audit, result, 1, [0], [], "degenerate-rest", false);
    audit.measure("later finite witness face", result.worst?.triangle ?? NaN, 1, 0, "face id");
    audit.measure("later finite witness strain", result.worst?.stretch ?? NaN, 1, 1e-12, "x");
  });
  run(audit, "7 valid first invalid last", invalidLast, invalidLast, [0, 1], undefined, (result: S.IOutput): void => {
    unavailable(audit, result, 1, [], [1], "nonfinite-rest-input", false);
    audit.measure("preceding finite witness face", result.worst?.triangle ?? NaN, 0, 0, "face id");
    audit.measure("preceding finite witness strain", result.worst?.stretch ?? NaN, 1, 1e-12, "x");
  });
  run(audit, "8 collapsed finite posed face", rest, collapsed, [0], undefined, (result: S.IOutput): void => {
    audit.category("collapsed geometry is unavailable", result.availability, "unmeasurable-face");
    audit.check("collapsed aggregate cannot pass a strain ceiling", Number.isNaN(result.stretch));
    audit.measure("collapsed face was still measured", result.measured, 1, 0, "count");
    audit.category("posed geometry cause", result.unmeasurableTriangles[0]?.reason, "degenerate-posed");
    audit.measure("zero singular-value witness retained", result.worst?.stretch ?? NaN, 0, 0, "x");
    audit.measure("zero-strain source witness", result.worst?.triangle ?? NaN, 0, 0, "face id");
  });
  run(audit, "8 collapsed neighbouring faces", hinge, { ...hinge, P: Array.from(hinge.P, (): number => 0) }, [0, 1], undefined, (result: S.IOutput): void => {
    audit.category("collapsed neighbours are unavailable", result.availability, "unmeasurable-face");
    audit.vector("every collapsed face retained", result.unmeasurableTriangles.map((entry: S.IUnmeasurable): number => entry.triangle), [0, 1], 0, "face id");
    for (const entry of result.unmeasurableTriangles) audit.category("collapsed neighbour cause", entry.reason, "degenerate-posed");
    audit.check("collapsed fold observation cannot certify healthy geometry", Number.isNaN(result.stretch));
  });
  for (const factor of [0.25, 0.5]) run(audit, "9 positive compression " + factor.toString(), hinge, { ...hinge, P: Array.from(hinge.P, (value: number): number => factor * value) }, [0, 1], undefined, (result: S.IOutput): void => complete(audit, result, factor, 2));
  const cancelling: S.ISkin = { P: [0,0,0, 1,0,0, 0,1,0, 0,-1,0, -1,0,0], I: [0,1,2, 1,0,3, 0,2,4], tri: [0,0,0], chains: ["normal-cancellation"] };
  const cancelledPose: S.ISkin = { ...cancelling, P: [0,0,0, 1,0,0, 0,1,0, 0,1,0, -1,0,0] };
  run(audit, "9 cancelling neighbour normals", cancelling, cancelledPose, [0, 1, 2], undefined, (result: S.IOutput): void => {
    audit.category("undefined mean normal is unavailable", result.availability, "unmeasurable-face");
    audit.check("cancelled fold observation cannot pass", Number.isNaN(result.stretch));
    audit.check("cancelled normal retains its actual cause and face", result.unmeasurableTriangles.some((entry: S.IUnmeasurable): boolean => entry.triangle === 0 && entry.reason === "nonfinite-fold-normal"));
    audit.measure("all finite deformation maps remain measured", result.measured, 3, 0, "count");
  });
  run(audit, "10 overflow first valid late", rest, overflowFirst, [0, 1], undefined, (result: S.IOutput): void => {
    unavailable(audit, result, 2, [], [0], "nonfinite-deformation", false);
    audit.measure("finite late face retained after overflow", result.worst?.triangle ?? NaN, 1, 0, "face id");
    audit.measure("finite late strain retained after overflow", result.worst?.stretch ?? NaN, 1, 1e-12, "x");
  });
  audit.finish();
}

/** Visit one case even when an earlier case or its product call throws. */
function run(audit: HumanFixtureAudit, label: string, rest: S.ISkin, posed: S.ISkin, region: number[], binding: S.IBinding | undefined, verify: (result: S.IOutput) => void): void {
  const context: Record<string, unknown> = { case: label, selectedFaces: region, sourceChains: rest.chains, sourceVertexIds: Array.from(rest.I), restCoordinates: Array.from(rest.P), posedCoordinates: Array.from(posed.P), coordinateUnit: "m", exportedBinding: binding ?? null };
  audit.scope(context);
  try {
    const result: S.IOutput = S.measure(rest, posed, region, binding);
    audit.scope({ ...context, completeObservation: result });
    verify(result);
  } catch (error: unknown) {
    audit.scope({ ...context, exception: error instanceof Error ? error.message : String(error) });
    audit.check("case executes without an exception", false);
  }
}

/** Check the complete finite domain without embedding any anatomy acceptance limit. */
function complete(audit: HumanFixtureAudit, result: S.IOutput, stretch: number, measured: number): void {
  audit.category("region availability", result.availability, "complete");
  audit.measure("principal stretch", result.stretch, stretch, 1e-12, "x");
  audit.measure("measured faces", result.measured, measured, 0, "count");
  audit.measure("normal folded faces", result.folded, 0, 0, "count");
  audit.vector("skipped faces", result.skippedDegenerateTriangles, [], 0, "face id");
  audit.vector("nonfinite faces", result.nonFiniteTriangles, [], 0, "face id");
  audit.measure("unmeasurable face count", result.unmeasurableTriangles.length, 0, 0, "count");
}

/** A partial observation must fail the complete-region claim without hiding valid faces. */
function unavailable(audit: HumanFixtureAudit, result: S.IOutput, measured: number, skipped: number[], nonfinite: number[], reason: S.IUnmeasurable["reason"], noFiniteWitness: boolean = true): void {
  audit.check("incomplete aggregate is NaN", Number.isNaN(result.stretch));
  audit.category("incomplete reason", result.availability, "unmeasurable-face");
  audit.measure("measured faces", result.measured, measured, 0, "count");
  audit.measure("skipped face count", result.skippedDegenerate, skipped.length, 0, "count");
  audit.vector("skipped source face ids", result.skippedDegenerateTriangles, skipped, 0, "face id");
  audit.vector("nonfinite source face ids", result.nonFiniteTriangles, nonfinite, 0, "face id");
  audit.vector("unmeasurable source face ids", result.unmeasurableTriangles.map((entry: S.IUnmeasurable): number => entry.triangle), [...skipped, ...nonfinite].sort((a: number, b: number): number => a - b), 0, "face id");
  for (const entry of result.unmeasurableTriangles) audit.category("unmeasurable face " + entry.triangle.toString() + " cause", entry.reason, reason);
  if (noFiniteWitness) audit.check("no fictitious finite witness", result.worst === null);
}

/** An independently addressed single triangle in metre coordinates. */
function face(P: number[], chain: string): S.ISkin { return { P, I: [0, 1, 2], tri: [0], chains: [chain] }; }

/** Disjoint fixture union preserves the explicitly supplied source order. */
function join(a: S.ISkin, b: S.ISkin): S.ISkin { return { P: [...Array.from(a.P), ...Array.from(b.P)], I: [...Array.from(a.I), ...Array.from(b.I, (id: number): number => id + a.P.length / 3)], tri: [0, 1], chains: [a.chains[0]!, b.chains[0]!] }; }
