# src/human/generation/hand/IAutoMovieHumanDigitJointRelief.ts#IAutoMovieHumanDigitJointRelief.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A joint's fixed inputs.

## @evidence contracts/development/design.md#principled-representation `at`: Arc length of the joint's centre along the digit's line, mm. `half`: Half extent of the window along the line, mm; the joint's turn half-length is the natural size. `radius`: The joint's radius, mm: the mean of the section's half width and depth there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanDigitJointRelief.height, AutoMovieHumanDigitJointRelief.slope. Also types AutoMovieHumanDigitProfile.reliefs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `at`, `half`, `radius`; callers supply the complete record.
