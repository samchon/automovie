import { createHumanFaceBasisPoseEvaluator, humanFaceBasisWeights, type IAutoMovieHumanFaceSourceClosurePlan } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The real evaluator consumes source closure after mixed native posing/replay.
 * Scenarios:
 * 1. Fixed legacy-zero/one inputs retain the same wide/open/press state. Their
 *    source pair mean and quarter driver displacement give independent C and
 *    half results; a second request factor or replay after C differs.
 * 2. The registered pair supplies final gap0 while the authored pair remains
 *    an actual separate diagnostic. Other surfaces keep native source coupling.
 * 3. An absent surface or mismatched generation refuses before performance;
 *    correcting metadata recovers without changing caller weights or source.
 * 4. A legacy basis keeps its original summary and has no source diagnostic.
 */
export const test_subject_human_source_closure_evaluator = (): void => {
  const { basis } = humanFaceContactFixture();
  // This supported empty rigid population isolates source arithmetic; existing
  // contact scenarios retain the original floors and budgets as consequences.
  basis.contact!.colliders = [];
  basis.contact!.soft = [];
  const mouth = basis.surfaces[1];
  mouth.positions.push(0.125, -0.0625, 1.4);
  mouth.attachments![0].rows.push(6, 0.5);
  mouth.indices.push(0, 3, 6, 3, 4, 6, 4, 0, 6);
  mouth.regions[0].indices = mouth.indices.slice();
  mouth.sourcePosePlan = {
    generation: "analytic-source-closure", nativeVertices: 6,
    nativeTriangles: [0, 1, 2, 3, 5, 4, 0, 3, 4],
    samples: [{ parent: 2, coordinates: [0.25, 0.25] }],
  };
  basis.surfaces[2].targets.closeTarget = [0, 1, 0, 0];
  const legacy = createHumanFaceBasisPoseEvaluator(structuredClone(basis));
  const shape = { wide: 0.5 }, expression = { open: 0.5, press: 0.25 };
  const state = (close: number) => humanFaceBasisWeights(basis, { shape, expression: { ...expression, close } });
  const open = legacy(state(0), shape), prior = legacy(state(1), shape);
  TestValidator.predicate("fixture has distinct native endpoints", !nclose(open.positions.get("mouth")![19], prior.positions.get("mouth")![19]));
  const plan: IAutoMovieHumanFaceSourceClosurePlan = {
    generation: mouth.sourcePosePlan.generation, surface: "mouth", vertices: 7,
    contactPairs: [[6, 3]], representativePair: [6, 3],
    rows: [{ vertex: 1, coefficients: [[6, 0.25]] }],
  };
  basis.contact!.closure.sourceSpan = plan;
  const evaluate = createHumanFaceBasisPoseEvaluator(basis), oldPrior = prior.positions.get("mouth")!;
  const omitted = evaluate(humanFaceBasisWeights(basis, { shape, expression }), shape);
  TestValidator.predicate("omitted requested closure is zero", omitted.positions.get("mouth")!.every((v, i) => nclose(v, open.positions.get("mouth")![i])));
  const C = oldPrior.slice();
  for (let axis = 0; axis < 3; axis++) {
    const mean = (oldPrior[18 + axis] + oldPrior[9 + axis]) / 2;
    C[18 + axis] = mean; C[9 + axis] = mean;
    C[3 + axis] = oldPrior[3 + axis] + 0.25 * (mean - oldPrior[18 + axis]);
  }
  for (const weight of [0, 0.5, 1]) {
    const supplied = state(weight), before = [...supplied.weights], result = evaluate(supplied, shape);
    const expected = open.positions.get("mouth")!.map((v, i) => v + weight * (C[i] - v));
    TestValidator.predicate("independent performed source blend", expected.every((v, i) => nclose(v, result.positions.get("mouth")![i])));
    for (const [id, p] of open.positions) if (id !== "mouth")
      TestValidator.predicate("same-other native surface: " + id, p.every((v, i) => nclose(result.positions.get(id)![i], v + weight * (prior.positions.get(id)![i] - v))));
    TestValidator.equals("caller weights retained", [...supplied.weights], before);
    TestValidator.predicate("source diagnostic present", result.summary!.sourceNativeInterlabialMetres !== undefined);
    if (weight === 1) {
      const p = result.positions.get("mouth")!;
      TestValidator.predicate("registered representative actual gap", nclose(result.summary!.interlabialMetres, 0) && [0, 1, 2].every(axis => p[18 + axis] === p[9 + axis]));
      TestValidator.predicate("replay after C would erase the endpoint", [0, 1, 2].some(axis => !nclose(p[18 + axis], 0.5 * p[axis] + 0.25 * p[9 + axis] + 0.25 * p[12 + axis])));
      TestValidator.predicate("native pair reading retained", nclose(result.summary!.sourceNativeInterlabialMetres!, p[1] - p[10]));
    }
  }
  basis.contact!.closure.sourceSpan = { ...plan, surface: "absent" };
  TestValidator.predicate("absent source surface refuses", throwsError(() => createHumanFaceBasisPoseEvaluator(basis), "absent basis surface"));
  basis.contact!.closure.sourceSpan = { ...plan, generation: "other" };
  TestValidator.predicate("source generation refuses", throwsError(() => createHumanFaceBasisPoseEvaluator(basis), "same compiler generation"));
  basis.contact!.closure.sourceSpan = plan;
  const originalPosePlan = mouth.sourcePosePlan;
  mouth.sourcePartition = {
    generation: plan.generation, originalVertices: 6,
    parentTriangles: originalPosePlan.nativeTriangles, intersections: [],
    refinements: [{ parent: 2, coordinates: [0.25, 0.25] }],
    samples: [0, 1, 2, 3, 4, 5, 6], parents: [0, 1, 2, 2, 2],
  };
  TestValidator.predicate("both source generations accepted", nclose(createHumanFaceBasisPoseEvaluator(basis)(state(1), shape).summary!.interlabialMetres, 0));
  delete mouth.sourcePosePlan;
  basis.contact!.closure.sourceSpan = { ...plan, generation: "other" };
  TestValidator.predicate("normal-only generation refuses", throwsError(() => createHumanFaceBasisPoseEvaluator(basis), "same compiler generation"));
  basis.contact!.closure.sourceSpan = plan;
  mouth.sourcePosePlan = originalPosePlan;
  TestValidator.predicate("generation recovery", nclose(createHumanFaceBasisPoseEvaluator(basis)(state(1), shape).summary!.interlabialMetres, 0));
  delete basis.contact!.closure.sourceSpan;
  TestValidator.predicate("legacy path has no new diagnostic", createHumanFaceBasisPoseEvaluator(basis)(state(1), shape).summary!.sourceNativeInterlabialMetres === undefined);
};
