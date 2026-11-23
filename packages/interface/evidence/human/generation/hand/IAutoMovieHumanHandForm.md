# src/human/generation/hand/IAutoMovieHumanHandForm.ts#IAutoMovieHumanHandForm

## @evidence contracts/development/common.md#meaningful-documentation

The whole hand in its own axes: the heel and palm skin, the thenar joined to the palm's last ring, the digits' laws and the webs that part them, shared by every person and mapped to each by the hand's scales.

## @evidence contracts/development/design.md#principled-representation `whole`: Heel and thenar together, from the forearm to the thumb's branch. `palm`: Palm alone, from the thumb's branch to the knuckles. `opening`: The heel's target skin at a station and phase, the palm's run handing over to the thumb's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHandForm.form, AutoMovieHumanHandForm.make. Read by AutoMovieHumanArmLaw.of, AutoMovieHumanHandFingers.digitsOf, AutoMovieHumanHandJoints.jointsOf. Also types AutoMovieHumanArmConstruction.form, AutoMovieHumanHandConstruction.hand.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `whole`, `palm`, `opening`, `palmRings`, `digits`, `events`, `crests`, `creaseCentre`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandForm.ts#IAutoMovieHumanHandForm.IEvent

## @evidence contracts/development/common.md#meaningful-documentation

A branch at a chain's bottom.

## @evidence contracts/development/design.md#principled-representation `parent`: Parent chain name, `{side}` standing for the side. `splits`: The children's shares of the parent's ring.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandForm.IEvent is the canonical exchange used by AutoMovieHumanHandEvents.events.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `parent`, `splits`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandForm.ts#IAutoMovieHumanHandForm.ISplit

## @evidence contracts/development/common.md#meaningful-documentation

A child's share of a parent's ring.

## @evidence contracts/development/design.md#principled-representation `child`: Child chain name. `arcs`: Its arcs of the parent's ring, as phases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandForm.ISplit is the canonical exchange used by AutoMovieHumanHandEvents.events, AutoMovieHumanHandForm.make.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `child`, `arcs`; callers supply the complete record.
