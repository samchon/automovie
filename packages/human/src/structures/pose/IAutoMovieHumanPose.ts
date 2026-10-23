import type { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";
import type { IAutoMovieHumanArmPose } from "./IAutoMovieHumanArmPose";
import type { IAutoMovieHumanHeadPose } from "./IAutoMovieHumanHeadPose";
import type { IAutoMovieHumanLegPose } from "./IAutoMovieHumanLegPose";
import type { IAutoMovieHumanNeckPose } from "./IAutoMovieHumanNeckPose";
import type { IAutoMovieHumanPelvisPose } from "./IAutoMovieHumanPelvisPose";
import type { IAutoMovieHumanSpinePose } from "./IAutoMovieHumanSpinePose";

/**
 * A static pose of one person: every anatomically movable joint, top to bottom, each degree of freedom one optional number in clinical units.
 *
 * ## Values
 *
 * Angles are clinical degrees from the anatomical neutral (standing upright, arms at the sides, palms forward, feet flat): 0 is that neutral, the field name is the positive motion and the opposite motion is negative (a negative flexion is extension). The jaw is in millimetres at the incisors, as clinically measured. Within a joint the degrees of freedom are listed sagittal, frontal, then transverse. Each field's minimum and maximum are its sourced range of motion, listed with sources in `packages/human/docs/anatomy/joint-range.md`; a value outside them is not a valid pose.
 *
 * ## Omission
 *
 * Every joint field is optional. An omitted region, joint or degree of freedom keeps the generated body's own rest posture for it (the observed neutral person stands in an A-pose with relaxed hands), which generally differs from the anatomical neutral; `{}` is that rest posture. A bilateral region names both sides; `{}` for one side keeps it at rest.
 *
 * ## Sides and directions
 *
 * Left and right are the person's own; "toward the left" turns or bends the moving part toward the person's left side.
 *
 * ## Source grades in the field comments
 *
 * - measured: Soucie et al. 2011, CDC normal range of motion, adults 20 to 44, female and male means averaged; Verkouteren et al. 2022 for the mandible.
 * - AAOS: the AAOS normal values transcribed by Hendriks et al. 2020 (conventional handbook norms).
 * - recalled: handbook norms recalled from Greene and Heckman 1994 (AAOS), White and Panjabi 1990 (spinal segments) or Neumann 2017 (shoulder girdle), not reread for this table.
 * - convention: no source read; a stated modelling choice.
 *
 * The generator does not deform the skin by pose yet (campaign #2947); the stickman of `AutoMovieHumanSkeleton` applies every field.
 */
export interface IAutoMovieHumanPose {
  /** Eyes and jaw. */
  head?: IAutoMovieHumanHeadPose;

  /** Cranio-vertebral joints and the lower cervical spine. */
  neck?: IAutoMovieHumanNeckPose;

  /** Shoulder girdle, arm and hand of each side. */
  arms?: IAutoMovieHumanPair<IAutoMovieHumanArmPose>;

  /** Thoracic and lumbar spine. */
  spine?: IAutoMovieHumanSpinePose;

  /** Orientation of the pelvis, the root of the body. */
  pelvis?: IAutoMovieHumanPelvisPose;

  /** Hip, knee, ankle, foot and toes of each side. */
  legs?: IAutoMovieHumanPair<IAutoMovieHumanLegPose>;
}
