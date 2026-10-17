import type { Family } from "../schema/Family.ts";

/**
 * Declares the registered coordinate meaning shared by one hand section family.
 *
 * @evidence contracts/common.md#principled-implementation Distinguishes rig marker origins, physical station distances and cardinal observations from clinical landmarks.
 * @evidence contracts/common.md#clear-and-simple-design One declaration serves every station of the family.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not assign a universal radial sign to mirrored hands.
 * @evidence contracts/common.md#meaningful-documentation Defines pose, station endpoints and the source of dorsal orientation.
 * @evidence contracts/performance.md#efficient-algorithms Constructs one fixed-size metadata record in constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller appends this once per family rather than once per station.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the returned metadata; it acquires no handles or cache.
 */
export function handFamily(id: string, axis: string): Family {
  return {
    id,
    kind: "perpendicular",
    axis,
    fraction0: "proximal rig joint",
    fraction1: "distal rig joint or declared geometric distal support",
    reference:
      "dorsal MCP rig marker, projected on each plane; rig registration is not a clinical measurement",
    phaseLabels: {
      "0": "dorsal",
      "180": "palmar",
      "90": "side identified by featurePins",
      "270": "opposite side identified by featurePins",
    },
  };
}
