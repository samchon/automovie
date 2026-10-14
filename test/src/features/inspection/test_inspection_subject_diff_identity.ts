import { diffAutoMovieSubjects } from "@automovie/engine";
import {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieModel,
  IAutoMovieSubjectArtifact,
  IAutoMovieSubjectDiff,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  subjectInspectionArtifact,
  subjectInspectionInstanceSet,
  subjectInspectionModel,
} from "../internal/subjectInspectionFixtures";

/**
 * Distinct prototype/model pairs remain distinct when their ids contain colons.
 *
 * Scenarios:
 * 1. Moving a colon from the prototype id to the model id is one slot change.
 * 2. An identical pair in a different revision is zero slot changes.
 * 3. A missing explicit id cannot alias a present prototype/model spelling.
 * 4. Duplicate part addresses keep first-match shape selection within each request.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls diffAutoMovieSubjects on explicit sets and duplicate model parts, checking aggregate prototype changes and addressed part shape classification. A delimiter-joined key fails the distinct-tuple case; a last-match part index fails the later-duplicate control.
 * @evidence contracts/testing.md#independent-expectations Authored tuples (a:b,c) and (a,b:c) select different prototype/model pairs; missing ghost:null differs from selected missing:ghost drawing null. Duplicate body parts keep the first part as the shape, so changing only the later duplicate has no part change, while changing the first part does.
 * @evidence contracts/testing.md#distinguishing-cases Covers delimiter collisions, equality across revision metadata, missing-versus-present selection status and duplicate-part first-match identity. A second request after changing the first part rejects a stale cross-request index; weighted frequencies and added counts remain with their existing owners.
 * @evidence contracts/testing.md#execution-ownership This synchronous unit is discovered through test_inspection_subject_diff_identity, calls the production diff directly and uses shared compiled-record fixtures without building, installing or launching a consumer.
 */
export function test_inspection_subject_diff_identity(): void {
  const before: IAutoMovieSubjectArtifact = artifact("before", "a:b", "c");
  const after: IAutoMovieSubjectArtifact = artifact("after", "a", "b:c");
  TestValidator.equals(
    "different prototype/model tuples count one change",
    changes(diffAutoMovieSubjects(before, after)),
    1,
  );
  const same: IAutoMovieSubjectArtifact = artifact("same", "a:b", "c");
  same.compiled.instanceSets[0]!.seed += 1;
  TestValidator.equals(
    "identical tuple survives unrelated seed change",
    changes(diffAutoMovieSubjects(before, same)),
    0,
  );
  const missing: IAutoMovieSubjectArtifact = artifact(
    "missing",
    "other",
    "unused",
  );
  const missingSet: IAutoMovieCompiledInstanceSet =
    missing.compiled.instanceSets[0]!;
  if (missingSet.layout.kind === "explicit")
    missingSet.layout.transforms[0]!.prototype = "ghost:null";
  const present: IAutoMovieSubjectArtifact = artifact(
    "present",
    "missing:ghost",
    "null",
  );
  TestValidator.equals(
    "missing and selected identities cannot collide",
    changes(diffAutoMovieSubjects(missing, present)),
    1,
  );
  const previousModel: IAutoMovieModel = subjectInspectionModel({
    id: "parts:one",
    min: { x: 0, y: 0, z: 0 },
    max: { x: 1, y: 1, z: 1 },
  });
  previousModel.parts.push({
    ...previousModel.parts[0]!,
    material: "later-before",
  });
  const nextModel: IAutoMovieModel = {
    ...previousModel,
    parts: [
      previousModel.parts[0]!,
      { ...previousModel.parts[1]!, material: "later-after" },
    ],
  };
  const previousParts: IAutoMovieSubjectArtifact = subjectInspectionArtifact({
    models: [previousModel],
    nodes: [],
    environment: null,
  });
  const nextParts: IAutoMovieSubjectArtifact = subjectInspectionArtifact({
    models: [nextModel],
    nodes: [],
    environment: null,
  });
  TestValidator.equals(
    "later duplicate cannot replace first part shape",
    hasPartChange(diffAutoMovieSubjects(previousParts, nextParts)),
    false,
  );
  nextModel.parts[0] = { ...nextModel.parts[0]!, material: "first-after" };
  TestValidator.equals(
    "first duplicate supplies the part shape in a fresh request",
    hasPartChange(diffAutoMovieSubjects(previousParts, nextParts)),
    true,
  );
}

/** A single explicitly selected compiled member, without geometry expansion. */
function artifact(
  revision: string,
  prototype: string,
  model: string,
): IAutoMovieSubjectArtifact {
  const base: IAutoMovieCompiledInstanceSet = subjectInspectionInstanceSet({
    id: "one",
    model,
    count: 1,
  });
  const set: IAutoMovieCompiledInstanceSet = {
    ...base,
    prototypes: [
      {
        id: prototype,
        modelRecipe: model,
        weight: 1,
        lod: base.lod,
        projectionRadius: 1,
      },
    ],
    layout: {
      kind: "explicit",
      transforms: [
        {
          id: "member",
          prototype,
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
      ],
    },
  };
  return subjectInspectionArtifact({
    revision,
    models: [],
    nodes: [],
    instanceSets: [set],
    environment: null,
  });
}

/** Each fixture addresses one common set whose shape changes in these cases. */
function changes(diff: IAutoMovieSubjectDiff): number | undefined {
  return diff.reshaped.find(
    (change: IAutoMovieSubjectDiff["reshaped"][number]): boolean =>
      change.id === "instance-set:one",
  )?.fanout.prototypeChanges;
}

/** Shape classification for the authored duplicate body address. */
function hasPartChange(diff: IAutoMovieSubjectDiff): boolean {
  return diff.reshaped.some(
    (change: IAutoMovieSubjectDiff["reshaped"][number]): boolean =>
      change.id === "prototype-part:parts:one/body",
  );
}
