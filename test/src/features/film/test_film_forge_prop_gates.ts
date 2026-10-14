import { IAutoMovieForgedProp } from "../../../../packages/engine/src/film/IAutoMovieForgedProp";
import { IAutoMovieConstraintViolation, IAutoMovieModelPart, IAutoMovieNode, IAutoMoviePropSpec } from "@automovie/interface";
import { forgeProp } from "../../../../packages/engine/src/film/forgeProp";
import { TestValidator } from "@nestia/e2e";
import { createSkeleton } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";
import { createDoorPropSpec } from "../internal/createDoorPropSpec";
/**
 * Forge a fresh door after the caller applies its authored mutation.
 *
 * The owning test supplies authored bad identities, graph edges, mappings and
 * extents and asserts located refusals; this adapter derives no expected findings.
 */
function broken (
  mutate: (spec: IAutoMoviePropSpec) => IAutoMoviePropSpec,
): ReturnType<typeof forgeProp> { return forgeProp(mutate(createDoorPropSpec())); }

/**
 * ForgeProp's gates report every contract breach with a field-located path for the correction round, and, unlike bindProfile's first-throw, the missing boneMap mappings are reported all at once.
 *
 * Scenarios:
 *
 * 1. An empty prop node id is a `type` violation on `$input.node`.
 * 2. A model id differing from the node breaks the staging join.
 * 3. An imported origin violates the generated-prop contract.
 * 4. A model with a skeleton is an actor, not a prop: rejected toward forgeCast.
 * 5. An invalid model (zero-extent part) surfaces validateModel's violation remapped under `$input.model`.
 * 6. Empty articulation nodes violate.
 * 7. A duplicated joint node id violates at the duplicate's path.
 * 8. An empty joint node id violates.
 * 9. A parent naming an undeclared node violates.
 * 10. A cyclic parent chain violates.
 * 11. A binding targeting a different profile id violates.
 * 12. A boneMap value naming an undeclared node violates; an empty value violates separately.
 * 13. Both unmapped profile keys are listed in one round (pivot and mirror).
 * 14. Inherited constructor/toString/__proto__ properties do not supply a semantic mapping; an explicit own mapping of the same spelling passes.
 *
 * @evidence contracts/testing.md#behavioral-verification Forges fresh single-defect door mutations and asserts located type/range violations for staging identity, model proxy, articulation hierarchy, binding and missing profile keys; exact two-key reporting catches fail-fast loss.
 * @evidence contracts/testing.md#independent-expectations Paths follow the authored field positions, node/model equality joins staging, primitive widths must be positive, parents and bindings must name declared nodes, and both pivot/mirror profile keys require mappings. These authored contracts determine expected refusals without reading a generated error list.
 * @evidence contracts/testing.md#distinguishing-cases Covers blank identities, wrong origin and rig kind, zero geometry extent, empty/duplicate/cyclic joint graphs, wrong profile, absent/blank mapped nodes and multiple unmapped keys. Reserved semantic spellings distinguish inherited properties from explicit own mappings, while unchanged articulated and rigid neighbours belong to test_film_forge_prop.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous entry owns its mutation cases over in-memory data and directly calls portable forgeProp; shared fixtures and violation predicates install no consumer or process.
 */
