# src/validation/IAutoMovieDetectBodyCollision.ts#IAutoMovieDetectBodyCollision

## @evidence contracts/development/common.md#meaningful-documentation

Pairwise capsule sampling inputs for body-contact advice. Nested contracts define the relevant units, ownership and failure states.

## @evidence contracts/development/design.md#principled-representation

Canonical actors combine compatible geometric frames with sample frequency and response gain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The detector consumes one pair and returns canonical contact/advice records without a physics world.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sampled penetration and a heuristic response are not continuous collision or installed motion guarantees.

# src/validation/IAutoMovieDetectBodyCollision.ts#IAutoMovieDetectBodyCollision.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Defines sampling clock, contact predicate, defaults, response-only admission and failure/ownership behavior.

## @evidence contracts/development/design.md#principled-representation

Canonical actors carry skeleton, motion and capsule geometry in compatible frames; rates are samples per second and response gain is degrees per impulse.

## @evidence contracts/development/design.md#minimal-and-owned-surface

detectBodyCollision joins existing actor/contact/response contracts; no native physics world or installed film collision host is represented.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sampling is not continuous collision proof, and response velocity uses nominal rate even at a truncated last interval; absent body parameters are never invented.
