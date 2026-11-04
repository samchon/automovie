import * as THREE from "three";

import type { InspectionPerson } from "../InspectionPerson";
import type { MotionAction } from "../motion/core/MotionAction";

/**
 * Observe declared pose-bound markers without giving them Cartesian solver authority.
 * @evidence contracts/common.md#implementation-and-ownership Module-owned clinical references are compared with the same displayed bones. They never enter target selection, Grounding, support admission or the contact surface registry, which already contains the complete actual participating geometry.
 * @evidence contracts/common.md#authoring-interface Raw authoring remains in requested samples; stopped copies contain actual measured markers. World values use the displayed root for clinical references, while independent external tasks retain their separately frozen world frame.
 */
export namespace LabClinicalWitnesses {
  /**
   * Compare clinical authoring references against final native bone matrices.
   * @evidence contracts/common.md#implementation-and-ownership Reads actual bone-local marker points through the original scene graph and reports their residual against the declared pose-relative reference. It performs no fit or collision query.
   * @evidence contracts/common.md#authoring-interface Receives an owned module sample, returns detached tuples and labels every marker as a diagnostic. Missing actual bones refuse instead of using another actor or an approximate landmark.
   */
  export function inspect(
    person: InspectionPerson,
    sample: MotionAction.Sample | undefined,
  ): object[] {
    if (!sample) return [];
    const direct: unknown = Reflect.get(sample, "clinicalWitnesses");
    const diagnostics: unknown = Reflect.get(sample, "diagnostics");
    const nested: unknown =
      diagnostics && typeof diagnostics === "object"
        ? Reflect.get(diagnostics, "clinical")
        : undefined;
    return [
      ...(Array.isArray(direct) ? direct : []),
      ...(Array.isArray(nested) ? nested : []),
    ].map((marker: MotionAction.Effector): object => {
      const bone: THREE.Group | undefined = person.drawing.bones.get(
        marker.bone,
      );
      if (!bone)
        throw new Error(`Missing actual clinical witness ${marker.bone}`);
      const actual: THREE.Vector3 = bone.localToWorld(
        new THREE.Vector3(...(marker.localPoint ?? [0, 0, 0])),
      );
      const expected: THREE.Vector3 = person.object.localToWorld(
        new THREE.Vector3(...marker.target),
      );
      return {
        ...structuredClone(marker),
        authority: "pose-bound-diagnostic",
        expectedWorld: expected.toArray(),
        actualWorld: actual.toArray(),
        errorMetres: actual.distanceTo(expected),
      };
    });
  }

  /**
   * Preserve actual clinical markers in a stopped state without modifying raw authoring.
   * @evidence contracts/common.md#implementation-and-ownership Clones the sample and transforms each existing clinical marker's same bone-local point through the actual bone and actor matrices. It does not add markers, change their identity or alter external effectors/support tasks.
   * @evidence contracts/common.md#authoring-interface The result belongs to the caller and the requested sample is unchanged. This snapshot does not admit an unsupported body; the case checks actual support before publishing a contact frame.
   */
  export function capture(
    person: InspectionPerson,
    sample: MotionAction.Sample,
  ): MotionAction.Sample {
    const result: MotionAction.Sample = structuredClone(sample);
    const markers: unknown = Reflect.get(sample, "clinicalWitnesses");
    if (Array.isArray(markers))
      Reflect.set(
        result,
        "clinicalWitnesses",
        markers.map((marker: MotionAction.Effector): MotionAction.Effector => {
          const bone: THREE.Group | undefined = person.drawing.bones.get(
            marker.bone,
          );
          if (!bone)
            throw new Error(`Missing stopped clinical witness ${marker.bone}`);
          return {
            ...structuredClone(marker),
            target: person.object
              .worldToLocal(
                bone.localToWorld(
                  new THREE.Vector3(...(marker.localPoint ?? [0, 0, 0])),
                ),
              )
              .toArray(),
          };
        }),
      );
    return result;
  }
}
