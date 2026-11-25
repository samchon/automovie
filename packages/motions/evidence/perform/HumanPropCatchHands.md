# src/perform/HumanPropCatchHands.ts#HumanPropCatchHands.IApproach

## @evidence contracts/development/common.md#meaningful-documentation

Fields identify one performer, one hand and the film-time bounds of its fitted approach.

## @evidence contracts/development/design.md#principled-representation

A later grip closes a bounded part of the launch on the same film clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Sweep reads only subject, side and time bounds; the capture the range comes from remains with the flight owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No approach hides any non-hand bone or applies to another flight.

# src/perform/HumanPropCatchHands.ts#HumanPropCatchHands.forLaunch

## @evidence contracts/development/common.md#meaningful-documentation

Receives a tagged launch and its final capture time in film seconds, and returns the owned handedness and approach ranges.

## @evidence contracts/development/implementation.md#principled-implementation

Requires an opted-in spherical launch and matches each grip by exact launch identity and closure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Rejects absent captures before filtering and projecting the matching grips.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Later grips or captures of another launch never affect the returned collision domain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits each prop grip once and allocates records only for selected approaches.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Consumes the already resolved grip records without replanning their poses.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new list of small records without retaining the supplied grips.

# src/perform/HumanPropCatchHands.ts#HumanPropCatchHands.omit

## @evidence contracts/development/common.md#meaningful-documentation

Mutates and returns the caller's fresh bones, for one person's capture windows and film second.

## @evidence contracts/development/implementation.md#principled-implementation

Removes the hand and fingers on the named side inside its approach window.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Tests each before-and-after bound before visiting the map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves forearms, other body parts and all frames outside the approach window.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits the map only for active hand windows, at most once per active receiving hand.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the already computed fresh bone map without allocating independent placement or pose snapshots.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no bones, schedules or query state.

# src/perform/HumanPropCatchHands.ts#HumanPropCatchHands.closes

## @evidence contracts/development/common.md#meaningful-documentation

Reads the reserved hand's actual contact with the displayed spherical prop, allowing one micrometre of numerical error.

## @evidence contracts/development/implementation.md#principled-implementation

Converts the displayed prop frame to its sphere centre and tests the named hand body's signed distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Skips legacy grips, reads the one actual hand and checks the contact geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing fitted or profiled hands cannot satisfy a reserved capture. Fingers can enter before closure, yet the hand body must meet the sphere.

## @evidence contracts/development/implementation.md#efficient-algorithms

Requests one hand's skeletal output and restricts the final signed-distance query to that bone.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the existing forward-kinematics and collider distance owners for the fitted body.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All projection inputs release on return and only the closure verdict escapes.
