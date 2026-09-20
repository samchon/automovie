import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";
import { humanFaceCavityChannels } from "./humanFaceCavityChannels";
import { humanFaceCheekChannels } from "./humanFaceCheekChannels";
import { humanFaceEarChannels } from "./humanFaceEarChannels";
import { humanFaceFrameChannels } from "./humanFaceFrameChannels";
import { humanFaceHairChannels } from "./humanFaceHairChannels";
import { humanFaceLashChannels } from "./humanFaceLashChannels";
import { humanFaceLipChannels } from "./humanFaceLipChannels";
import { humanFaceLowerDentalChannels } from "./humanFaceLowerDentalChannels";
import { humanFaceNasalChannels } from "./humanFaceNasalChannels";
import { humanFaceNeckChannels } from "./humanFaceNeckChannels";
import { humanFaceOcularChannels } from "./humanFaceOcularChannels";
import { humanFaceSkinChannels } from "./humanFaceSkinChannels";
import { humanFaceTongueChannels } from "./humanFaceTongueChannels";
import { humanFaceUpperDentalChannels } from "./humanFaceUpperDentalChannels";

/**
 * Scalar controls on the component profiles. Array and complete-object profiles
 * remain independently replaceable through the same region document editor.
 * Ranges are editing envelopes; the part's coupled validator remains decisive.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Connects numerical sliders to actual detailed shape settings.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Provides field meaning, applied-value inspection and anatomical attachment context.
 */
export const humanFaceDetailChannels: readonly IAutoMovieHumanFaceDetailChannel[] =
  [
    ...humanFaceNeckChannels,
    ...humanFaceCavityChannels,
    ...humanFaceTongueChannels,
    ...humanFaceLashChannels,
    ...humanFaceSkinChannels,
    ...humanFaceHairChannels,
    ...humanFaceLowerDentalChannels,
    ...humanFaceFrameChannels,
    ...humanFaceOcularChannels,
    ...humanFaceNasalChannels,
    ...humanFaceLipChannels,
    ...humanFaceCheekChannels,
    ...humanFaceEarChannels,
    ...humanFaceUpperDentalChannels,
  ];
