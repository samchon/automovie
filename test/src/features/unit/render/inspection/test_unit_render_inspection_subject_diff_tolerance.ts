import { diffAutoMovieSubjects } from "@automovie/engine";
import {
  type IAutoMovieModel,
  type IAutoMovieSubjectArtifact,
  type IAutoMovieSubjectChange,
  type IAutoMovieSubjectDiff,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { subjectInspectionArtifact } from "../../../internal/subjectInspectionArtifact";
import { subjectInspectionIdentityTransform } from "../../../internal/subjectInspectionIdentityTransform";
import { subjectInspectionModel } from "../../../internal/subjectInspectionModel";

/**
 * Structural comparison applies one visible inclusive tolerance to geometry,
 * placement, and quaternion orientation.
 *
 * Scenarios:
 *
 * 1. Translation at `1e-6` and a mesh coordinate authored as `1 + 1e-6` remain
 *    unchanged; binary64 subtraction makes the latter difference slightly below
 *    the nominal boundary.
 * 2. The same differences just above the boundary become moved and reshaped.
 * 3. Opposite signs of the same unit quaternion are unchanged.
 * 4. Degenerate zero quaternions fall back to component comparison without
 *    producing NaN.
 */
export function test_unit_render_inspection_subject_diff_tolerance(): void {
  const tolerance: number = 1e-6;
  const baseline: IAutoMovieSubjectArtifact = artifact(0, 1, {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  });
  const boundary: IAutoMovieSubjectDiff = diffAutoMovieSubjects(
    baseline,
    artifact(tolerance, 1 + tolerance, { x: 0, y: 0, z: 0, w: -1 }),
    tolerance,
  );
  TestValidator.equals(
    "differences on the inclusive boundary and quaternion sign are unchanged",
    {
      moved: boundary.moved.length,
      reshaped: boundary.reshaped.length,
      unchanged: boundary.unchanged,
    },
    {
      moved: 0,
      reshaped: 0,
      unchanged: {
        total: 3,
        offset: 0,
        items: [
          "element:subject",
          "prototype-part:subject/body",
          "prototype:subject",
        ],
        omitted: 0,
      },
    },
  );

  const above: IAutoMovieSubjectDiff = diffAutoMovieSubjects(
    baseline,
    artifact(tolerance * 1.01, 1 + tolerance * 1.01, {
      x: 0,
      y: 0,
      z: 0,
      w: 1,
    }),
    tolerance,
  );
  TestValidator.equals(
    "differences above the boundary are classified",
    {
      moved: above.moved.map(
        (change: IAutoMovieSubjectChange): string => change.id,
      ),
      reshaped: above.reshaped.map(
        (change: IAutoMovieSubjectChange): string => change.id,
      ),
    },
    {
      moved: ["element:subject"],
      reshaped: ["prototype-part:subject/body", "prototype:subject"],
    },
  );

  const zeroBoundary: IAutoMovieSubjectDiff = diffAutoMovieSubjects(
    artifact(0, 1, { x: 0, y: 0, z: 0, w: 0 }),
    artifact(0, 1, { x: 0, y: 0, z: 0, w: tolerance }),
    tolerance,
  );
  const zeroAbove: IAutoMovieSubjectDiff = diffAutoMovieSubjects(
    artifact(0, 1, { x: 0, y: 0, z: 0, w: 0 }),
    artifact(0, 1, { x: 0, y: 0, z: 0, w: tolerance * 1.01 }),
    tolerance,
  );
  TestValidator.equals(
    "zero quaternion fallback remains finite and inclusive",
    {
      boundaryMoved: zeroBoundary.moved.length,
      aboveMoved: zeroAbove.moved.map(
        (change: IAutoMovieSubjectChange): string => change.id,
      ),
    },
    { boundaryMoved: 0, aboveMoved: ["element:subject"] },
  );

  const addedPartArtifact: IAutoMovieSubjectArtifact = artifact(0, 1, {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  });
  addedPartArtifact.compiled.models[0]!.parts.push({
    ...structuredClone(addedPartArtifact.compiled.models[0]!.parts[0]!),
    id: "second",
  });
  const partCount: IAutoMovieSubjectDiff = diffAutoMovieSubjects(
    baseline,
    addedPartArtifact,
    tolerance,
  );
  TestValidator.equals(
    "a changed part-array length reshapes the reusable prototype",
    partCount.reshaped.map(
      (change: IAutoMovieSubjectChange): string => change.id,
    ),
    ["element:subject", "prototype:subject"],
  );
}

const artifact: (
  translationX: number,
  meshMaxX: number,
  rotation: { x: number; y: number; z: number; w: number },
) => IAutoMovieSubjectArtifact = (
  translationX: number,
  meshMaxX: number,
  rotation: { x: number; y: number; z: number; w: number },
): IAutoMovieSubjectArtifact => {
  const model: IAutoMovieModel = subjectInspectionModel({
    id: "subject",
    min: { x: 0, y: 0, z: 0 },
    max: { x: meshMaxX, y: 1, z: 1 },
  });
  return subjectInspectionArtifact({
    models: [model],
    nodes: [
      {
        id: "subject",
        model: "subject",
        transform: {
          ...subjectInspectionIdentityTransform(),
          translation: { x: translationX, y: 0, z: 0 },
          rotation,
        },
        motion: null,
        pose: null,
      },
    ],
    environment: null,
  });
};
