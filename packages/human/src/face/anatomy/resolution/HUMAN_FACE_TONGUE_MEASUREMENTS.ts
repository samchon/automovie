import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { readHumanFaceSurfaceVolume } from "./readHumanFaceSurfaceVolume";

/**
 * The tongue measurements of the face resolver, one per
 * `IAutoMovieHumanFaceTongueParameters` field.
 *
 * Volume is the enclosed volume of the closed tongue surface on the final
 * shape; its root extent is the asset's, not an MRI-segmented boundary, so
 * the reading compares with an MRI volume only as far as the asset's root
 * reaches. The tip-to-vallecula length and the posterior-base section need
 * landmarks the tongue surface does not register and read as named gaps.
 *
 * @author Samchon
 */
export const HUMAN_FACE_TONGUE_MEASUREMENTS: readonly IHumanFaceMeasurement[] = [
  {
    id: "tongue.volume",
    unit: "cubic-centimetres",
    channels: [],
    read: (context) =>
      context.basis.contact === undefined
        ? { reason: "missing registration: the tongue passage surface" }
        : readHumanFaceSurfaceVolume(context, context.basis.contact.passage.surface),
  },
  {
    id: "tongue.tipToValleculaLength",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "missing landmark: vallecula on the tongue surface" }),
  },
  {
    id: "tongue.posteriorBaseCoronal.width",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "missing landmark: the start of the posterior tongue base" }),
  },
  {
    id: "tongue.posteriorBaseCoronal.height",
    unit: "millimetres",
    channels: [],
    read: () => ({ reason: "missing landmark: the start of the posterior tongue base" }),
  },
];
