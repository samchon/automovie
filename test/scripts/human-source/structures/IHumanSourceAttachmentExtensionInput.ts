import type { IHumanFaceOcularSurface } from "@automovie/human/face/anatomy/eye/structures/IHumanFaceOcularSurface";
import type { IAutoMovieHumanFaceBasisSurface } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFacePeriocularCage } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularCage";

/** Existing source incidence and the consumer's exact prepared reference. */
export interface IHumanSourceAttachmentExtensionInput {
  host: IAutoMovieHumanFaceBasisSurface;
  cage: IAutoMovieHumanFacePeriocularCage;
  reference: readonly number[];
  exterior: IHumanFaceOcularSurface;
}
