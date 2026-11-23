# src/human/expression/IAutoMovieHumanLipExpression.ts#IAutoMovieHumanLipExpression

## @evidence contracts/development/common.md#meaningful-documentation

Lip and cheek action units used in speech, as intensities from rest (0) to maximum (1), FACS letter grades A to E at about 0.2, 0.4, 0.6, 0.8 and 1 (Ekman and Friesen 1978, FACS).

## @evidence contracts/development/design.md#principled-representation `upperLipRaiser`: AU10, levator labii superioris: the upper lip rises. `lipCornerPuller`: AU12, zygomaticus major: the mouth corner pulls up and back. `lipCornerDepressor`: AU15, depressor anguli oris: the mouth corner lowers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLipExpression is the canonical exchange used by IAutoMovieHumanLipExpressionSchema, IAutoMovieHumanMouthExpression.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `upperLipRaiser`: AU10, levator labii superioris: the upper lip rises. `lipCornerPuller`: AU12, zygomaticus major: the mouth corner pulls up and back. `lipCornerDepressor`: AU15, depressor anguli oris: the mouth corner lowers. `lipStretcher`: AU20, risorius with platysma: the mouth corner stretches sideways. `lowerLipDepressor`: AU16, depressor labii inferioris: the lower lip lowers. `chinRaiser`: AU17, mentalis: the chin's skin and the lower lip push up, as when the lower lip meets the upper teeth for /f/. `lipPucker`: AU18, incisivus labii: the lips push forward and gather (pucker). `lipFunneler`: AU22, orbicularis oris: the lips funnel outward. `lipTightener`: AU23, orbicularis oris: the lips tighten and thin. `lipPressor`: AU24, orbicularis oris: the lips press together. `lipsPart`: AU25: the lips part, without requiring the jaw to drop. `lipSuck`: AU28, orbicularis oris: the lips are sucked in over the teeth. `cheekPuff`: AU34, cheek puff: air inflates the cheeks with the lips closed.
