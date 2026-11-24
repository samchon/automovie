import {
  createEnvironment,
  environmentModel,
} from "@automovie/archetypes/environments";
import {
  Quaternion,
  Transform,
  buildAutoMovieWall,
  heightAt,
} from "@automovie/engine";
import type {
  IAutoMovieEnvironment,
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentItem,
  IAutoMovieEnvironmentModel,
  IAutoMovieEnvironmentModule,
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieStageSetPiece,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/createModel";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * Compose two copies of a supplied landmark and place another prop at a named entry.
 *
 * Scenarios:
 *
 * 1. Two transformed uses of the same mesh definition publish distinct node/model ids and seeds. A prop declared before its host resolves the host's rotated anchor without reordering the staged records.
 * 2. The local plane and its hole follow the landmark through the same yaw and translation. A raised point on the rotated plane and an uncovered point in the hole distinguish the transform. Substituting the landmark's model preserves the entry and its attachments.
 * 3. An unrelated sibling leaves existing seeded definitions unchanged. Two producers can both read the other's already determined origin.
 * 4. Unknown named anchors, cyclic placements and conflicting model identities refuse with source diagnostics.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the forward contact, repeated model, rotated support, stable seed and refusal scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Observes real createEnvironment and environmentModel records, canonical height queries on the merged stage space, and ordinary thrown errors through the supplied authoring API.
 * @evidence contracts/development/testing.md#independent-expectations A quarter turn maps +X to -Z and +Z to +X. The literal transformed points, analytic plane height and local-hole centre supply oracles independently of the constructor. Literal scoped ids establish stage and prop joins.
 * @evidence contracts/development/testing.md#distinguishing-cases Reuse of one definition differs from a conflicting id, an ordinary forward anchor differs from a placement cycle and unknown anchor, and an exposed plane point differs from a hole. An added sibling does not alter seed keys.
 * @evidence contracts/development/testing.md#execution-ownership One portable CPU scenario uses the package entry and canonical engine functions. Browser capture and active shot compilation belong to the campaign's production scenarios.
 */
export function test_environment_composition(): void {
  const base: IAutoMovieModel = createModel(null);
  const facade: IAutoMovieMesh = buildAutoMovieWall({
    width: 6,
    height: 3,
    depth: 0.2,
    openings: [{ id: "entry", x: 2, y: 0, width: 2, height: 2.2 }],
  });
  const landmarkInput: IAutoMovieEnvironmentModel = {
    model: {
      ...base,
      parts: [
        {
          ...base.parts[0]!,
          geometry: { type: "mesh", mesh: facade },
        },
      ],
    },
    anchors: {
      entry: Transform.of({ x: 1, y: 0.5, z: 2 }, Quaternion.identity()),
    },
    space: {
      id: "level",
      surfaces: [
        {
          id: "floor",
          kind: "ramp",
          polygon: square(3),
          holes: [square(0.25)],
          height: { kind: "plane", originHeight: 0, slopeX: 0.5, slopeZ: 0 },
        },
      ],
      walkable: ["floor"],
    },
  };
  const landmark: IAutoMovieEnvironmentModule = environmentModel(landmarkInput);
  /** Store the module's actual seed in a model label so the scenario can compare it after composition. */
  const seededLandmark: IAutoMovieEnvironmentModule = (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution => {
    const result: IAutoMovieEnvironmentContribution = landmark(context);
    return {
      ...result,
      models: result.models?.map(
        (model: IAutoMovieModel): IAutoMovieModel => ({
          ...model,
          name: context.seed ?? null,
        }),
      ),
    };
  };
  const prop: IAutoMovieEnvironmentModule = environmentModel({
    model: base,
    prop: { articulation: null },
  });
  const items: Readonly<Record<string, IAutoMovieEnvironmentItem>> = {
    marker: {
      use: prop,
      at: { anchor: "right/entry", offset: { x: 0, y: 1, z: 1 } },
    },
    right: {
      use: seededLandmark,
      at: { x: 10, y: 3, z: 5 },
      rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    },
    left: { use: seededLandmark, at: { x: -20, y: 2, z: 0 } },
  };
  const environment: IAutoMovieEnvironment = createEnvironment({
    id: "estate",
    seed: 4,
    items,
  });
  TestValidator.equals(
    "forward attachment preserves stage order",
    environment.stage.set.map(
      (piece: IAutoMovieStageSetPiece): string => piece.node,
    ),
    ["estate/marker", "estate/right", "estate/left"],
  );
  TestValidator.predicate(
    "prop and stage share the marker model, and both landmarks share their original mesh",
    environment.runtime.props[0]?.model === environment.runtime.models[0] &&
      environment.runtime.models[0]?.id === "estate/marker" &&
      environment.runtime.models[1]?.id === "estate/right" &&
      environment.runtime.models[2]?.id === "estate/left" &&
      environment.runtime.models[1]?.parts[0]?.geometry.type === "mesh" &&
      environment.runtime.models[1].parts[0].geometry.mesh === facade &&
      environment.runtime.models[2]?.parts ===
        environment.runtime.models[1].parts,
  );
  TestValidator.predicate(
    "landmark entry, attached prop and plane use the same world pose",
    vclose(environment.anchors["right/entry"]!.translation, {
      x: 12,
      y: 3.5,
      z: 4,
    }) &&
      vclose(environment.stage.set[0]!.position, { x: 13, y: 4.5, z: 4 }) &&
      nclose(heightAt(environment.stage.space!, 12, 4) ?? NaN, 3.5) &&
      heightAt(environment.stage.space!, 10, 5) === null,
  );
  const replacement: IAutoMovieEnvironment = createEnvironment({
    id: "estate",
    seed: 4,
    items: {
      ...items,
      right: {
        ...items.right!,
        use: environmentModel({ ...landmarkInput, model: base }),
      },
    },
  });
  TestValidator.predicate(
    "replacing landmark geometry preserves the named entrance and its attached node",
    replacement.runtime.models[1]!.parts[0]!.geometry.type === "primitive" &&
      vclose(replacement.anchors["right/entry"]!.translation, {
        x: 12,
        y: 3.5,
        z: 4,
      }) &&
      replacement.stage.set[0]!.node === "estate/marker" &&
      vclose(replacement.stage.set[0]!.position, { x: 13, y: 4.5, z: 4 }),
  );
  const withSibling: IAutoMovieEnvironment = createEnvironment({
    id: "estate",
    seed: 4,
    items: { sign: { use: prop }, ...items },
  });
  TestValidator.predicate(
    "unrelated siblings preserve seeds, while distinct placements use distinct streams",
    environment.runtime.models[1]!.name !==
      environment.runtime.models[2]!.name &&
      environment.runtime.models[1]!.name ===
        withSibling.runtime.models[2]!.name &&
      environment.runtime.models[2]!.name ===
        withSibling.runtime.models[3]!.name,
  );
  const mutualOrigins: IAutoMovieEnvironment = createEnvironment({
    id: "survey",
    items: {
      a: {
        use: (context) => ({ anchors: { other: context.anchor("b") } }),
        at: { x: 1, y: 0, z: 0 },
      },
      b: {
        use: (context) => ({ anchors: { other: context.anchor("a") } }),
        at: { x: 2, y: 0, z: 0 },
      },
    },
  });
  TestValidator.predicate(
    "references to precomputable origins do not introduce definition cycles",
    vclose(mutualOrigins.anchors["a/other"]!.translation, {
      x: 2,
      y: 0,
      z: 0,
    }) &&
      vclose(mutualOrigins.anchors["b/other"]!.translation, {
        x: 1,
        y: 0,
        z: 0,
      }),
  );
  TestValidator.predicate(
    "missing anchors refuse the original placement path",
    throwsError(
      () =>
        createEnvironment({
          id: "estate",
          items: {
            ...items,
            marker: { use: prop, at: { anchor: "right/missing" } },
          },
        }),
      ['items["marker"].at', 'unknown environment anchor "right/missing"'],
    ),
  );
  TestValidator.predicate(
    "cyclic placement and conflicting definitions refuse",
    throwsError(
      () =>
        createEnvironment({
          id: "estate",
          items: {
            a: { use: prop, at: { anchor: "b" } },
            b: { use: prop, at: { anchor: "a" } },
          },
        }),
      ["reference cycle", "a/placement -> b/placement -> a/placement"],
    ) &&
      throwsError(
        () =>
          createEnvironment({
            id: "estate",
            items: { a: { use: () => ({ models: [base, { ...base }] }) } },
          }),
        'conflicting model "model-1"',
      ),
  );
}

/** Square XZ footprint centred on the supplied model's origin. */
function square(half: number): IAutoMovieVector3[] {
  return [
    { x: -half, y: 0, z: -half },
    { x: half, y: 0, z: -half },
    { x: half, y: 0, z: half },
    { x: -half, y: 0, z: half },
  ];
}
