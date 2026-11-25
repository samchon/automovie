# src/motion/human/perform/IAutoMovieMotionHumanPropFlight.ts#IAutoMovieMotionHumanPropFlight.IFlight

## @evidence contracts/development/common.md#meaningful-documentation

States film-absolute launch/end times, launch-relative projectile/leg clocks, source action, optional collision and capture, and Infinity when there is no collision.

## @evidence contracts/development/design.md#principled-representation

Reuses the engine projectile and continuation legs; optional contact records a collision, while capturedAt records custody independently. SupersededAt records when another grip or launch takes ownership. An open ballistic leg is unended only if it still owns the prop at film end.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Frame and hit readers consume the launch, source, projectile, end, contact, capture and continuation legs emitted by this owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Stores neither sampled frames nor a second ballistic law; source/published records are borrowed from the planned performance and returned flight records are not deeply frozen.

# src/motion/human/perform/IAutoMovieMotionHumanPropFlight.ts#IAutoMovieMotionHumanPropFlight.IContact

## @evidence contracts/development/common.md#meaningful-documentation

Names world-metre point/normal and incoming velocity, the carrier-relative resting offset and the declared contact outcome.

## @evidence contracts/development/design.md#principled-representation

Keeps the observed world contact separate from the prop's embedded or unembedded offset in the struck carrier's frame; supported target and outcome unions constrain their alternatives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Flight frames use the target/offset, while hit records read the geometry, velocity and outcome.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Contact data does not claim a calibrated moving-surface impulse or a coupled rigid-body solve; the existing continuation uses its fixed-surface response approximation.

# src/motion/human/perform/IAutoMovieMotionHumanPropFlight.ts#IAutoMovieMotionHumanPropFlight.Struck

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes a person's canonical bone, a prop subject and the world ground; identities refer to the placed performance.

## @evidence contracts/development/design.md#principled-representation

A closed discriminated union keeps the carrier facts required by each target kind; runtime performance readers establish that the subject and bone exist.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sweep produces these targets and contact settlement/frame readers consume every variant.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No material, response or actor identity is inferred from the subject string; each variant carries only its carrier identity.
