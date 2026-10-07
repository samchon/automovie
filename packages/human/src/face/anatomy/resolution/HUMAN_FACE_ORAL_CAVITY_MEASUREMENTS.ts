import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";

/**
 * The oral cavity measurement of the face resolver: the residual space of
 * the oral cavity proper around the tongue, the
 * `IAutoMovieHumanFaceOralCavityParameters` field.
 *
 * The cited CBCT protocol bounds the space by palate, floor of mouth, teeth
 * and tongue; the basis registers no palate or floor of mouth, so the
 * reading is a named gap.
 *
 * @author Samchon
 */
export const HUMAN_FACE_ORAL_CAVITY_MEASUREMENTS: readonly IHumanFaceMeasurement[] =
  [
    {
      id: "oralCavity.properSpaceVolume",
      unit: "cubic-centimetres",
      channels: [],
      read: () => ({
        reason:
          "missing registration: the palate, floor of mouth and lingual dental boundary of the oral cavity proper",
      }),
    },
  ];
