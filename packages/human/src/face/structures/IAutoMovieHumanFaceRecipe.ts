import type { IPortraitCheekShape } from "../anatomy/cheek/IPortraitCheekShape";
import type { IPortraitNeckShape } from "../anatomy/cranium/structures/IPortraitNeckShape";
import type { IPortraitCraniumShape } from "../anatomy/cranium/structures/IPortraitCraniumShape";
import type { createPortraitDentalComponent } from "../anatomy/dental/createPortraitDentalComponent";
import type { IPortraitDentalRow } from "../anatomy/dental/structures/IPortraitDentalRow";
import type { IPortraitEarShape } from "../anatomy/ear/IPortraitEarShape";
import type { IPortraitEyeShape } from "../anatomy/eye/structures/IPortraitEyeShape";
import type { IPortraitFacialFrameShape } from "../anatomy/cranium/structures/IPortraitFacialFrameShape";
import type { IPortraitHairShape } from "../anatomy/hair/IPortraitHairShape";
import type { IPortraitHairLayer } from "../anatomy/hair/IPortraitHairLayer";
import type { IPortraitMouthShape } from "../anatomy/mouth/structures/IPortraitMouthShape";
import type { IPortraitNoseShape } from "../anatomy/nose/structures/IPortraitNoseShape";
import type { IPortraitOrbitalSupportShape } from "../anatomy/eye/structures/IPortraitOrbitalSupportShape";
import type { IPortraitSkinColourRegion } from "../anatomy/skin/structures/IPortraitSkinColourRegion";
import type { IPortraitSkinShape } from "../anatomy/skin/structures/IPortraitSkinShape";
import type { IPortraitTongueShape } from "../anatomy/tongue/IPortraitTongueShape";
import type { IPortraitReliefCurve } from "../anatomy/skin/structures/IPortraitReliefCurve";
import type { IPortraitReliefRegion } from "../anatomy/skin/structures/IPortraitReliefRegion";

/**
 * Complete subject-owned part profiles. These are shape inputs, not a mesh
 * cache or a population preset. Optional supports retain their fixed defaults.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Owns the component profiles from which one anatomical face is built.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Connects part geometry, skin supports, dentition and cervical continuation.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceRecipe {
  /** Skin laxity, regional folds and tissue descent; omitted settings retain the unchanged surface. */
  skin?: IPortraitSkinShape;

  /** Named reference-attached linear skin-colour regions; [] clears the inherited population. */
  skinColour?: readonly IPortraitSkinColourRegion[];

  /** Optional surface-based scalp locks, authored in head millimetres. Omission adds no hairstyle. */
  hair?: IPortraitHairShape;

  /** Up to eight additional independent scalp populations; arrays replace completely and [] removes only these layers. */
  hairLayers?: readonly IPortraitHairLayer[];

  /** Shared craniofacial proportions and named jaw/chin/forehead/temple supports; omission is identity. */
  frame?: IPortraitFacialFrameShape;

  /** Common optical, eyelid and brow profile before side-specific overrides. */
  eye: IPortraitEyeShape;

  /** Nasal exterior and cavity profile in the basis's nasal binding. */
  nose: IPortraitNoseShape;

  /** Lip and oral-cavity profile. Separate dentition requires an empty legacy crowns array. */
  mouth: IPortraitMouthShape;

  /** Optional closed tongue with an observed lower-oral attachment; requires an explicit jaw hinge and named resident material. */
  tongue?: IPortraitTongueShape;

  /** Common malar, medial, buccal and modiolus supports; omission adds no cheek layer. */
  cheek?: IPortraitCheekShape;

  /** Complete right and left upper-orbit section groups; omission adds no orbital layer. */
  orbits?: {
    right: IPortraitOrbitalSupportShape;
    left: IPortraitOrbitalSupportShape;
  };

  /** Cranial sections; omission retains the fixed continuation. */
  cranium?: IPortraitCraniumShape;

  /** Cervical sections and crop; omission retains the fixed neck. */
  neck?: IPortraitNeckShape;

  /** Common pinna profile; omission retains the fixed pinna. */
  ear?: IPortraitEarShape;

  /** Optional independently constructed upper arch and whole-group oral placement. */
  dentition?: {
    /** Ordered individual crown profiles, arch shape and spacing. */
    row: IPortraitDentalRow;

    /** Upward lift and posterior recess from the upper oral anchor, in mm. */
    placement: Parameters<typeof createPortraitDentalComponent>[2];
  };

  /** Optional independently authored mandibular enamel, rigidly attached to the jaw hinge. */
  lowerDentition?: {
    /** Lower crown profiles and arch; no upper-row size assumptions are imposed. */
    row: IPortraitDentalRow;

    /** Inferior cervical-plane drop and posterior recess from the observed lower inner-lip midpoint, in nonnegative mm. */
    placement: { drop: number; recess: number };
  };

  /** Additional named skin supports; this does not substitute for the part profiles above. */
  relief?: readonly { id: string; regions: readonly IPortraitReliefRegion[] }[];

  /** Additional connected named skin curves, such as philtral crests. */
  curves?: readonly { id: string; curves: readonly IPortraitReliefCurve[] }[];
}
