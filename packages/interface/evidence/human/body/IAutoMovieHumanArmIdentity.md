# src/human/body/IAutoMovieHumanArmIdentity.ts#IAutoMovieHumanArmIdentity

## @evidence contracts/development/common.md#meaningful-documentation

One arm, measured hanging at the side.

## @evidence contracts/development/design.md#principled-representation `upperArmLength`: Acromion-radiale length: the acromion to the upper palpable edge of the radial head, millimetres. `forearmLength`: Radiale-stylion length: the radial head to the tip of the radial styloid process, millimetres. `handLength`: Hand length: the wrist crease at stylion to the tip of the middle finger, millimetres (ANSUR II hand length; women 181.1, SD 10.1, men 193.3, SD 9.9).

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmIdentity is the canonical exchange used by IAutoMovieHumanArmIdentitySchema, IAutoMovieHumanBodyIdentity, IAutoMovieHumanExtremityDimensions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `upperArmLength`, `forearmLength`, `handLength`, `handBreadth`, `palmLength`, `thumbLength`, `upperArmCircumference`, `forearmCircumference`, `wristCircumference`, `carryingAngle`, `shoulderFlexion`, `elbowFlexion`, `elbowHyperextension`, `forearmPronation`, `forearmSupination`, `dorsalHandFat`; callers supply the complete record.
