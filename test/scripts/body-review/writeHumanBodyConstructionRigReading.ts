import fs from "node:fs";
import path from "node:path";

import type { IHumanBodyConstructionRigReading } from "./IHumanBodyConstructionRigReading";
import type { IWriteHumanBodyConstructionRigReadingProps } from "./IWriteHumanBodyConstructionRigReadingProps";

/**
 * Retain the rig state returned with the archived static construction.
 * Maps become arrays of their existing keyed placement pairs. Every numeric
 * value is read from that build; no pose, matrix, geometry or acceptance is
 * calculated here. A person supplies its own body result. Missing anatomical
 * state stays absent, and synchronous file errors propagate to the normal
 * producer after its existing model archive has been written.
 *
 * @evidence contracts/common.md#principled-implementation Serializes the actual construction result instead of re-deriving placement from baked vertices.
 * @evidence contracts/common.md#clear-and-simple-design One archive writer owns map serialization for body-only and whole-person construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Copies returned placement values without synthesizing matrices or changing model policy.
 * @evidence contracts/common.md#meaningful-documentation States ownership, missing-state handling, calculation limits and file failure effects.
 * @evidence contracts/modeling.md#spatial-conventions Keeps existing metre positions and unit-quaternion rotations in their returned body frame.
 */
export function writeHumanBodyConstructionRigReading(
  props: IWriteHumanBodyConstructionRigReadingProps,
): void {
  const body = props.person?.body ?? props.body;
  const source = body.anatomicalRig;
  const reading: IHumanBodyConstructionRigReading = {
    modelId: (props.person?.model ?? body.model).id,
    generation: props.generation,
    sourceAssemblySha256: props.sourceAssemblySha256,
    bodyDocument: body.evaluatedDocument,
    bodySkeleton: body.skeleton,
    bodyBones: body.bones,
    bodyLandmarks: body.landmarks,
    personBones: props.person?.bones,
    ...(source === undefined
      ? {}
      : {
          anatomicalBones: Array.from(source.bones, ([bone, transform]) => ({
            bone,
            ...transform,
          })),
          anatomicalProjections: Array.from(
            source.projections,
            ([bone, transform]) => ({ bone, ...transform }),
          ),
        }),
    groundPlaneHeightMetres: body.groundPlaneHeightMetres,
  };
  fs.writeFileSync(
    path.join(props.directory, "rig-reading.json"),
    JSON.stringify(reading, null, 2),
  );
}
