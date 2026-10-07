/**
 * The chin height, in millimetres, of the host the default neck sections were
 * authored below. `resolvePortraitNeckShape` shifts those sections by the
 * difference between the actual host chin and this source reference height.
 * This is a legacy authored support datum, not an individual measurement.
 *
 * @evidence contracts/common.md#principled-implementation The datum retains the existing authored neck support's chin reference, whose difference from the current host chin determines the vertical section translation.
 * @evidence contracts/common.md#clear-and-simple-design One immutable scalar names one authored reference height.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person identity, inferred measurement or special-case output enters this datum.
 * @evidence contracts/common.md#meaningful-documentation States its legacy support ownership, translation consumer and nonclinical meaning.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the legacy portrait host's Y-up head frame, read without conversion by resolvePortraitNeckShape.
 * @evidence contracts/anatomy.md#anatomical-source This is the retained authored portrait-host support height; no primary clinical observation or personal anatomy is claimed for it.
 */
export const portraitNeckReferenceChin = -83.5;
