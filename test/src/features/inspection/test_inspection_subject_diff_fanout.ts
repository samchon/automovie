import { diffAutoMovieSubjects } from "@automovie/engine";
import {
  type IAutoMovieCompiledInstancePrototype,
  IAutoMovieCompiledInstanceSet,
  type IAutoMovieModel,
  type IAutoMovieSubjectArtifact,
  type IAutoMovieSubjectChange,
  type IAutoMovieSubjectDiff,
  type IAutoMovieSubjectDiffFanout,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { subjectInspectionArtifact } from "../internal/subjectInspectionArtifact";
import { subjectInspectionInstanceSet } from "../internal/subjectInspectionInstanceSet";
import { subjectInspectionModel } from "../internal/subjectInspectionModel";

/**
 * Prototype and instance-selection changes remain bounded aggregate records.
 *
 * Scenarios:
 *
 * 1. Reshaping one prototype used by 2,392 slots yields one prototype and one
 *    part change, each with exact element, set, and instance fan-out but no
 *    member-sized change array.
 * 2. Reassigning one explicit instance from the default to an alternate
 *    prototype reports one reshaped set with one changed selection.
 * 3. One added slot contributes one to the prototype selection-change total;
 *    removal is not exercised here.
 * 4. A missing explicit prototype and a degenerate weighted table remain
 *    deterministic diff inputs rather than crashing aggregate comparison.
 *
 * @evidence contracts/testing.md#behavioral-verification Diffs authored prototype geometry and compact selections, checking exact aggregate fan-out and the absence of individual instance records; expanding one reusable reshape into thousands of records or miscounting reassigned slots fails.
 * @evidence contracts/testing.md#independent-expectations The fixture explicitly places one element and 2392 slots on one model, so both changed prototype records have those literal populations; explicit choices and added-slot count independently determine selection changes without copying diff output.
 * @evidence contracts/testing.md#distinguishing-cases Keeps prototype/part fan-out, a single explicit reassignment, added membership, missing explicit selection, zero weights and a legacy no-LOD set; tolerance and seeded distribution semantics have separate entries.
 * @evidence contracts/testing.md#execution-ownership This exported test basename is discovered by the test runner and directly calls portable diff source with code-authored compiled records; its cases do not launch a browser, process or GPU and do not measure renderer cost.
 */
export function test_inspection_subject_diff_fanout(): void {
  const tileBefore: IAutoMovieModel = subjectInspectionModel({
    id: "tile",
    min: { x: -0.5, y: 0, z: -0.5 },
    max: { x: 0.5, y: 0.1, z: 0.5 },
  });
  const tileAfter: IAutoMovieModel = subjectInspectionModel({
    id: "tile",
    min: { x: -0.5, y: 0, z: -0.5 },
    max: { x: 0.5, y: 0.2, z: 0.5 },
  });
  const tiles: IAutoMovieCompiledInstanceSet = subjectInspectionInstanceSet({
    id: "roof-slates",
    model: "tile",
    count: 2_392,
  });
  const before: IAutoMovieSubjectArtifact = subjectInspectionArtifact({
    revision: "fanout-before",
    models: [tileBefore],
    nodes: [
      {
        id: "sample-tile",
        model: "tile",
        transform: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        motion: null,
        pose: null,
      },
    ],
    instanceSets: [tiles],
    environment: null,
  });
  const after: IAutoMovieSubjectArtifact = subjectInspectionArtifact({
    revision: "fanout-after",
    models: [tileAfter],
    nodes: structuredClone(before.compiled.scene.nodes),
    instanceSets: [structuredClone(tiles)],
    environment: null,
  });
  const fanout: IAutoMovieSubjectDiff = diffAutoMovieSubjects(before, after);
  TestValidator.equals(
    "one prototype reshape summarizes all 2392 instance uses",
    fanout.reshaped.map(
      (
        change: IAutoMovieSubjectChange,
      ): { id: string; fanout: IAutoMovieSubjectDiffFanout } => ({
        id: change.id,
        fanout: change.fanout,
      }),
    ),
    [
      {
        id: "prototype-part:tile/body",
        fanout: {
          elements: 1,
          instances: 2_392,
          instanceSets: {
            total: 1,
            offset: 0,
            items: ["instance-set:roof-slates"],
            omitted: 0,
          },
          prototypeChanges: 0,
        },
      },
      {
        id: "prototype:tile",
        fanout: {
          elements: 1,
          instances: 2_392,
          instanceSets: {
            total: 1,
            offset: 0,
            items: ["instance-set:roof-slates"],
            omitted: 0,
          },
          prototypeChanges: 0,
        },
      },
    ],
  );
  TestValidator.equals(
    "fan-out does not emit any individual instance change records",
    [
      ...fanout.added,
      ...fanout.removed,
      ...fanout.moved,
      ...fanout.reshaped,
    ].some(
      (change: IAutoMovieSubjectChange): boolean => change.kind === "instance",
    ),
    false,
  );

  const treeA: IAutoMovieModel = subjectInspectionModel({
    id: "tree-a",
    min: { x: -1, y: 0, z: -1 },
    max: { x: 1, y: 2, z: 1 },
  });
  const treeB: IAutoMovieModel = subjectInspectionModel({
    id: "tree-b",
    min: { x: -1, y: 0, z: -1 },
    max: { x: 1, y: 3, z: 1 },
  });
  const explicitBefore: IAutoMovieCompiledInstanceSet = explicitSet("grove", [
    "default",
  ]);
  const explicitAfter: IAutoMovieCompiledInstanceSet = explicitSet("grove", [
    "tall",
  ]);
  const selection: IAutoMovieSubjectDiff = diffAutoMovieSubjects(
    subjectInspectionArtifact({
      models: [treeA, treeB],
      nodes: [],
      instanceSets: [explicitBefore],
      environment: null,
    }),
    subjectInspectionArtifact({
      models: [treeA, treeB],
      nodes: [],
      instanceSets: [explicitAfter],
      environment: null,
    }),
  );
  const setChange: IAutoMovieSubjectChange | undefined =
    selection.reshaped.find(
      (change: IAutoMovieSubjectChange): boolean =>
        change.id === "instance-set:grove",
    );
  TestValidator.equals(
    "one explicit prototype reassignment is one compact changed-selection count",
    setChange?.fanout,
    {
      elements: 0,
      instances: 0,
      instanceSets: { total: 0, offset: 0, items: [], omitted: 0 },
      prototypeChanges: 1,
    },
  );

  const countChange: IAutoMovieSubjectDiff = diffAutoMovieSubjects(
    subjectInspectionArtifact({
      models: [treeA, treeB],
      nodes: [],
      instanceSets: [explicitSet("counted", ["default"])],
      environment: null,
    }),
    subjectInspectionArtifact({
      models: [treeA, treeB],
      nodes: [],
      instanceSets: [explicitSet("counted", ["default", "tall"])],
      environment: null,
    }),
  );
  TestValidator.equals(
    "an added slot contributes one prototype selection change",
    countChange.reshaped.find(
      (change: IAutoMovieSubjectChange): boolean =>
        change.id === "instance-set:counted",
    )?.fanout.prototypeChanges,
    1,
  );

  const irregular: IAutoMovieSubjectDiff = diffAutoMovieSubjects(
    subjectInspectionArtifact({
      models: [treeA, treeB],
      nodes: [],
      instanceSets: [
        explicitSet(
          "irregular",
          ["missing"],
          [prototype("default", "tree-a", 0), prototype("tall", "tree-b", 0)],
        ),
      ],
      environment: null,
    }),
    subjectInspectionArtifact({
      models: [treeA, treeB],
      nodes: [],
      instanceSets: [
        explicitSet(
          "irregular",
          [undefined],
          [prototype("default", "tree-a", 0), prototype("tall", "tree-b", 0)],
        ),
      ],
      environment: null,
    }),
  );
  TestValidator.equals(
    "missing explicit and zero-weight fallback selections compare deterministically",
    irregular.reshaped.find(
      (change: IAutoMovieSubjectChange): boolean =>
        change.id === "instance-set:irregular",
    )?.fanout.prototypeChanges,
    1,
  );

  const noLodBefore: IAutoMovieCompiledInstanceSet =
    subjectInspectionInstanceSet({
      id: "no-lod",
      model: "tree-a",
      count: 1,
      overrides: { lod: [] },
    });
  const noLodAfter: IAutoMovieCompiledInstanceSet = {
    ...structuredClone(noLodBefore),
    anchor: { x: 1, y: 0, z: 0 },
  };
  const noLod: IAutoMovieSubjectDiff = diffAutoMovieSubjects(
    subjectInspectionArtifact({
      models: [treeA],
      nodes: [],
      instanceSets: [noLodBefore],
      environment: null,
    }),
    subjectInspectionArtifact({
      models: [treeA],
      nodes: [],
      instanceSets: [noLodAfter],
      environment: null,
    }),
  );
  TestValidator.equals(
    "a legacy set with no runtime LOD still compares one stable null selection",
    noLod.moved.find(
      (change: IAutoMovieSubjectChange): boolean =>
        change.id === "instance-set:no-lod",
    )?.fanout.prototypeChanges,
    0,
  );
}

const explicitSet: (
  id: string,
  selected: Array<string | undefined>,
  prototypes?: IAutoMovieCompiledInstancePrototype[],
) => IAutoMovieCompiledInstanceSet = (
  id: string,
  selected: Array<string | undefined>,
  prototypes: IAutoMovieCompiledInstancePrototype[] = [
    prototype("default", "tree-a", 1),
    prototype("tall", "tree-b", 1),
  ],
): IAutoMovieCompiledInstanceSet => {
  const base: IAutoMovieCompiledInstanceSet = subjectInspectionInstanceSet({
    id,
    model: "tree-a",
    count: selected.length,
  });
  return {
    ...base,
    count: selected.length,
    prototypes,
    layout: {
      kind: "explicit",
      transforms: selected.map(
        (
          choice: string | undefined,
          slot: number,
        ): {
          prototype?: string | undefined;
          id: string;
          translation: { x: number; y: number; z: number };
          rotation: { x: number; y: number; z: number; w: number };
          scale: { x: number; y: number; z: number };
        } => ({
          id: `tree-${slot}`,
          translation: { x: slot, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
          ...(choice === undefined ? {} : { prototype: choice }),
        }),
      ),
    },
    bounds: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: Math.max(0, selected.length - 1), y: 0, z: 0 },
    },
  };
};

const prototype: (
  id: string,
  model: string,
  weight: number,
) => IAutoMovieCompiledInstancePrototype = (
  id: string,
  model: string,
  weight: number,
): IAutoMovieCompiledInstancePrototype => ({
  id,
  modelRecipe: model,
  weight,
  lod: [
    {
      tier: "near" as const,
      maxDistance: null,
      recipe: model,
      recipeDigest: `sha256:${"6".repeat(64)}` as const,
      model,
    },
  ],
  projectionRadius: 1,
});
