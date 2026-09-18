import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IPortraitCheekSocket } from "../anatomy/cheek/IPortraitCheekSocket";
import type { createPortraitDentalComponent } from "../anatomy/dental/createPortraitDentalComponent";
import type { IPortraitEyeSocket } from "../anatomy/eye/structures/IPortraitEyeSocket";
import type { IPortraitMouthSocket } from "../anatomy/mouth/structures/IPortraitMouthSocket";
import type { IPortraitNoseSocket } from "../anatomy/nose/structures/IPortraitNoseSocket";

/**
 * Source-independent attachment identities on a 478-landmark facial basis.
 * Coordinates are basis observations; these bindings identify anatomy rather
 * than pretending arbitrary vertex movement is a detail-control system.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Preserves one document's topology and anatomical bindings for independent replay.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Binds the versioned landmark interpretation to the recorded host.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBindings {
  /** Independent anatomical right and left eyes with their own gaze markers. */
  eyes: { right: IPortraitEyeSocket; left: IPortraitEyeSocket };
  /** Nasal host support and original cavity cut populations. */
  nose: IPortraitNoseSocket;
  /** Vermilion and oral boundary identities. */
  mouth: IPortraitMouthSocket;
  /** Paired cheek attachments; required when a cheek profile is selected. */
  cheeks?: { right: IPortraitCheekSocket; left: IPortraitCheekSocket };
  /** Upper arch attachment; required when separate dentition is selected. */
  dentition?: Parameters<typeof createPortraitDentalComponent>[0];
  /** Authored transverse mandibular hinge centre in head millimetres; required for nonzero observed or current jaw opening. */
  jawHinge?: IAutoMovieVector3;
}
