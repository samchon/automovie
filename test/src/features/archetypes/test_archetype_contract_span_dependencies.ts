import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeSpan,
} from "@automovie/archetypes";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeSpanObservation } from "../internal/archetypeSpanObservation";
import { vclose } from "../internal/vclose";

/**
 * Flexible-line dependencies read the current predecessor frame without cycles.
 *
 * Scenarios:
 * 1. A second line is attached .25m along the first line's local +Y. Moving
 *    and lengthening the first line onto +Y carries it to literal(0,2.25,0).
 * 2. Reversing declarations has no effect on either actual line. Both the
 *    geometry-only floor seam and the public reposed model realize the points.
 * 3. Cyclic, duplicate, missing-cylinder, wrong-primitive and nonfinite-radius
 *    declarations refuse; neither input geometry nor original span data changes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names actual dependent-line geometry, literal rigid-frame expectation, declaration-order independence and all unsupported graph/geometry cases.
 * @evidence contracts/development/testing.md#behavioral-verification Produces actual cylinder spans, moves their real carrier parts and measures emitted primitive endpoints from lay and reposed rather than inspecting dependency metadata alone.
 * @evidence contracts/development/testing.md#independent-expectations A line from(0,0,0) to(0,4,0) has centre(0,2,0), so its fixed local+.25Y anchor is(0,2.25,0). The second line's other independent carrier moves to(3,2,1). The1e-12m budget admits rigid arithmetic, not a stale predecessor pose.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts source and moved geometry, original/reversed declaration orders, geometry-only/full-model consumers, two-node/self cycles and malformed physical line ownership.
 * @evidence contracts/development/testing.md#execution-ownership A bounded synchronous in-memory unit owns its graph, poses and malformed copies; no process, compiler, renderer, foreign-method replacement or timed experiment is used.
 */
export function test_archetype_contract_span_dependencies(): void {
  const source: AutoMovieArchetype<never, never> =
    new AutoMovieArchetypeBuilder<never, never>({
      name: "line graph",
      material: "steel",
      draw: new AutoMovieArchetypeDrawSession<never>(
        "line-graph",
        {},
        undefined,
      ),
    })
      .box("a", { x: 0.1, y: 0.1, z: 0.1 }, { x: 0, y: 0, z: 0 })
      .box("b", { x: 0.1, y: 0.1, z: 0.1 }, { x: 2, y: 0, z: 0 })
      .box("c", { x: 0.1, y: 0.1, z: 0.1 }, { x: 1, y: 1, z: 0 })
      .span(
        "first",
        { part: "a", at: { x: 0, y: 0, z: 0 } },
        { part: "b", at: { x: 0, y: 0, z: 0 } },
        0.01,
      )
      .span(
        "second",
        { part: "first", at: { x: 0, y: 0.25, z: 0 } },
        { part: "c", at: { x: 0, y: 0, z: 0 } },
        0.005,
      )
      .build(2);
  const before: string = JSON.stringify({ model: source, spans: source.spans });
  const parts: IAutoMovieModelPart[] = source.parts.map(
    (part: IAutoMovieModelPart): IAutoMovieModelPart => {
      if (part.id !== "b" && part.id !== "c") return part;
      return {
        ...part,
        transform: {
          translation:
            part.id === "b" ? { x: 0, y: 4, z: 0 } : { x: 3, y: 2, z: 1 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
      };
    },
  );
  const input: string = JSON.stringify(parts);
  const outputs: readonly IAutoMovieModelPart[][] = [
    AutoMovieArchetypeSpan.lay("line-graph", source.spans, parts, []),
    AutoMovieArchetypeSpan.lay(
      "line-graph",
      [...source.spans].reverse(),
      parts,
      [],
    ),
    source.reposed(parts).parts,
  ];
  const findings: string[] = [];
  for (const current of outputs) {
    const first: ReturnType<typeof archetypeSpanObservation.ends> =
      archetypeSpanObservation.ends(
        current.find(
          (part: IAutoMovieModelPart): boolean => part.id === "first",
        )!,
      );
    const second: ReturnType<typeof archetypeSpanObservation.ends> =
      archetypeSpanObservation.ends(
        current.find(
          (part: IAutoMovieModelPart): boolean => part.id === "second",
        )!,
      );
    if (
      !vclose(first[0], { x: 0, y: 0, z: 0 }, 1e-12) ||
      !vclose(first[1], { x: 0, y: 4, z: 0 }, 1e-12) ||
      !vclose(second[0], { x: 0, y: 2.25, z: 0 }, 1e-12) ||
      !vclose(second[1], { x: 3, y: 2, z: 1 }, 1e-12)
    )
      findings.push("a dependent line used a stale frame or declaration order");
  }
  const cyclic: AutoMovieArchetypeSpan.ISpan[] = source.spans.map(
    (span: AutoMovieArchetypeSpan.ISpan): AutoMovieArchetypeSpan.ISpan =>
      span.id === "first"
        ? { ...span, from: { part: "second", at: { x: 0, y: 0, z: 0 } } }
        : span,
  );
  const self: AutoMovieArchetypeSpan.ISpan[] = source.spans.map(
    (span: AutoMovieArchetypeSpan.ISpan): AutoMovieArchetypeSpan.ISpan =>
      span.id === "first"
        ? { ...span, from: { part: "first", at: { x: 0, y: 0, z: 0 } } }
        : span,
  );
  const wrong: IAutoMovieModelPart[] = parts.map(
    (part: IAutoMovieModelPart): IAutoMovieModelPart =>
      part.id === "first"
        ? {
            ...part,
            geometry: {
              type: "primitive",
              shape: { type: "sphere", radius: 0.01 },
            },
          }
        : part,
  );
  for (const operation of [
    (): unknown => AutoMovieArchetypeSpan.lay("line-graph", cyclic, parts, []),
    (): unknown => AutoMovieArchetypeSpan.lay("line-graph", self, parts, []),
    (): unknown =>
      AutoMovieArchetypeSpan.lay(
        "line-graph",
        [source.spans[0]!, source.spans[0]!],
        parts,
        [],
      ),
    (): unknown =>
      AutoMovieArchetypeSpan.lay(
        "line-graph",
        source.spans,
        parts.filter(
          (part: IAutoMovieModelPart): boolean => part.id !== "first",
        ),
        [],
      ),
    (): unknown =>
      AutoMovieArchetypeSpan.lay("line-graph", source.spans, wrong, []),
    (): unknown =>
      AutoMovieArchetypeSpan.lay(
        "line-graph",
        source.spans.map(
          (
            span: AutoMovieArchetypeSpan.ISpan,
          ): AutoMovieArchetypeSpan.ISpan => ({
            ...span,
            radius: NaN,
          }),
        ),
        parts,
        [],
      ),
  ]) {
    try {
      operation();
      findings.push("an invalid span dependency was accepted");
    } catch (error) {
      if (!(error instanceof AutoMovieArchetypeRefusal))
        findings.push(`untyped span refusal: ${String(error)}`);
    }
  }
  if (
    JSON.stringify(parts) !== input ||
    JSON.stringify({ model: source, spans: source.spans }) !== before
  )
    findings.push("resolving lines changed source geometry or declarations");
  TestValidator.equals(
    "current-frame flexible-line dependency graph",
    findings,
    [],
  );
}
