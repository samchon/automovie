import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";
import { AutoMovieHumanAnkleBinding } from "./AutoMovieHumanAnkleBinding";
import { AutoMovieHumanCervicalBinding } from "./AutoMovieHumanCervicalBinding";
import { AutoMovieHumanElbowBinding } from "./AutoMovieHumanElbowBinding";
import { AutoMovieHumanFingerDipBinding } from "./AutoMovieHumanFingerDipBinding";
import { AutoMovieHumanFingerPipBinding } from "./AutoMovieHumanFingerPipBinding";
import { AutoMovieHumanGirdleBinding } from "./AutoMovieHumanGirdleBinding";
import { AutoMovieHumanHeadBinding } from "./AutoMovieHumanHeadBinding";
import { AutoMovieHumanHipBinding } from "./AutoMovieHumanHipBinding";
import { AutoMovieHumanJawBinding } from "./AutoMovieHumanJawBinding";
import { AutoMovieHumanKneeBinding } from "./AutoMovieHumanKneeBinding";
import { AutoMovieHumanKnuckleBinding } from "./AutoMovieHumanKnuckleBinding";
import { AutoMovieHumanLumbarBinding } from "./AutoMovieHumanLumbarBinding";
import { AutoMovieHumanShoulderBinding } from "./AutoMovieHumanShoulderBinding";
import { AutoMovieHumanThoracicBinding } from "./AutoMovieHumanThoracicBinding";
import { AutoMovieHumanThumbCmcBinding } from "./AutoMovieHumanThumbCmcBinding";
import { AutoMovieHumanThumbIpBinding } from "./AutoMovieHumanThumbIpBinding";
import { AutoMovieHumanThumbMcpBinding } from "./AutoMovieHumanThumbMcpBinding";
import { AutoMovieHumanToeBinding } from "./AutoMovieHumanToeBinding";
import { AutoMovieHumanWristBinding } from "./AutoMovieHumanWristBinding";

/**
 * Every region of the binding that owns a bone, top to bottom. A bone no
 * region names (the pelvis, the root) has no cut and takes the hinge's
 * capsule. The regions that own no bone of their own are pieces of these:
 * the deltoid of the shoulder, the groin and the crotch of the hip, the lips
 * of the jaw, the axilla of the arm against the trunk.
 *
 * @evidence contracts/common.md#meaningful-documentation States what the list holds and what it leaves out.
 */
export const AutoMovieHumanBindingRegions: readonly IAutoMovieHumanBindingRegion[] =
  [
    AutoMovieHumanLumbarBinding.region,
    AutoMovieHumanThoracicBinding.region,
    AutoMovieHumanCervicalBinding.region,
    AutoMovieHumanHeadBinding.region,
    AutoMovieHumanJawBinding.region,
    AutoMovieHumanGirdleBinding.region,
    AutoMovieHumanShoulderBinding.region,
    AutoMovieHumanElbowBinding.region,
    AutoMovieHumanWristBinding.region,
    AutoMovieHumanThumbCmcBinding.region,
    AutoMovieHumanThumbMcpBinding.region,
    AutoMovieHumanThumbIpBinding.region,
    AutoMovieHumanKnuckleBinding.region,
    AutoMovieHumanFingerPipBinding.region,
    AutoMovieHumanFingerDipBinding.region,
    AutoMovieHumanHipBinding.region,
    AutoMovieHumanKneeBinding.region,
    AutoMovieHumanAnkleBinding.region,
    AutoMovieHumanToeBinding.region,
  ];
