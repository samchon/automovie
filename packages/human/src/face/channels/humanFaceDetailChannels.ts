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
 * Scalar controls on the component profiles. Source geometry arrays are
 * inherited by omission or cleared, never newly sculpted in detailed edits;
 * appearance and the legacy named hair-layer scalar transaction have their
 * separately admitted array semantics.
 * Ranges are editing envelopes; the part's coupled validator remains decisive.
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
