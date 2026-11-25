# src/human/generation/IAutoMovieHumanArmPrior.ts#IAutoMovieHumanArmPrior.IKey

## @evidence contracts/development/common.md#meaningful-documentation

A tape's place on the bones and its circle per unit of the tape.

## @evidence contracts/development/design.md#principled-representation `station`: Arc length from the shoulder as a fraction of the way to the wrist. `ratio`: Circumference of the section across the bone per unit of the tape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmPrior.IKey is the canonical exchange used by IAutoMovieHumanArmPrior.IArm.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `station`, `ratio`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanArmPrior.ts#IAutoMovieHumanArmPrior.IArm

## @evidence contracts/development/common.md#meaningful-documentation

The arm: two straight bones and a section about them.

## @evidence contracts/development/design.md#principled-representation `order`: Control points of a section. `samples`: Uniform phases of the chain's rings. `rule`: Phase correspondence rule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLimbRest.prior, AutoMovieHumanArmLaw.prior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `order`, `samples`, `rule`, `heights`, `heel`, `upper`, `lower`, `bias`, `upperLength`, `lowerLength`, `softness`, `wrist`, `forearm`, `elbow`, `bicep`, `aspect`, `phase`, `sense`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanArmPrior.ts#IAutoMovieHumanArmPrior.IStar

## @evidence contracts/development/common.md#meaningful-documentation

Skin as a radius about an inner point, along `a`.

## @evidence contracts/development/design.md#principled-representation `stations`: Stations `a`, increasing. `series`: Per station, the inner point `[b, c]`, the half extents, then the mean radius in those extents and its harmonics `[cos 1, sin 1, ...]`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHandStar.star.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stations`, `series`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanArmPrior.ts#IAutoMovieHumanArmPrior.IThenar

## @evidence contracts/development/common.md#meaningful-documentation

The thenar eminence where the thumb leaves the palm: an ellipse across the hand.

## @evidence contracts/development/design.md#principled-representation `b`: Its centre across the hand. `c`: Its centre through the hand. `width`: Half width.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHandForm.thenar.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `b`, `c`, `width`, `depth`, `reach`, `soft`, `valley`, `valleyWidth`, `valleySpan`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanArmPrior.ts#IAutoMovieHumanArmPrior.IWeb

## @evidence contracts/development/common.md#meaningful-documentation

A web between two neighbouring fingers.

## @evidence contracts/development/design.md#principled-representation `a`: Its station. `b`: Its place across the hand. `c`: Its place through the hand.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHandStar.webbed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `a`, `b`, `c`, `depth`, `width`, `reach`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanArmPrior.ts#IAutoMovieHumanArmPrior.ISection

## @evidence contracts/development/common.md#meaningful-documentation

A chain's sampling.

## @evidence contracts/development/design.md#principled-representation `order`: Control points of a section. `samples`: Uniform phases of the chain's rings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHandForm.section.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `order`, `samples`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanArmPrior.ts#IAutoMovieHumanArmPrior.IDigit

## @evidence contracts/development/common.md#meaningful-documentation

A digit: a curved tube with a rounded tip.

## @evidence contracts/development/design.md#principled-representation `blend`: Length past its root before which its anchors still hold its root's own shape, mm. `name`: Chain name; `{side}` stands for the side. `pole`: The tip's apex.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHandDigitLaw.digit. Also types AutoMovieHumanHandDigitChain.source.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `blend`, `name`, `pole`, `anchors`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanArmPrior.ts#IAutoMovieHumanArmPrior.IPalmar

## @evidence contracts/development/common.md#meaningful-documentation

A digit section's palmar depth over its dorsal depth from the bone, by phalanx, read on f1's bone-normal digit sections (the fingers' means): the palmar pad is the fuller half over the proximal and middle phalanges, and over the distal phalanx the dorsal skin thins on the nail bed toward its middle before the tip rounds.

## @evidence contracts/development/design.md#principled-representation `proximal`: Over the proximal phalanx. `middle`: Over the middle phalanx, and at the DIP. `nail`: At the nail bed's middle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanDigitPalmarShare.shares.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `proximal`, `middle`, `nail`, `nailAt`, `tip`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanArmPrior.ts#IAutoMovieHumanArmPrior.IHandPrior

## @evidence contracts/development/common.md#meaningful-documentation

The hand.

## @evidence contracts/development/design.md#principled-representation `thumb`: The bind's thumb posture. `palmar`: Palmar over dorsal section depth along a digit. `crease`: Station `a` of the wrist crease in the form.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanArmLaw.handPrior, AutoMovieHumanFingerBones.prior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `thumb`, `palmar`, `crease`, `joints`, `external`, `thumbProximal`, `posture`, `along`, `across`, `through`, `whole`, `palm`, `branch`, `thenar`, `webs`, `ends`, `palmSection`, `digits`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanArmPrior.ts#IAutoMovieHumanArmPrior.IExpected

## @evidence contracts/development/common.md#meaningful-documentation

Hand inputs of a person without measures: lines in `[1, stature, hand tape]`.

## @evidence contracts/development/design.md#principled-representation `length`: Hand length. `palm`: Palm length. `breadth`: Hand breadth.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanArmConstruction.prior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `length`, `palm`, `breadth`, `thumb`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanArmPrior.ts#IAutoMovieHumanArmPrior.IPrior

## @evidence contracts/development/common.md#meaningful-documentation

The prior.

## @evidence contracts/development/design.md#principled-representation `arm`: Arm. `hand`: Hand. `expected`: Hand inputs when none are given.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanArmPrior.PRIOR, AutoMovieHumanHandForm.prior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `arm`, `hand`, `expected`; callers supply the complete record.
