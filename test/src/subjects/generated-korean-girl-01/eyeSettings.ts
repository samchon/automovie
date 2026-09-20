/**
 * Frozen ocular dimensions and attachments for the retained reference study.
 * configuration.ts assembles these values; unit document fixtures own separate
 * immutable input data. Lengths use head millimetres and socket IDs refer to
 * controlNet. These are the unchanged historical inputs, not a new fitting pass.
 * Callers clone a profile before editing it; shared configuration stays fixed.
 */
import { portraitEyebrowProfile } from "@automovie/human/face/anatomy/brow/portraitEyebrowProfile";
import { type IPortraitAegyoSalShape } from "@automovie/human/face/anatomy/eye/structures/IPortraitAegyoSalShape";
import { type IPortraitEyeShape } from "@automovie/human/face/anatomy/eye/structures/IPortraitEyeShape";
import { type IPortraitEyeSocket } from "@automovie/human/face/anatomy/eye/structures/IPortraitEyeSocket";

/** Subject-specific attachments; component implementations contain no landmark IDs. */
export const portraitEyeSockets: IPortraitEyeSocket[] = [
  {
    name: "right",
    top: [33, 246, 161, 160, 159, 158, 157, 173, 133],
    bottom: [33, 7, 163, 144, 145, 153, 154, 155, 133],
    iris: 468,
    browTop: [70, 63, 105, 66, 107],
    browBottom: [46, 53, 52, 65, 55],
  },
  {
    name: "left",
    top: [362, 398, 384, 385, 386, 387, 388, 466, 263],
    bottom: [362, 382, 381, 380, 374, 373, 390, 249, 263],
    iris: 473,
    browTop: [336, 296, 334, 293, 300],
    browBottom: [285, 295, 282, 283, 276],
  },
];

/**
 * Subject-owned eye dimensions. Scale values are dimensionless; lengths use
 * millimetres and sampling/fibre counts are integers. Field-level contracts live
 * in IPortraitEyeShape. These authored values remain subject to visual fitting.
 */
