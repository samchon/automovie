import { applyHumanFaceSourceClosure, type IAutoMovieHumanFaceSourceClosurePlan } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * A source endpoint reads fixed native priors and applies its request once.
 * Scenarios:
 * 1. Pair (0,2) closes at1; prior transition10+.25*(1-0)=10.25,
 *    so open transition8 reaches9.125 at half, unlike a double-weight8.5625.
 * 2. Other surfaces keep their native coupling; self-pairs, empty auxiliaries,
 *    exact boundaries and a rigid coordinate change retain owned output.
 * 3. Sparse/malformed populations, unsupported requests, nonfinite data,
 *    duplicate owners, unsupported drivers and arithmetic overflow refuse.
 * 4. Every refusal preserves caller values and recovery uses the original plan.
 */
export const test_subject_human_source_closure_span = (): void => {
  type Plan = IAutoMovieHumanFaceSourceClosurePlan;
  const plan: Plan = {
    generation: "analytic-source-span", surface: "skin", vertices: 3,
    contactPairs: [[0, 1]], representativePair: [0, 1],
    rows: [{ vertex: 2, coefficients: [[0, 0.25]] }],
  };
  const open = new Map<string, readonly number[]>([
    ["skin", [0, 0, 0, 4, 0, 0, 8, 0, 0]], ["card", [2, 0, 0]], ["empty", []],
  ]);
  const prior = new Map<string, readonly number[]>([
    ["skin", [0, 0, 0, 2, 0, 0, 10, 0, 0]], ["card", [4, 0, 0]], ["empty", []],
  ]);
  const run = (weight: number) => applyHumanFaceSourceClosure(plan, open, prior, weight);
  TestValidator.equals("exact open", [...run(0)], [...open].map(([id, values]): [string, number[]] => [id, [...values]]));
  TestValidator.equals("independent half", run(0.5).get("skin"), [0.5, 0, 0, 2.5, 0, 0, 9.125, 0, 0]);
  TestValidator.equals("independent closed", run(1).get("skin"), [1, 0, 0, 1, 0, 0, 10.25, 0, 0]);
  TestValidator.equals("card keeps native coupling", run(0.5).get("card"), [3, 0, 0]);
  TestValidator.predicate("double requested gain is a wrong result", !nclose(run(0.5).get("skin")![6], 8.5625));
  TestValidator.predicate("owned map/arrays", run(0) !== open && run(0).get("skin") !== open.get("skin"));
  TestValidator.equals("self-owned original pair", applyHumanFaceSourceClosure({ ...plan, contactPairs: [[0, 0]], representativePair: [0, 0], rows: [] }, open, prior, 1).get("skin"), [...prior.get("skin")!]);
  const transform = (map: ReadonlyMap<string, readonly number[]>) => new Map([...map].map(([id, p]) => [id, p.map((_, i) => p[Math.floor(i / 3) * 3 + (i + 1) % 3] + [0.5, -0.25, 0.125][i % 3])]));
  const moved = applyHumanFaceSourceClosure(plan, transform(open), transform(prior), 0.5), expected = transform(run(0.5));
  TestValidator.predicate("proper rigid frame", [...moved].every(([id, p]) => p.every((x, i) => nclose(x, expected.get(id)![i]))));
  const sparsePositions = new Array<number>(9), sparsePair = new Array<number>(2), sparseCoefficient = new Array<readonly [number, number]>(1);
  sparsePair[0] = 0;
  const missing = (values: readonly number[]) => new Map([...open, ["skin", values]]);
  const malformedPairs = [[], [[0, 3]], [[-1, 1]], [[0.5, 1]], [[0, 1], [1, 2]], new Array<readonly [number, number]>(1), [sparsePair], [[0]], [[0, 1, 2]]];
  const cases: [Plan, ReadonlyMap<string, readonly number[]>, ReadonlyMap<string, readonly number[]>, number, string][] = [
    [{ ...plan, generation: " " }, open, prior, 1, "generation and surface"],
    [{ ...plan, surface: " " }, open, prior, 1, "generation and surface"],
    [plan, open, prior, NaN, "request weight"], [plan, open, prior, -0.1, "request weight"], [plan, open, prior, 1.1, "request weight"],
    [plan, new Map(), prior, 1, "matching performed surfaces"],
    [plan, open, new Map([["skin", prior.get("skin")!], ["card", [0, 0, 0]], ["other", []]]), 1, "matching performed surfaces"],
    [plan, missing([0, 1]), prior, 1, "matching performed surfaces"],
    [plan, missing([0, 0, 0]), prior, 1, "matching performed surfaces"],
    [plan, missing(sparsePositions), prior, 1, "dense finite"],
    [plan, missing([NaN, ...open.get("skin")!.slice(1)]), prior, 1, "dense finite"],
    [plan, open, new Map([...prior, ["skin", [Infinity, ...prior.get("skin")!.slice(1)]]]), 1, "dense finite"],
    [{ ...plan, surface: "absent" }, open, prior, 1, "performed layout"],
    [{ ...plan, vertices: 2 }, open, prior, 1, "performed layout"],
    [{ ...plan, vertices: 3.5 }, open, prior, 1, "performed layout"],
    [{ ...plan, vertices: 4 }, open, prior, 1, "performed layout"],
    [{ ...plan, representativePair: [1, 0] }, open, prior, 1, "representative"],
    [{ ...plan, representativePair: [0, 2] }, open, prior, 1, "representative"],
    [{ ...plan, contactPairs: [[0, 1], [2, 1]] }, open, prior, 1, "repeats contact"],
    [{ ...plan, rows: new Array<Plan["rows"][number]>(1) }, open, prior, 1, "transition owner"],
    [{ ...plan, rows: [{ vertex: 0, coefficients: [[0, 1]] }] }, open, prior, 1, "transition owner"],
    [{ ...plan, rows: [{ vertex: -1, coefficients: [[0, 1]] }] }, open, prior, 1, "transition owner"],
    [{ ...plan, rows: [...plan.rows, ...plan.rows] }, open, prior, 1, "transition owner"],
    [{ ...plan, rows: [{ vertex: 2, coefficients: [] }] }, open, prior, 1, "nonempty driver"],
  ];
  for (const pairs of malformedPairs) cases.push([{ ...plan, contactPairs: pairs as unknown as Plan["contactPairs"] }, open, prior, 1, pairs.length === 0 ? "registered contact" : pairs.length === 2 ? "repeats contact" : "absent contact"]);
  for (const coefficients of [sparseCoefficient, [[0]], [[2, 1]], [[0, 1], [0, 2]], [[0, NaN]], [[0, 0]], [[0, -1]]]) cases.push([{ ...plan, rows: [{ vertex: 2, coefficients: coefficients as unknown as Plan["rows"][number]["coefficients"] }] }, open, prior, 1, "positive supported drivers"]);
  cases.push([{ ...plan, representativePair: [0, 1, 2] as unknown as readonly [number, number] }, open, prior, 1, "representative"]);
  cases.push([{ ...plan, rows: [{ vertex: 2, coefficients: [[0, Number.MAX_VALUE]] }] }, open, new Map([...prior, ["skin", [0, 0, 0, 4, 0, 0, 10, 0, 0]]]), 1, "endpoint arithmetic"]);
  cases.push([plan, missing([-Number.MAX_VALUE, 0, 0, 4, 0, 0, 8, 0, 0]), new Map([...prior, ["skin", [Number.MAX_VALUE, 0, 0, Number.MAX_VALUE, 0, 0, 10, 0, 0]]]), 0.5, "request arithmetic"]);
  for (const [p, a, b, w, message] of cases) {
    const beforeA = [...a].map(([id, v]) => [id, v.slice()]), beforeB = [...b].map(([id, v]) => [id, v.slice()]);
    TestValidator.predicate("named refusal: " + message, throwsError(() => applyHumanFaceSourceClosure(p, a, b, w), message));
    TestValidator.predicate("caller input preserved", [a, b].every((map, side) => [...map].every(([id, values], i) => values.every((v, k) => Object.is(v, ((side === 0 ? beforeA : beforeB)[i][1] as number[])[k])) && (side === 0 ? beforeA : beforeB)[i][0] === id)));
  }
  TestValidator.equals("recovery", run(1).get("skin"), [1, 0, 0, 1, 0, 0, 10.25, 0, 0]);
};
