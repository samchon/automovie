import {
  describeAutoMovieSubject,
  diffAutoMovieSubjects,
} from "@automovie/engine";
import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieModel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  subjectInspectionArtifact,
  subjectInspectionIdentityTransform,
  subjectInspectionInstanceSet,
  subjectInspectionModel,
} from "../internal/subjectInspectionFixtures";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * Subject description preserves explicit absence and less common compiled geometry, hierarchy, population, and placement forms.
 *
 * Scenarios:
 *
 * 1. Primitive geometry, a non-identity part transform, a rigid rest-bone attachment, a missing attachment bone, and a null material all produce honest prototype facts.
 * 2. A transform-only scene node with no resident model reports null content, no materials, and no members rather than throwing or inventing geometry.
 * 3. A child element and child shell space report their owners; the shell has a declared box but no content, while a semantic-only space has neither.
 * 4. A building population links its compact set and instance to the owning logical space.
 * 5. Missing runtime LODs yield null prototype and geometry, while seeded rotation, non-uniform scale, and zero-weight prototype fallback remain deterministic.
 * 6. A logical-space declaration edit is classified as one reshape.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls direct descriptions and subject diff for less common compiled forms, checking explicit absence, ownership, bounds, prototype selection and one-space reshape; invented payloads or broken hierarchy links fail.
 * @evidence contracts/testing.md#independent-expectations Authored box dimensions, one-metre part offset, five-metre rigid rest and explicit shell coordinates determine geometry; zero-weight selection follows the final-prototype contract, while finite checks do not assert an exact seed draw.
 * @evidence contracts/testing.md#distinguishing-cases Primitive and rigid attachments including a missing bone, empty/missing models, shell/semantic spaces, population ownership, missing LOD, seeded variation and a logical-space edit are retained; full enumeration and coordinate-oracle units own their separate cases.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_inspection_subject_description_edges entry owns these synchronous portable compiled-record cases and local fact callbacks; resident synthetic records require no production installation, process, browser or GPU.
 */
