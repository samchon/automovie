import type { IGeometryFormationTestContract } from "./IGeometryFormationTestContract";

/** Declare whether the formation participates beside its named banner actor. */
export const geometryFormationTestContract = (
  formation: boolean,
): IGeometryFormationTestContract => ({
  participants: formation
    ? [
        { kind: "formation", id: "unit" },
        { kind: "actor", id: "banner" },
      ]
    : [{ kind: "actor", id: "banner" }],
  camera: {
    intent: "frame the unit",
    requiredSubjects: [],
    maxOcclusionRatio: 0.2,
  },
});
