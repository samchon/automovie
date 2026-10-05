import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { readHumanFaceEyeRegionGap } from "./readHumanFaceEyeRegionGap";

/**
 * The eye-region measurements of the face resolver: one per numeric field of
 * `IAutoMovieHumanFaceEyeParameters` (`eye.<field>` and `eye.<side>.<field>`),
 * `IAutoMovieHumanFaceBrowParameters` (`brow.<side>.<field>`) and
 * `IAutoMovieHumanFaceEyelashParameters`
 * (`eyelash.<side>.<row>.<field>`), each without its unit suffix.
 *
 * Every reader needs the producer's periocular registration (lid margins,
 * canthi, brow and lash regions) or its optical support (globe, cornea,
 * pupil), which no published basis carries yet, so each reads as a named gap
 * (`readHumanFaceEyeRegionGap`). Central corneal thickness reads in
 * millimetres, the registry's unit, against the observation's micrometres.
 * The shaft count, the brow hair coverage, the lash form and the lower-lid
 * tissue grades have no measurement: the lashes and brows are cards and the
 * lid has no tissue layer. Channels name the existing identity channels a
 * target may move once the reading exists; until then the builder refuses a
 * target for an unavailable reading.
 *
 * @author Samchon
 */
export const HUMAN_FACE_EYE_MEASUREMENTS: readonly IHumanFaceMeasurement[] = [
  {
    id: "eye.innerCanthalDistance",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "endocanthion-to-endocanthion distance from the periocular medial canthi",
      ),
  },
  {
    id: "eye.outerCanthalDistance",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "exocanthion-to-exocanthion distance from the periocular lateral canthi",
      ),
  },
  {
    id: "eye.interpupillaryDistance",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "opticalSupport",
        "pupil-centre distance in forward gaze from the optical support",
      ),
  },
  {
    id: "eye.left.fissureLength",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "left endocanthion-to-exocanthion distance",
      ),
  },
  {
    id: "eye.left.fissureHeight",
    unit: "millimetres",
    channels: ["leftEyeHeight"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "left upper-to-lower lid margin distance on the pupil vertical",
      ),
  },
  {
    id: "eye.left.lateralCanthusRise",
    unit: "millimetres",
    channels: ["leftLateralCanthusElevation"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "left exocanthion height minus endocanthion height",
      ),
  },
  {
    id: "eye.left.upperCreaseHeight",
    unit: "millimetres",
    channels: ["leftEyeFoldHeight"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "left upper-lid crease above the margin on the pupil vertical; the registration carries no crease",
      ),
  },
  {
    id: "eye.left.pupilToBrow",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "left pupil centre to the lower brow margin; also needs the optical support's pupil",
      ),
  },
  {
    id: "eye.left.horizontalLimbusDiameter",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "opticalSupport",
        "left nasal-to-temporal limbus diameter",
      ),
  },
  {
    id: "eye.left.pupilDiameterAt250Lux",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "opticalSupport",
        "left pupil diameter; no light-dependent pupil exists",
      ),
  },
  {
    id: "eye.left.globeAxialLength",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "opticalSupport",
        "left cornea-to-retina axial length",
      ),
  },
  {
    id: "eye.left.anteriorCornealRadius",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "opticalSupport",
        "left central anterior corneal radius",
      ),
  },
  {
    id: "eye.left.centralCornealThickness",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "opticalSupport",
        "left central corneal thickness",
      ),
  },
  {
    id: "eye.right.fissureLength",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "right endocanthion-to-exocanthion distance",
      ),
  },
  {
    id: "eye.right.fissureHeight",
    unit: "millimetres",
    channels: ["rightEyeHeight"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "right upper-to-lower lid margin distance on the pupil vertical",
      ),
  },
  {
    id: "eye.right.lateralCanthusRise",
    unit: "millimetres",
    channels: ["rightLateralCanthusElevation"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "right exocanthion height minus endocanthion height",
      ),
  },
  {
    id: "eye.right.upperCreaseHeight",
    unit: "millimetres",
    channels: ["rightEyeFoldHeight"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "right upper-lid crease above the margin on the pupil vertical; the registration carries no crease",
      ),
  },
  {
    id: "eye.right.pupilToBrow",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "right pupil centre to the lower brow margin; also needs the optical support's pupil",
      ),
  },
  {
    id: "eye.right.horizontalLimbusDiameter",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "opticalSupport",
        "right nasal-to-temporal limbus diameter",
      ),
  },
  {
    id: "eye.right.pupilDiameterAt250Lux",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "opticalSupport",
        "right pupil diameter; no light-dependent pupil exists",
      ),
  },
  {
    id: "eye.right.globeAxialLength",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "opticalSupport",
        "right cornea-to-retina axial length",
      ),
  },
  {
    id: "eye.right.anteriorCornealRadius",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "opticalSupport",
        "right central anterior corneal radius",
      ),
  },
  {
    id: "eye.right.centralCornealThickness",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "opticalSupport",
        "right central corneal thickness",
      ),
  },
  {
    id: "brow.left.length",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "medial-to-lateral extent of the left brow hair",
      ),
  },
  {
    id: "brow.left.centralBreadth",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "left brow envelope breadth on the pupil vertical",
      ),
  },
  {
    id: "brow.left.medialBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "left medial inferior brow margin to the upper lid margin",
      ),
  },
  {
    id: "brow.left.centralBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "left central inferior brow margin to the upper lid margin",
      ),
  },
  {
    id: "brow.left.lateralBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "left lateral inferior brow margin to the upper lid margin",
      ),
  },
  {
    id: "brow.left.upperArchApexRise",
    unit: "millimetres",
    channels: ["browAngle"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "left superior brow border apex above its medial-limbus level",
      ),
  },
  {
    id: "brow.right.length",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "medial-to-lateral extent of the right brow hair",
      ),
  },
  {
    id: "brow.right.centralBreadth",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "right brow envelope breadth on the pupil vertical",
      ),
  },
  {
    id: "brow.right.medialBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "right medial inferior brow margin to the upper lid margin",
      ),
  },
  {
    id: "brow.right.centralBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "right central inferior brow margin to the upper lid margin",
      ),
  },
  {
    id: "brow.right.lateralBrowToLid",
    unit: "millimetres",
    channels: ["browElevation"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "right lateral inferior brow margin to the upper lid margin",
      ),
  },
  {
    id: "brow.right.upperArchApexRise",
    unit: "millimetres",
    channels: ["browAngle"],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "right superior brow border apex above its medial-limbus level",
      ),
  },
  {
    id: "eyelash.left.upper.longestCentralLength",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "longest left upper lash rooted in the central 2 mm of the margin; the lashes are cards, not shafts",
      ),
  },
  {
    id: "eyelash.left.lower.longestCentralLength",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "longest left lower lash rooted in the central 2 mm of the margin; the lashes are cards, not shafts",
      ),
  },
  {
    id: "eyelash.right.upper.longestCentralLength",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "longest right upper lash rooted in the central 2 mm of the margin; the lashes are cards, not shafts",
      ),
  },
  {
    id: "eyelash.right.lower.longestCentralLength",
    unit: "millimetres",
    channels: [],
    read: (context) =>
      readHumanFaceEyeRegionGap(
        context,
        "periocular",
        "longest right lower lash rooted in the central 2 mm of the margin; the lashes are cards, not shafts",
      ),
  },
];
