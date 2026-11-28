import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeSpan,
} from "@automovie/archetypes";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeSpanObservation } from "../../internal/archetypeSpanObservation";
import { vclose } from "../../internal/vclose";

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
 * @evidence contracts/development/common.md#meaningful-documentation Names the source and moved span geometry, independent anchor, reordered declarations, two-node and self cycles and invalid physical span declarations.
 * @evidence contracts/development/testing.md#behavioral-verification Builds dependent cylinder spans, moves their real carrier parts and reads emitted endpoints through `lay` and reposed geometry. Reversing declaration order distinguishes dependency ordering from source order. Cycles and malformed physical spans exercise refusal paths.
 * @evidence contracts/development/testing.md#independent-expectations A segment from (0, 0, 0) to (0, 4, 0) places its midpoint at (0, 2, 0) and its local 0.25 metre Y anchor at (0, 2.25, 0). The second carrier moves independently to (3, 2, 1). A `1e-12` metre tolerance bounds rigid transforms.
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
        { type: "part", part: "a", at: { x: 0, y: 0, z: 0 } },
        { type: "part", part: "b", at: { x: 0, y: 0, z: 0 } },
        0.01,
      )
      .span(
        "second",
        { type: "part", part: "first", at: { x: 0, y: 0.25, z: 0 } },
        { type: "part", part: "c", at: { x: 0, y: 0, z: 0 } },
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
        ? { ...span, from: { type: "part", part: "second", at: { x: 0, y: 0, z: 0 } } }
        : span,
  );
  const self: AutoMovieArchetypeSpan.ISpan[] = source.spans.map(
    (span: AutoMovieArchetypeSpan.ISpan): AutoMovieArchetypeSpan.ISpan =>
      span.id === "first"
        ? { ...span, from: { type: "part", part: "first", at: { x: 0, y: 0, z: 0 } } }
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
