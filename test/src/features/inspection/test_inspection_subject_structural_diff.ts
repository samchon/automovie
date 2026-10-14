import { AUTOMOVIE_SUBJECT_DIFF_DEFAULT_TOLERANCE } from "../../../../packages/engine/src/constants/AUTOMOVIE_SUBJECT_DIFF_DEFAULT_TOLERANCE";
import { diffAutoMovieSubjects } from "../../../../packages/engine/src/diffAutoMovieSubjects";
import { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { throwsError } from "../internal/throwsError";
import { nclose } from "../internal/nclose";
import { subjectInspectionArtifact } from "../internal/subjectInspectionArtifact";
import { subjectInspectionIdentityTransform } from "../internal/subjectInspectionIdentityTransform";
import { subjectInspectionModel } from "../internal/subjectInspectionModel";
import { type IAutoMovieSubjectArtifact, type IAutoMovieSubjectDiff, type IAutoMovieSubjectChange, type IAutoMovieCompiledInstanceSet, type IAutoMovieSceneNode } from "../../../../packages/interface/src/index";
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
/**
 * @evidence contracts/testing.md#behavioral-verification Diffs authored revisions and checks disjoint add/remove, independent move/reshape, stable summaries and tolerance refusal; conflating reusable geometry with placement or omitting environment-only models fails.
 * @evidence contracts/testing.md#independent-expectations Explicit before/after ids, translated chair, changed height and unchanged model fix the expected categories and revision labels; changing both compact anchor and spacing independently requires both categories. The literal default tolerance is checked through a scalar predicate, not diff-generated expected output.
 * @evidence contracts/testing.md#distinguishing-cases Keeps additions/removals, simultaneous element move and prototype reshape, unchanged subjects, environment-only ownership, a doubly changed set, newly added-set fan-out and negative/infinite tolerance; exact inclusive boundaries are owned by diff_tolerance.
 * @evidence contracts/testing.md#execution-ownership This discoverable exported CPU entry directly imports the diff owner and local code fixtures, with no renderer, browser or native artifact; structural classifications do not certify visible material or geometry quality.
 */
export function test_inspection_subject_structural_diff(): void {
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
      added: diff.added.map((change: IAutoMovieSubjectChange): string  => change.id),
      addedNulls: diff.added.every(
        (change: IAutoMovieSubjectChange): boolean  => change.before === null && change.after !== null,
      ),
      removed: diff.removed.map((change: IAutoMovieSubjectChange): string  => change.id),
      removedNulls: diff.removed.every(
        (change: IAutoMovieSubjectChange): boolean  => change.before !== null && change.after === null,
      ),
      moved: diff.moved.map((change: IAutoMovieSubjectChange): string  => change.id),
      reshaped: diff.reshaped.map((change: IAutoMovieSubjectChange): string  => change.id),
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

  const environmentOwned: (model: IAutoMovieModel) => IAutoMovieSubjectArtifact = (model: IAutoMovieModel): IAutoMovieSubjectArtifact  => {
    const artifact: IAutoMovieSubjectArtifact = subjectInspectionArtifact({ models: [model] });
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
    owned.reshaped.map((change: IAutoMovieSubjectChange): string  => change.id),
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
      moved: both.moved.map((change: IAutoMovieSubjectChange): string  => change.id),
      reshaped: both.reshaped.map((change: IAutoMovieSubjectChange): string  => change.id),
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
    addedSet.added.find((change: IAutoMovieSubjectChange): boolean  => change.id === "instance-set:both")?.fanout,
    {
      elements: 0,
      instances: 0,
      instanceSets: { total: 0, offset: 0, items: [], omitted: 0 },
      prototypeChanges: 0,
    },
  );

  TestValidator.equals(
    "invalid tolerances are refused",
    {
      negative: throwsError(
        (): IAutoMovieSubjectDiff  => diffAutoMovieSubjects(before, after, -1),
        "finite and non-negative",
      ),
      infinite: throwsError(
        (): IAutoMovieSubjectDiff  => diffAutoMovieSubjects(before, after, Number.POSITIVE_INFINITY),
        "finite and non-negative",
      ),
      default: nclose(AUTOMOVIE_SUBJECT_DIFF_DEFAULT_TOLERANCE, 1e-6, 0),
    },
    { negative: true, infinite: true, default: true },
  );
}

const box: (id: string, height: number) => IAutoMovieModel = (id: string, height: number): IAutoMovieModel =>
  subjectInspectionModel({
    id,
    min: { x: -0.5, y: 0, z: -0.5 },
    max: { x: 0.5, y: height, z: 0.5 },
  });

const node: (id: string, x: number) => IAutoMovieSceneNode = (id: string, x: number): IAutoMovieSceneNode  => ({
  id,
  model: id,
  transform: {
    ...subjectInspectionIdentityTransform(),
    translation: { x, y: 0, z: 0 },
  },
  motion: null,
  pose: null,
});

const compactSet: (id: string, x: number, spacing: number) => IAutoMovieCompiledInstanceSet = (id: string, x: number, spacing: number): IAutoMovieCompiledInstanceSet  =>
  ({
    version: 1,
    id,
    count: 2,
    modelRecipe: "stable",
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
        recipe: "stable",
        recipeDigest: `sha256:${"4".repeat(64)}`,
        model: "stable",
      },
    ],
    digest: `sha256:${"5".repeat(64)}`,
  });
