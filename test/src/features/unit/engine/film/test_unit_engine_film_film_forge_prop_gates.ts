import { forgeProp } from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  type IAutoMovieForgedProp,
  IAutoMovieModelPart,
  IAutoMovieNode,
  IAutoMoviePropSpec,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createDoorPropSpec } from "../../../internal/createDoorPropSpec";
import { createSkeleton } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * Forge a fresh door after the caller applies its authored mutation.
 *
 * The owning test supplies authored bad identities, graph edges, mappings and
 * extents and asserts located refusals; this adapter derives no expected findings.
 */
function broken(
  mutate: (spec: IAutoMoviePropSpec) => IAutoMoviePropSpec,
): ReturnType<typeof forgeProp> {
  return forgeProp(mutate(createDoorPropSpec()));
}

/**
 * ForgeProp's gates report every contract breach with a field-located path for the correction round, and, unlike bindProfile's first-throw, the missing boneMap mappings are reported all at once.
 *
 * Scenarios:
 *
 * 1. A model id differing from the node breaks the staging join.
 * 2. An imported origin violates the generated-prop contract.
 * 3. A model with a skeleton is an actor, not a prop: rejected toward forgeCast.
 * 4. An invalid model (zero-extent part) surfaces validateModel's violation remapped under `$input.model`.
 * 5. Empty articulation nodes violate.
 * 6. A duplicated joint node id violates at the duplicate's path.
 * 7. A parent naming an undeclared node violates.
 * 8. A cyclic parent chain violates.
 * 9. A binding targeting a different profile id violates.
 * 10. A boneMap value naming an undeclared node violates.
 * 11. Both unmapped profile keys are listed in one round (pivot and mirror).
 * 12. Inherited constructor/toString/__proto__ properties do not supply a semantic mapping; an explicit own mapping of the same spelling passes.
 */