export function test_inspection_subject_description_edges(): void {
  const primitive: IAutoMovieModel = primitiveModel();
  const rigged: IAutoMovieModel = riggedModel();
  const empty: IAutoMovieModel = emptyModel();
  const noModelSet: IAutoMovieCompiledInstanceSet =
    subjectInspectionInstanceSet({
      id: "no-model",
      model: "absent",
      count: 1,
      overrides: { lod: [] },
    });
  const enhanced: IAutoMovieCompiledInstanceSet = enhancedSet();
  const base: import("@automovie/interface").IAutoMovieSubjectArtifact =
    subjectInspectionArtifact();
  const environment: IAutoMovieBuiltEnvironment = edgeEnvironment(
    structuredClone(base.compiled.builtEnvironments![0]!),
    noModelSet,
  );
  const artifact: import("@automovie/interface").IAutoMovieSubjectArtifact =
    subjectInspectionArtifact({
      revision: "edge-revision",
      models: [
        ...base.compiled.models,
        primitive,
        rigged,
        empty,
        subjectInspectionModel({
          id: "alternate",
          min: { x: -1, y: -1, z: -1 },
          max: { x: 1, y: 1, z: 1 },
        }),
      ],
      nodes: [
        ...base.compiled.scene.nodes,
        {
          id: "primitive-node",
          model: "primitive",
          transform: subjectInspectionIdentityTransform(),
          motion: null,
          pose: null,
        },
        {
          id: "ghost",
          model: "missing-model",
          transform: subjectInspectionIdentityTransform(),
          motion: null,
          pose: null,
        },
      ],
      instanceSets: [noModelSet, enhanced],
      environment,
    });

  const primitivePart: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "prototype-part:primitive/body");
  const placedPrimitivePart: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "element-part:primitive-node/body");
  const rig: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "prototype:rigged");
  const emptyPrototype: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "prototype:empty");
  TestValidator.predicate(
    "primitive transforms rigid rest bones missing bones and null materials remain explicit",
    test12ValuesClose(
      {
        primitive: {
          bounds: primitivePart.bounds.content,
          transform: primitivePart.transform,
          materials: primitivePart.materials,
          placedSpace: placedPrimitivePart.space,
        },
        rig: {
          semanticKind: rig.semanticKind,
          bounds: rig.bounds.content,
        },
        empty: emptyPrototype.bounds.content,
      },
      {
        primitive: {
          bounds: {
            min: { x: 0, y: -2, z: -3 },
            max: { x: 2, y: 2, z: 3 },
          },
          transform: {
            translation: { x: 1, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          materials: [],
          placedSpace: null,
        },
        rig: {
          semanticKind: "actor",
          bounds: {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 1, y: 6, z: 1 },
          },
        },
        empty: null,
      },
    ),
  );

  const ghost: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "element:ghost");
  TestValidator.predicate(
    "a scene node whose model payload is absent reports explicit empty geometry",
    test12ValuesClose(
      {
        semanticKind: ghost.semanticKind,
        name: ghost.name,
        bounds: ghost.bounds.content,
        materials: ghost.materials,
        members: ghost.members,
      },
      {
        semanticKind: "scene-node",
        name: null,
        bounds: null,
        materials: [],
        members: { total: 0, offset: 0, items: [], omitted: 0 },
      },
    ),
  );

  const child: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "element:castle/solar-oriel");
  const childPart: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "element-part:castle/solar-oriel/body");
  const shell: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "space:castle/shell-room");
  const semantic: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "space:castle/semantic-zone");
  TestValidator.predicate(
    "built hierarchy and empty declared or semantic spaces keep their exact relations",
    test12ValuesClose(
      {
        childOwner: child.owner,
        childPartSpace: childPart.space,
        shellOwner: shell.owner,
        shellBounds: shell.bounds,
        semanticBounds: semantic.bounds,
      },
      {
        childOwner: "element:castle/guard-rack-west-pole-0",
        childPartSpace: "space:castle/hall",
        shellOwner: "space:castle/hall",
        shellBounds: {
          declared: {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 2, y: 2, z: 2 },
          },
          content: null,
          coordinateSpace: "world",
        },
        semanticBounds: {
          declared: null,
          content: null,
          coordinateSpace: "world",
        },
      },
    ),
  );

  const population: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "instance-set:no-model");
  const populationMember: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "instance:no-model:slot:000000");
  TestValidator.predicate(
    "a building population links set and member to its owning space despite missing runtime geometry",
    test12ValuesClose(
      {
        set: {
          owner: population.owner,
          space: population.space,
          prototype: population.prototype,
          materials: population.materials,
        },
        member: {
          space: populationMember.space,
          prototype: populationMember.prototype,
          bounds: populationMember.bounds.content,
          materials: populationMember.materials,
        },
      },
      {
        set: {
          owner: "space:castle/hall",
          space: "space:castle/hall",
          prototype: null,
          materials: [],
        },
        member: {
          space: "space:castle/hall",
          prototype: null,
          bounds: null,
          materials: [],
        },
      },
    ),
  );

  const enhancedMember: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "instance:enhanced:slot:000000");
  TestValidator.predicate(
    "seeded non-uniform variation and zero-weight fallback select the final prototype deterministically",
    test12ValuesClose(
      {
        model: enhancedMember.model,
        semanticKind: enhancedMember.semanticKind,
        finite:
          Object.keys(enhancedMember.transform!.rotation).length === 4 &&
          Object.keys(enhancedMember.transform!.scale).length === 3 &&
          [
            ...Object.values(enhancedMember.transform!.rotation),
            ...Object.values(enhancedMember.transform!.scale),
          ].every(Number.isFinite),
      },
      { model: "alternate", semanticKind: "alternate", finite: true },
    ),
  );

  const changedEnvironment: IAutoMovieBuiltEnvironment =
    structuredClone(environment);
  changedEnvironment.spaces.find(
    (space: import("@automovie/interface").IAutoMovieBuiltSpace): boolean =>
      space.id === "shell-room",
  )!.kind = "gallery";
  const spaceDiff: import("@automovie/interface").IAutoMovieSubjectDiff =
    diffAutoMovieSubjects(
      artifact,
      subjectInspectionArtifact({
        revision: "edge-revision-next",
        models: artifact.compiled.models,
        nodes: artifact.compiled.scene.nodes,
        instanceSets: artifact.compiled.instanceSets,
        environment: changedEnvironment,
      }),
    );
  TestValidator.predicate(
    "one logical-space declaration edit is one reshape",
    test12ValuesClose(
      spaceDiff.reshaped
        .filter(
          (
            change: import("@automovie/interface").IAutoMovieSubjectChange,
          ): boolean => change.kind === "space",
        )
        .map(
          (
            change: import("@automovie/interface").IAutoMovieSubjectChange,
          ): string => change.id,
        ),
      ["space:castle/shell-room"],
    ),
  );
}

