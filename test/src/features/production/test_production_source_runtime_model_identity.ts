import { createAutoMovieSourceRuntimeModelRegistry } from "@automovie/production";
import type { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingBoxModel } from "../internal/drawingFixtures";
import { namedFacts } from "../internal/predicates";

/**
 * Source runtime model membership is exact own-key data.
 *
 * Scenarios:
 *
 * 1. Compiler keys and contained model ids resolve independently while own-key
 *    enumeration preserves insertion order.
 * 2. A source model named `__proto__` is registered, looked up, enumerated, and
 *    serialized exactly once as an own data property.
 * 3. A builder-owned `__proto__` key is seeded with the same own-data
 *    semantics, while prototype member names absent from a registry remain
 *    unavailable.
 *
 * @evidence contracts/testing.md#behavioral-verification Defines one source model and checks exact-key lookup, model-id fallback, own membership, ordered projections and serialized own data, including a builder-seeded __proto__ key. Reference identity distinguishes the two models; absent inherited names must remain unavailable.
 * @evidence contracts/testing.md#independent-expectations Literal builder-key/builder-model-id and __proto__ identities, insertion order and an independently authored Object.fromEntries record supply the expected population. Serialization equality deliberately checks exact record representation of the same model references, rather than numerical geometry calculations.
 * @evidence contracts/testing.md#distinguishing-cases Separates builder key from contained model id, source-defined from initial __proto__ membership, and real own prototype-like keys from absent toString/constructor/valueOf names. Duplicate-key replacement and ambiguous model-id precedence are outside these three scenarios.
 * @evidence contracts/testing.md#execution-ownership The named test_production_source_runtime_model_identity synchronously exercises the public production registry with portable model fixtures. It uses no filesystem, loader cache, renderer, process or geometry evaluation and establishes registry semantics rather than visual model correctness.
 */
export function test_production_source_runtime_model_identity(): void {
  const compilerModel: IAutoMovieModel = drawingBoxModel({
    id: "builder-model-id",
    shape: { type: "box", width: 1, height: 1, depth: 1 },
    material: "builder-material",
  });
  const authoredModel: IAutoMovieModel = drawingBoxModel({
    id: "__proto__",
    shape: { type: "box", width: 2, height: 1, depth: 1 },
    material: "authored-material",
  });
  const registry: ReturnType<typeof createAutoMovieSourceRuntimeModelRegistry> = createAutoMovieSourceRuntimeModelRegistry(
    Object.fromEntries([["builder-key", compilerModel]]),
  );
  registry.define(authoredModel.id, authoredModel);
  const compilerPrototypeRegistry: ReturnType<typeof createAutoMovieSourceRuntimeModelRegistry> = createAutoMovieSourceRuntimeModelRegistry(
    Object.fromEntries([["__proto__", compilerModel]]),
  );

  TestValidator.equals(
    "runtime model registry preserves only exact own identities",
    namedFacts([
      [
        "compilerKeyResolves",
        (): boolean => registry.get("builder-key") === compilerModel,
      ],
      [
        "containedModelIdResolves",
        (): boolean => registry.resolve("builder-model-id") === compilerModel,
      ],
      [
        "prototypeIdIsOwn",
        (): boolean =>
          registry.has("__proto__") &&
          registry.get("__proto__") === authoredModel &&
          Object.hasOwn(registry.record, "__proto__"),
      ],
      [
        "populationIsExactAndOrdered",
        (): boolean =>
          JSON.stringify(registry.keys()) === '["builder-key","__proto__"]' &&
          JSON.stringify(registry.values().map((model: IAutoMovieModel): string => model.id)) ===
            '["builder-model-id","__proto__"]',
      ],
      [
        "serializationContainsOnlyOwnModels",
        (): boolean =>
          JSON.stringify(registry.record) ===
          JSON.stringify(
            Object.fromEntries([
              ["builder-key", compilerModel],
              ["__proto__", authoredModel],
            ]),
          ),
      ],
      [
        "compilerPrototypeKeyIsOwn",
        (): boolean =>
          compilerPrototypeRegistry.has("__proto__") &&
          compilerPrototypeRegistry.get("__proto__") === compilerModel &&
          JSON.stringify(compilerPrototypeRegistry.keys()) === '["__proto__"]',
      ],
      [
        "inheritedNamesRemainAbsent",
        (): boolean =>
          ["toString", "constructor", "valueOf"].every(
            (identity: string): boolean =>
              registry.has(identity) === false &&
              registry.get(identity) === undefined &&
              registry.resolve(identity) === undefined,
          ),
      ],
    ]),
    {
      compilerKeyResolves: true,
      containedModelIdResolves: true,
      prototypeIdIsOwn: true,
      populationIsExactAndOrdered: true,
      serializationContainsOnlyOwnModels: true,
      compilerPrototypeKeyIsOwn: true,
      inheritedNamesRemainAbsent: true,
    },
  );
}
