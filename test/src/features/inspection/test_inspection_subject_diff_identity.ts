import {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieSubjectArtifact,
  IAutoMovieSubjectDiff,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { diffAutoMovieSubjects } from "../../../../packages/engine/src/diffAutoMovieSubjects";
import { subjectInspectionArtifact, subjectInspectionInstanceSet } from "../internal/subjectInspectionFixtures";

/**
 * Distinct prototype/model pairs remain distinct when their ids contain colons.
 *
 * Scenarios:
 * 1. Moving a colon from the prototype id to the model id is one slot change.
 * 2. An identical pair in a different revision is zero slot changes.
 * 3. A missing explicit id cannot alias a present prototype/model spelling.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls diffAutoMovieSubjects on one-slot explicit sets and asserts the aggregate prototypeChanges count; a delimiter-joined selection key merges the distinct pairs in scenario 1 and fails its count of one.
 * @evidence contracts/testing.md#independent-expectations The authored pairs (a:b,c) and (a,b:c) have different prototype ids and different model ids, so one addressed slot changes; two copies of (a:b,c) do not. Missing id ghost:null differs from a present prototype missing:ghost drawing the model named null, despite their formerly identical joined spelling.
 * @evidence contracts/testing.md#distinguishing-cases Covers delimiter collisions, equality across revision metadata, and missing-versus-present selection status. Weighted selection frequencies and added member counts remain owned by the existing prototype selection and fanout tests.
 * @evidence contracts/testing.md#execution-ownership This synchronous unit is discovered through test_inspection_subject_diff_identity, calls the production diff directly and uses shared compiled-record fixtures without building, installing or launching a consumer.
 */
export function test_inspection_subject_diff_identity(): void {
  const before: IAutoMovieSubjectArtifact = artifact("before", "a:b", "c");
  const after: IAutoMovieSubjectArtifact = artifact("after", "a", "b:c");
  TestValidator.equals("different prototype/model tuples count one change", changes(diffAutoMovieSubjects(before, after)), 1);
  const same: IAutoMovieSubjectArtifact = artifact("same", "a:b", "c");
  same.compiled.instanceSets[0]!.seed += 1;
  TestValidator.equals("identical tuple survives unrelated seed change", changes(diffAutoMovieSubjects(before, same)), 0);
  const missing: IAutoMovieSubjectArtifact = artifact("missing", "other", "unused");
  const missingSet: IAutoMovieCompiledInstanceSet = missing.compiled.instanceSets[0]!;
  if (missingSet.layout.kind === "explicit") missingSet.layout.transforms[0]!.prototype = "ghost:null";
  const present: IAutoMovieSubjectArtifact = artifact("present", "missing:ghost", "null");
  TestValidator.equals("missing and selected identities cannot collide", changes(diffAutoMovieSubjects(missing, present)), 1);
}

/** A single explicitly selected compiled member, without geometry expansion. */
function artifact(revision: string, prototype: string, model: string): IAutoMovieSubjectArtifact {
  const base: IAutoMovieCompiledInstanceSet = subjectInspectionInstanceSet({ id: "one", model, count: 1 });
  const set: IAutoMovieCompiledInstanceSet = {
    ...base,
    prototypes: [{ id: prototype, modelRecipe: model, weight: 1, lod: base.lod, projectionRadius: 1 }],
    layout: { kind: "explicit", transforms: [{
      id: "member", prototype,
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 },
    }] },
  };
  return subjectInspectionArtifact({ revision, models: [], nodes: [], instanceSets: [set], environment: null });
}

/** Each fixture addresses one common set whose shape changes in these cases. */
function changes(diff: IAutoMovieSubjectDiff): number | undefined {
  return diff.reshaped.find((change: IAutoMovieSubjectDiff["reshaped"][number]): boolean => change.id === "instance-set:one")?.fanout.prototypeChanges;
}