const primitiveModel: () => IAutoMovieModel = (): IAutoMovieModel => {
  const model: IAutoMovieModel = subjectInspectionModel({
    id: "primitive",
    min: { x: 0, y: 0, z: 0 },
    max: { x: 0, y: 0, z: 0 },
    material: null,
  });
  model.parts[0]!.geometry = {
    type: "primitive",
    shape: { type: "box", width: 2, height: 4, depth: 6 },
  };
  model.parts[0]!.transform = {
    ...subjectInspectionIdentityTransform(),
    translation: { x: 1, y: 0, z: 0 },
  };
  model.parts[0]!.material = null;
  return model;
};

const riggedModel: () => IAutoMovieModel = (): IAutoMovieModel => {
  const model: IAutoMovieModel = subjectInspectionModel({
    id: "rigged",
    min: { x: 0, y: 0, z: 0 },
    max: { x: 1, y: 1, z: 1 },
  });
  model.skeleton = {
    id: "rigged-skeleton",
    bones: [
      {
        bone: "hips",
        parent: null,
        rest: {
          ...subjectInspectionIdentityTransform(),
          translation: { x: 0, y: 5, z: 0 },
        },
        constraint: null,
      },
    ],
  };
  model.parts[0]!.attachedBone = "hips";
  model.parts.push({
    ...structuredClone(model.parts[0]!),
    id: "unmapped",
    attachedBone: "head",
  });
  return model;
};

const emptyModel: () => IAutoMovieModel = (): IAutoMovieModel =>
  ({
    ...subjectInspectionModel({
      id: "empty",
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
    }),
    parts: [],
    name: null,
  }) as IAutoMovieModel;

const enhancedSet: () => IAutoMovieCompiledInstanceSet =
  (): IAutoMovieCompiledInstanceSet => {
    const set: IAutoMovieCompiledInstanceSet = subjectInspectionInstanceSet({
      id: "enhanced",
      model: "primitive",
      count: 1,
    });
    return {
      ...set,
      prototypes: [
        prototype("default", "primitive"),
        prototype("alternate", "alternate"),
      ],
      variation: {
        ...set.variation,
        scale3: {
          min: { x: 0.5, y: 0.75, z: 1 },
          max: { x: 1, y: 1.25, z: 1.5 },
        },
        rotationDeg: {
          x: { min: -5, max: 5 },
          y: { min: -10, max: 10 },
          z: { min: -15, max: 15 },
        },
      },
    };
  };

const prototype: (
  id: string,
  model: string,
) => {
  id: string;
  modelRecipe: string;
  weight: number;
  lod: {
    tier: "near";
    maxDistance: null;
    recipe: string;
    recipeDigest: `sha256:${string}`;
    model: string;
  }[];
  projectionRadius: number;
} = (
  id: string,
  model: string,
): {
  id: string;
  modelRecipe: string;
  weight: number;
  lod: {
    tier: "near";
    maxDistance: null;
    recipe: string;
    recipeDigest: `sha256:${string}`;
    model: string;
  }[];
  projectionRadius: number;
} => ({
  id,
  modelRecipe: model,
  weight: 0,
  lod: [
    {
      tier: "near" as const,
      maxDistance: null,
      recipe: model,
      recipeDigest: `sha256:${"7".repeat(64)}` as const,
      model,
    },
  ],
  projectionRadius: 1,
});

const edgeEnvironment: (
  environment: IAutoMovieBuiltEnvironment,
  populationSet: IAutoMovieCompiledInstanceSet,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
  populationSet: IAutoMovieCompiledInstanceSet,
): IAutoMovieBuiltEnvironment => {
  environment.elements.find(
    (element: import("@automovie/interface").IAutoMovieBuiltElement): boolean =>
      element.id === "solar-oriel",
  )!.parent = "guard-rack-west-pole-0";
  environment.spaces.push(
    {
      id: "shell-room",
      kind: "room",
      parent: "hall",
      cells: [],
      shell: {
        vertices: [
          { x: 0, y: 0, z: 0 },
          { x: 2, y: 0, z: 0 },
          { x: 0, y: 2, z: 0 },
          { x: 0, y: 0, z: 2 },
        ],
        triangles: [0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3],
      },
    },
    {
      id: "semantic-zone",
      kind: "zone",
      parent: null,
      cells: [],
    },
  );
  environment.populations = [
    {
      space: "hall",
      prototypeBounds: {
        min: { x: -0.5, y: 0, z: -0.5 },
        max: { x: 0.5, y: 1, z: 0.5 },
      },
      set: populationSet as never,
    },
  ];
  return environment;
};
