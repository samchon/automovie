# src/human/generation/limb/IAutoMovieHumanDigitWalk.ts#IAutoMovieHumanDigitWalk.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What a digit is built from.

## @evidence contracts/development/design.md#principled-representation `name`: Chain name, such as `finger.left.index` or `toe.left.1`. `centres`: The joint centres from the base (the knuckle, inside the host) to the distal phalanx's end: base, then each interphalangeal joint, then the end, at least three. `dorsal`: The dorsal direction on the first phalanx.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanDigitInterim.finger, AutoMovieHumanDigitInterim.walk. Read by AutoMovieHumanHandAttachment.attach, AutoMovieHumanDigitWalk.create, AutoMovieHumanDigitWalk.define. Also types AutoMovieHumanArmSources.branch, AutoMovieHumanArmSources.digit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `ranges`: Optional closed-span scalar bounds in this digit's material chart. `attachment`: Whole actual parent owner and declared local contact/material transfer.

# src/human/generation/limb/IAutoMovieHumanDigitWalk.ts#IAutoMovieHumanDigitWalk.ISiteLaw

## @evidence contracts/development/common.md#meaningful-documentation

A digit's laws at one site.

## @evidence contracts/development/design.md#principled-representation `breadth`: Whole breadth across the digit, mm. `depth`: Whole depth from the dorsal to the palmar or plantar skin, mm. `dorsal`: The dorsal share of the depth above the bone's axis, in `(0, 1)`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanDigitInterim.walk, AutoMovieHumanDigitWalk.bendRadius. Also types AutoMovieHumanFootToeSources.law, AutoMovieHumanFootToeSources.near.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `shoulders`: Actual parent-derived quarter fullness in this digit's engine material frame. `shoulderJets`: Available quarter jets in the same normalized source clock; a held parent section declares its constant pullback explicitly. `jets`: Optional original edge jets in the digit's normalized source parameter.
