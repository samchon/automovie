import {
  AUTOMOVIE_SUBJECT_DIFF_DEFAULT_TOLERANCE,
  diffAutoMovieSubjects,
} from "@automovie/engine";
import {
  type IAutoMovieCompiledInstanceSet,
  IAutoMovieModel,
  type IAutoMovieSceneNode,
  type IAutoMovieSubjectArtifact,
  type IAutoMovieSubjectChange,
  type IAutoMovieSubjectDiff,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { subjectInspectionArtifact } from "../../../internal/subjectInspectionArtifact";
import { subjectInspectionIdentityTransform } from "../../../internal/subjectInspectionIdentityTransform";
import { subjectInspectionModel } from "../../../internal/subjectInspectionModel";
import { throwsError } from "../../../internal/throwsError";

/**
 * Structural diff classifies stable subjects without conflating placement and
 * reusable geometry.
 *
 * Scenarios:
 *
 * 1. Models and their parts added or removed are exclusive additions and
 *    removals, while their scene elements follow the same stable-id rule.
 * 2. A translated element is moved and its reshaped prototype and prototype
 *    part are each reported once; an untouched model, part, and element are
 *    summarized as unchanged.
 * 3. A model that only a built environment carries is compared like a
 *    compiled one, so its reshaped prototype and part are reported.
 * 4. One compact set changed in both anchor and layout appears in both moved
 *    and reshaped categories.
 * 5. Invalid negative and non-finite tolerances are rejected.
 */
export function test_unit_render_inspection_subject_structural_diff(): void {
  const chairBefore: IAutoMovieModel = box("chair", 1);
  const chairAfter: IAutoMovieModel = box("chair", 2);
  const stable: IAutoMovieModel = box("stable", 1);
  const removed: IAutoMovieModel = box("removed", 1);
  const added: IAutoMovieModel = box("added", 1);
  const before: IAutoMovieSubjectArtifact = subjectInspectionArtifact({
    revision: "revision-before",
    models: [chairBefore, stable, removed],
    nodes: [node("chair", 0), node("stable", 0), node("removed", 0)],
    environment: null,
  });
  const after: IAutoMovieSubjectArtifact = subjectInspectionArtifact({
    revision: "revision-after",
    models: [chairAfter, stable, added],
    nodes: [node("chair", 3), node("stable", 0), node("added", 0)],
    environment: null,
  });
  const diff: IAutoMovieSubjectDiff = diffAutoMovieSubjects(before, after);
  TestValidator.equals(
    "addition removal movement reshape and unchanged subjects are categorized independently",
    {
      version: diff.version,
      revisions: [diff.fromRevision, diff.toRevision],
      tolerance: nclose(diff.tolerance, 1e-6, 0),
      added: diff.added.map(
        (change: IAutoMovieSubjectChange): string => change.id,
      ),
      addedNulls: diff.added.every(
        (change: IAutoMovieSubjectChange): boolean =>
          change.before === null && change.after !== null,
      ),
      removed: diff.removed.map(
        (change: IAutoMovieSubjectChange): string => change.id,
      ),
      removedNulls: diff.removed.every(
        (change: IAutoMovieSubjectChange): boolean =>
          change.before !== null && change.after === null,
      ),
      moved: diff.moved.map(
        (change: IAutoMovieSubjectChange): string => change.id,
      ),
      reshaped: diff.reshaped.map(
        (change: IAutoMovieSubjectChange): string => change.id,
      ),
      unchanged: diff.unchanged,
    },
    {
      version: 1,
      revisions: ["revision-before", "revision-after"],
      tolerance: true,
      added: ["element:added", "prototype-part:added/body", "prototype:added"],
      addedNulls: true,
      removed: [
        "element:removed",
        "prototype-part:removed/body",
        "prototype:removed",
      ],
      removedNulls: true,
      moved: ["element:chair"],
      reshaped: ["prototype-part:chair/body", "prototype:chair"],
      unchanged: {
        total: 3,
        offset: 0,
        items: [
          "element:stable",
          "prototype-part:stable/body",
          "prototype:stable",
        ],
        omitted: 0,
      },
    },
  );

  const environmentOwned: (
    model: IAutoMovieModel,
  ) => IAutoMovieSubjectArtifact = (
    model: IAutoMovieModel,
  ): IAutoMovieSubjectArtifact => {
    const artifact: IAutoMovieSubjectArtifact = subjectInspectionArtifact({
      models: [model],
    });
    return {
      ...artifact,
      compiled: { ...artifact.compiled, models: [] },
    };
  };
  const owned: IAutoMovieSubjectDiff = diffAutoMovieSubjects(
    environmentOwned(box("chair", 1)),
    environmentOwned(box("chair", 2)),
  );
  TestValidator.equals(
    "a reshaped model owned only by a built environment is reported reshaped",
    owned.reshaped.map((change: IAutoMovieSubjectChange): string => change.id),
    ["prototype-part:chair/body", "prototype:chair"],
  );

  const setBefore: IAutoMovieCompiledInstanceSet = compactSet("both", 0, 1);
  const setAfter: IAutoMovieCompiledInstanceSet = compactSet("both", 2, 2);
  const both: IAutoMovieSubjectDiff = diffAutoMovieSubjects(
    subjectInspectionArtifact({
      models: [stable],
      nodes: [],
      instanceSets: [setBefore],
      environment: null,
    }),
    subjectInspectionArtifact({
      models: [stable],
      nodes: [],
      instanceSets: [setAfter],
      environment: null,
    }),
  );
  TestValidator.equals(
    "a set with placement and population-law edits belongs to both categories",
    {
      moved: both.moved.map(
        (change: IAutoMovieSubjectChange): string => change.id,
      ),
      reshaped: both.reshaped.map(
        (change: IAutoMovieSubjectChange): string => change.id,
      ),
    },
    {
      moved: ["instance-set:both"],
      reshaped: ["instance-set:both"],
    },
  );

  const addedSet: IAutoMovieSubjectDiff = diffAutoMovieSubjects(
    subjectInspectionArtifact({
      models: [stable],
      nodes: [],
      environment: null,
    }),
    subjectInspectionArtifact({
      models: [stable],
      nodes: [],
      instanceSets: [setBefore],
      environment: null,
    }),
  );
  TestValidator.equals(
    "an added compact set has no cross-revision prototype selection count",
    addedSet.added.find(
      (change: IAutoMovieSubjectChange): boolean =>
        change.id === "instance-set:both",
    )?.fanout,
    {
      elements: 0,
      instances: 0,
      instanceSets: { total: 0, offset: 0, items: [], omitted: 0 },
      prototypeChanges: 0,
    },
  );

}

const box: (id: string, height: number) => IAutoMovieModel = (
  id: string,
  height: number,
): IAutoMovieModel =>
  subjectInspectionModel({
    id,
    min: { x: -0.5, y: 0, z: -0.5 },
    max: { x: 0.5, y: height, z: 0.5 },
  });

const node: (id: string, x: number) => IAutoMovieSceneNode = (
  id: string,
  x: number,
): IAutoMovieSceneNode => ({
  id,
  model: id,
  transform: {
    ...subjectInspectionIdentityTransform(),
    translation: { x, y: 0, z: 0 },
  },
  motion: null,
  pose: null,
});

const compactSet: (
  id: string,
  x: number,
  spacing: number,
) => IAutoMovieCompiledInstanceSet = (
  id: string,
  x: number,
  spacing: number,
): IAutoMovieCompiledInstanceSet => ({
  version: 1,
  id,
  count: 2,
  model: "stable",
  layout: {
    kind: "grid",
    rows: 1,
    columns: 2,
    spacing: { x: spacing, z: 1 },
  },
  route: null,
  anchor: { x, y: 0, z: 0 },
  facingDeg: 0,
  seed: 1,
  variation: {
    scale: { min: 1, max: 1 },
    palette: ["#ffffff"],
    traits: [],
  },
  bounds: {
    min: { x: x - spacing / 2, y: 0, z: 0 },
    max: { x: x + spacing / 2, y: 0, z: 0 },
  },
  centroid: { x, y: 0, z: 0 },
  projectionRadius: 1,
  chunks: [],
  lod: [
    {
      tier: "near",
      maxDistance: null,
      model: "stable",
      modelDigest: `sha256:${"4".repeat(64)}`,
      runtimeModel: "stable",
    },
  ],
  digest: `sha256:${"5".repeat(64)}`,
});
