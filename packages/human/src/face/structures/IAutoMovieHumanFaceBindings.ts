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
 * @evidence contracts/common.md#principled-implementation Named eye/nose/mouth and optional cheek/dental source supports keep components on one portrait host; nonzero observed/current jaw opening requires the authored transverse hinge in head millimetres.
 * @evidence contracts/common.md#clear-and-simple-design Existing socket owners carry their feature correspondence and the hinge is separate from optical/oral boundary identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bindings are source correspondence rather than personal detail-control vertices; the authored hinge and weighted kinematics certify no recovered skull, muscle weights or clinical joint trajectory.
 * @evidence contracts/common.md#meaningful-documentation Members identify anatomical laterality, original cut populations, optional component prerequisites and the hinge's frame/unit/nonzero-opening requirement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface executes no host fit, cavity cut or jaw rotation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared attachment identity supplies input correspondence; component clones and per-fit constraints belong to their producers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The source caller owns socket populations; this type acquires no mesh or source stream.
 *
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