export const portraitEyeShape: IPortraitEyeShape = {
  // Compensate the aperture's subdivision shrinkage at the subject level.
  // This fit is relative to its own measured socket, not a population norm.
  widthScale: 1.06,
  // Preserve the measured vertical opening while the lower roll is fitted;
  // the pretarsal component must never compensate by shrinking the eye.
  openingScale: 1.04,
  outerCornerLift: 0,
  socketLift: 0,
  blendReach: 18,
  // Reserve the host patch before installing the wide lower-tissue section.
  // Deforming the old aperture into that outer seam folded neighbouring skin;
  // the shared annulus instead keeps the containing host boundary in place.
  skinAttachment: "reserve",
  // Keep the upper crease near the measured aperture. The lower roll belongs
  // immediately below its margin; a separate infraorbital layer supplies the
  // broader transition into the cheek. These millimetre dimensions are authored
  // image-guided fits, not population averages or clinical measurements.
  foldWidth: 1.15,
  foldDepth: 0.14,
  upperLidVolume: 0.18,
  // Localize the visible pretarsal roll immediately below the lashes. These
  // are authored surface offsets, not a muscle-thickness measurement.
  lowerLidWidth: 0.55,
  lowerLidVolume: 0,
  // The visible pretarsal body is owned by the grouped aegyo-sal field below.
  // Keep the construction envelope as a quiet supporting seam so its repeated
  // rings do not compete with the single rounded surface roll.
  aegyoSal: {
    offset: 0.6,
    projection: 0.6,
    width: 23,
    height: 1,
    // The socket's canthus-to-canthus span is approximately 24 mm in the
    // same projection, so the reach participates in the envelope as well.
    reach: 24,
    weights: [0.1, 0.55, 0.9, 1, 0.9, 0.55, 0.1],
  } satisfies IPortraitAegyoSalShape,
  // Explicit tissue sections replace the two-control lower envelope within a
  // canthal fade. The roll, its lower boundary and the preseptal transition
  // have separate positions/projections. These mm values are a render-study
  // hypothesis, not adult anatomical averages or accepted subject dimensions.
  lowerLidProfile: {
    // The photographed aegyo-sal is a small pretarsal orbicularis roll, not a
    // broad lower-eye pad. Its crest therefore sits close to the margin and
    // carries most of the relief; the subtarsal rows fall back toward the host
    // skin before the preseptal transition. Width and projection remain
    // independent authored witnesses: changing only depth would preserve the
    // old horizontal band. These are visible surface offsets, not muscle
    // thickness or a clinical age model.
    // Keep the outer attachment and inner margin fixed while the transverse body
    // and its preseptal landing are fitted as one section. Positive relief alone
    // does not prevent a trough: the globe-to-skin bridge can lie behind both
    // boundaries. The adopted coupled study narrows the pretarsal/subtarsal
    // offsets. The crest is intentionally fuller than the lower shoulder, and
    // the shoulder loses relief before the preseptal landing; this keeps the
    // rounded body legible without extending a bag into the cheek after
    // subdivision.
    sections: [
      { at: 0, fullness: 0.2, width: 0.7 },
      { at: 0.16, fullness: 0.6, width: 0.9 },
      { at: 0.34, fullness: 0.92, width: 1 },
      { at: 0.5, fullness: 1, width: 1 },
      { at: 0.66, fullness: 0.92, width: 1 },
      { at: 0.84, fullness: 0.6, width: 0.9 },
      { at: 1, fullness: 0.2, width: 0.7 },
    ].map(({ at, fullness, width }) => ({
      at,
      section: {
        margin: { offset: 0.16, projection: 0.12 },
        pretarsalCrest: { offset: 1.1 * width, projection: 0.08 * fullness },
        pretarsalLower: { offset: 1.9 * width, projection: 0.03 * fullness },
        subtarsalInner: { offset: 2.7 * width, projection: 0.01 * fullness },
        subtarsalOuter: { offset: 3.8 * width, projection: 0.0 },
        preseptal: { offset: 5.2, projection: 0.0 },
        attachment: 6.2,
      },
    })),
  },
  lidThickness: 0.18,
  surfaceRadius: 18,
  // Schematic-eye optical dimensions, not measurements recovered from this
  // photo. The curvature, axial thickness and refractive index follow the
  // schematic dimensions cited in README.md; the globe remains an authored fit.
  cornealRadius: 7.8,
  cornealThickness: 0.55,
  cornealRimLift: 0.65,
  // Keep a circular optical boundary while the eyelids determine visibility.
  // This trial must inspect their contact: clipping a thick closed cornea to
  // the visible opening produced a raised flattened glass rim in close views.
  cornealBoundary: "limbus",
  lidContact: "cornea",
  lidContactReach: 3,
  // The observed iris-rim markers give horizontal radii of 6.36–6.47 mm after
  // pose removal. One radius fits this subject's two independently bound eyes.
  irisRadius: 6.1,
  pupilRadius: 2.35,
  // The source iris reads as dark brown under its captured illumination.
  // These are authored linear albedos, not colors sampled from image pixels.
  irisPigment: {
    base: [0.015, 0.009, 0.005],
    variation: [0.055, 0.03, 0.012],
  },
  // Visible tissue occupies the existing aperture; it does not move its skin
  // attachment or resize the eye. Values are authored millimetre fits. The
  // lower width stays within the iris patch's 0.15 mm lid clearance.
  tissues: {
    cornerLength: 1.4,
    caruncleProjection: 0.18,
    plicaProjection: 0.08,
    lowerMarginWidth: 0.15,
    lowerMarginLift: 0.035,
  },
  browFibres: 800,
  browProfile: {
    ...portraitEyebrowProfile,
    radius: 0.0475,
    outwardBend: 1.4,
    rootBand: [0.05, 0.55],
    span: 0.3,
    endFade: [0.12, 0.25],
  },
  upperLashes: 64,
  sampling: { eyeColumns: 80, eyeRows: 28, irisColumns: 84, irisRows: 20 },
};

/** An alternate aperture and lid profile for exercising independent replacement. */
export const alternatePortraitEye: IPortraitEyeShape = {
  ...portraitEyeShape,
  // Replacement exercises the direct attachment path so its reservation
  // population is intentionally different from the fitted subject variant.
  skinAttachment: undefined,
  widthScale: 1.08,
  openingScale: 0.78,
  outerCornerLift: 0.8,
  foldWidth: 0.85,
  foldDepth: 0.35,
  surfaceRadius: 20,
};