export function test_film_forge_prop_gates (): void {
  for (const key of ["constructor", "toString", "__proto__"]) {
    const spec: IAutoMoviePropSpec = createDoorPropSpec();
    if (spec.articulation === null) throw new Error("Door fixture must articulate");
    spec.articulation.profile.drivers = [];
    spec.articulation.profile.limits = [{ channel: { kind: "node", node: key, path: "rotation" }, min: null, max: null }];
    spec.articulation.binding.boneMap = {};
    const inherited: IAutoMovieForgedProp = forgeProp(spec);
    TestValidator.predicate(`inherited semantic key ${key} is not a binding`, inherited.success === false && inherited.violations.some((item: IAutoMovieConstraintViolation): boolean => item.path === "$input.articulation.binding.boneMap" && item.expected.includes(`references "${key}"`) && item.expected.includes("does not map it")));
    spec.articulation.binding.boneMap = { [key]: "hinge" };
    TestValidator.equals(`own semantic key ${key} maps the declared hinge`, forgeProp(spec).success, true);
  }
  const emptyNode: IAutoMovieForgedProp = broken((s: IAutoMoviePropSpec) : IAutoMoviePropSpec => ({ ...s, node: "  " }));
  TestValidator.predicate(
    "empty node id violates",
    hasViolation(emptyNode, "type", "$input.node"),
  );

  const wrongId: IAutoMovieForgedProp = broken((s: IAutoMoviePropSpec) : IAutoMoviePropSpec => ({
    ...s,
    model: { ...s.model, id: "other" },
  }));
  TestValidator.predicate(
    "model id must equal node",
    hasViolation(wrongId, "type", "$input.model.id"),
  );

  const importedOrigin: IAutoMovieForgedProp = broken((s: IAutoMoviePropSpec) : IAutoMoviePropSpec => ({
    ...s,
    model: { ...s.model, origin: "imported" },
  }));
  TestValidator.predicate(
    "imported origin violates",
    hasViolation(importedOrigin, "type", "$input.model.origin"),
  );

  const withSkeleton: IAutoMovieForgedProp = broken((s: IAutoMoviePropSpec) : IAutoMoviePropSpec => ({
    ...s,
    model: { ...s.model, skeleton: createSkeleton() },
  }));
  TestValidator.predicate(
    "a skeleton makes it an actor, not a prop",
    hasViolation(withSkeleton, "type", "$input.model.skeleton"),
  );

  const badPart: IAutoMovieForgedProp = broken((s: IAutoMoviePropSpec) : IAutoMoviePropSpec => ({
    ...s,
    model: {
      ...s.model,
      parts: s.model.parts.map((p: IAutoMovieModelPart) : IAutoMovieModelPart => ({
        ...p,
        geometry: {
          type: "primitive" as const,
          shape: { type: "box" as const, width: 0, height: 1, depth: 1 },
        },
      })),
    },
  }));
  TestValidator.predicate(
    "validateModel violations remap under $input.model",
    hasViolation(badPart, "range", "$input.model.parts[0]"),
  );

  const noNodes: IAutoMovieForgedProp = broken((s: IAutoMoviePropSpec) : IAutoMoviePropSpec => ({
    ...s,
    articulation: { ...s.articulation!, nodes: [] },
  }));
  TestValidator.predicate(
    "empty articulation nodes violate",
    hasViolation(noNodes, "type", "$input.articulation.nodes"),
  );

  const dupNode: IAutoMovieForgedProp = broken((s: IAutoMoviePropSpec) : IAutoMoviePropSpec => ({
    ...s,
    articulation: {
      ...s.articulation!,
      nodes: [...s.articulation!.nodes, s.articulation!.nodes[1]!],
    },
  }));
  TestValidator.predicate(
    "duplicate joint node id violates",
    hasViolation(dupNode, "type", ".nodes[3].id"),
  );

  const emptyId: IAutoMovieForgedProp = broken((s: IAutoMoviePropSpec) : IAutoMoviePropSpec => ({
    ...s,
    articulation: {
      ...s.articulation!,
      nodes: s.articulation!.nodes.map((n: IAutoMovieNode, i: number) : IAutoMovieNode =>
        i === 2 ? { ...n, id: " " } : n,
      ),
      binding: {
        ...s.articulation!.binding,
        boneMap: { pivot: "hinge", mirror: "hinge" },
      },
    },
  }));
  TestValidator.predicate(
    "empty joint node id violates",
    hasViolation(emptyId, "type", ".nodes[2].id"),
  );

  const badParent: IAutoMovieForgedProp = broken((s: IAutoMoviePropSpec) : IAutoMoviePropSpec => ({
    ...s,
    articulation: {
      ...s.articulation!,
      nodes: s.articulation!.nodes.map((n: IAutoMovieNode, i: number) : IAutoMovieNode =>
        i === 1 ? { ...n, parent: "ghost" } : n,
      ),
    },
  }));
  TestValidator.predicate(
    "undeclared parent violates",
    hasViolation(badParent, "type", ".nodes[1].parent"),
  );

  const cyclic: IAutoMovieForgedProp = broken((s: IAutoMoviePropSpec) : IAutoMoviePropSpec => ({
    ...s,
    articulation: {
      ...s.articulation!,
      nodes: s.articulation!.nodes.map((n: IAutoMovieNode, i: number) : IAutoMovieNode =>
        i === 0 ? { ...n, parent: "hinge" } : n,
      ),
    },
  }));
  TestValidator.predicate(
    "cyclic parent chain violates",
    hasViolation(cyclic, "type", ".parent"),
  );

  const bindingMismatch: IAutoMovieForgedProp = broken((s: IAutoMoviePropSpec) : IAutoMoviePropSpec => ({
    ...s,
    articulation: {
      ...s.articulation!,
      binding: { ...s.articulation!.binding, profile: "other-profile" },
    },
  }));
  TestValidator.predicate(
    "binding profile mismatch violates",
    hasViolation(bindingMismatch, "type", ".binding.profile"),
  );

  const unknownMapped: IAutoMovieForgedProp = broken((s: IAutoMoviePropSpec) : IAutoMoviePropSpec => ({
    ...s,
    articulation: {
      ...s.articulation!,
      binding: {
        ...s.articulation!.binding,
        boneMap: { pivot: "ghost", mirror: "" },
      },
    },
  }));
  TestValidator.predicate(
    "boneMap to an undeclared node violates",
    hasViolation(unknownMapped, "type", 'boneMap["pivot"]'),
  );
  TestValidator.predicate(
    "boneMap to an empty id violates",
    hasViolation(unknownMapped, "type", 'boneMap["mirror"]'),
  );

  const unmapped: IAutoMovieForgedProp = broken((s: IAutoMoviePropSpec) : IAutoMoviePropSpec => ({
    ...s,
    articulation: {
      ...s.articulation!,
      binding: { ...s.articulation!.binding, boneMap: {} },
    },
  }));
  TestValidator.equals(
    "both unmapped profile keys listed at once",
    unmapped.success === false
      ? unmapped.violations.filter((v: IAutoMovieConstraintViolation) : boolean =>
          v.expected.includes("does not map it"),
        ).length
      : 0,
    2,
  );
}