export function test_unit_engine_film_film_forge_prop_gates(): void {
  for (const key of ["constructor", "toString", "__proto__"]) {
    const spec: IAutoMoviePropSpec = createDoorPropSpec();
    if (spec.articulation === null)
      throw new Error("Door fixture must articulate");
    spec.articulation.profile.drivers = [];
    spec.articulation.profile.limits = [
      {
        channel: { kind: "node", node: key, path: "rotation" },
        min: null,
        max: null,
      },
    ];
    spec.articulation.binding.boneMap = {};
    const inherited: IAutoMovieForgedProp = forgeProp(spec);
    TestValidator.predicate(
      `inherited semantic key ${key} is not a binding`,
      inherited.success === false &&
        inherited.violations.some(
          (item: IAutoMovieConstraintViolation): boolean =>
            item.path === "$input.articulation.binding.boneMap" &&
            item.expected.includes(`references "${key}"`) &&
            item.expected.includes("does not map it"),
        ),
    );
    spec.articulation.binding.boneMap = { [key]: "hinge" };
    TestValidator.equals(
      `own semantic key ${key} maps the declared hinge`,
      forgeProp(spec).success,
      true,
    );
  }
  const wrongId: IAutoMovieForgedProp = broken(
    (s: IAutoMoviePropSpec): IAutoMoviePropSpec => ({
      ...s,
      model: { ...s.model, id: "other" },
    }),
  );
  TestValidator.predicate(
    "model id must equal node",
    hasViolation(wrongId, "type", "$input.model.id"),
  );

  const importedOrigin: IAutoMovieForgedProp = broken(
    (s: IAutoMoviePropSpec): IAutoMoviePropSpec => ({
      ...s,
      model: { ...s.model, origin: "imported" },
    }),
  );
  TestValidator.predicate(
    "imported origin violates",
    hasViolation(importedOrigin, "type", "$input.model.origin"),
  );

  const withSkeleton: IAutoMovieForgedProp = broken(
    (s: IAutoMoviePropSpec): IAutoMoviePropSpec => ({
      ...s,
      model: { ...s.model, skeleton: createSkeleton() },
    }),
  );
  TestValidator.predicate(
    "a skeleton makes it an actor, not a prop",
    hasViolation(withSkeleton, "type", "$input.model.skeleton"),
  );

  const badPart: IAutoMovieForgedProp = broken(
    (s: IAutoMoviePropSpec): IAutoMoviePropSpec => ({
      ...s,
      model: {
        ...s.model,
        parts: s.model.parts.map(
          (p: IAutoMovieModelPart): IAutoMovieModelPart => ({
            ...p,
            geometry: {
              type: "primitive" as const,
              shape: { type: "box" as const, width: 0, height: 1, depth: 1 },
            },
          }),
        ),
      },
    }),
  );
  TestValidator.predicate(
    "validateModel violations remap under $input.model",
    hasViolation(badPart, "range", "$input.model.parts[0]"),
  );

  const noNodes: IAutoMovieForgedProp = broken(
    (s: IAutoMoviePropSpec): IAutoMoviePropSpec => ({
      ...s,
      articulation: { ...s.articulation!, nodes: [] },
    }),
  );
  TestValidator.predicate(
    "empty articulation nodes violate",
    hasViolation(noNodes, "type", "$input.articulation.nodes"),
  );

  const dupNode: IAutoMovieForgedProp = broken(
    (s: IAutoMoviePropSpec): IAutoMoviePropSpec => ({
      ...s,
      articulation: {
        ...s.articulation!,
        nodes: [...s.articulation!.nodes, s.articulation!.nodes[1]!],
      },
    }),
  );
  TestValidator.predicate(
    "duplicate joint node id violates",
    hasViolation(dupNode, "type", ".nodes[3].id"),
  );

  const badParent: IAutoMovieForgedProp = broken(
    (s: IAutoMoviePropSpec): IAutoMoviePropSpec => ({
      ...s,
      articulation: {
        ...s.articulation!,
        nodes: s.articulation!.nodes.map(
          (n: IAutoMovieNode, i: number): IAutoMovieNode =>
            i === 1 ? { ...n, parent: "ghost" } : n,
        ),
      },
    }),
  );
  TestValidator.predicate(
    "undeclared parent violates",
    hasViolation(badParent, "type", ".nodes[1].parent"),
  );

  const cyclic: IAutoMovieForgedProp = broken(
    (s: IAutoMoviePropSpec): IAutoMoviePropSpec => ({
      ...s,
      articulation: {
        ...s.articulation!,
        nodes: s.articulation!.nodes.map(
          (n: IAutoMovieNode, i: number): IAutoMovieNode =>
            i === 0 ? { ...n, parent: "hinge" } : n,
        ),
      },
    }),
  );
  TestValidator.predicate(
    "cyclic parent chain violates",
    hasViolation(cyclic, "type", ".parent"),
  );

  const bindingMismatch: IAutoMovieForgedProp = broken(
    (s: IAutoMoviePropSpec): IAutoMoviePropSpec => ({
      ...s,
      articulation: {
        ...s.articulation!,
        binding: { ...s.articulation!.binding, profile: "other-profile" },
      },
    }),
  );
  TestValidator.predicate(
    "binding profile mismatch violates",
    hasViolation(bindingMismatch, "type", ".binding.profile"),
  );

  const unknownMapped: IAutoMovieForgedProp = broken(
    (s: IAutoMoviePropSpec): IAutoMoviePropSpec => ({
      ...s,
      articulation: {
        ...s.articulation!,
        binding: {
          ...s.articulation!.binding,
          boneMap: { pivot: "ghost", mirror: "" },
        },
      },
    }),
  );
  TestValidator.predicate(
    "boneMap to an undeclared node violates",
    hasViolation(unknownMapped, "type", 'boneMap["pivot"]'),
  );

  const unmapped: IAutoMovieForgedProp = broken(
    (s: IAutoMoviePropSpec): IAutoMoviePropSpec => ({
      ...s,
      articulation: {
        ...s.articulation!,
        binding: { ...s.articulation!.binding, boneMap: {} },
      },
    }),
  );
  TestValidator.equals(
    "both unmapped profile keys listed at once",
    unmapped.success === false
      ? unmapped.violations.filter(
          (v: IAutoMovieConstraintViolation): boolean =>
            v.expected.includes("does not map it"),
        ).length
      : 0,
    2,
  );
}
