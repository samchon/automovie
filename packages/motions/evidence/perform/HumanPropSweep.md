# src/perform/HumanPropSweep.ts#HumanPropSweep.sweep

## @evidence contracts/development/common.md#meaningful-documentation

States film/flight clocks, the launcher and pass exclusions, support departure and rebound opt-in, physical certificate scope, first meeting and finite-horizon sweep.

## @evidence contracts/development/implementation.md#principled-implementation

Builds the ground plane and displayed person/prop nearest queries, including the spherical radius in the stature rejection. A staged receive excludes only its assigned hand and fingers during its fitted approach, with actual closure checked separately. Likewise a later launch that ends the flight owns its meeting from its action's start: the props its performer holds at that launch are absent from then on, while before it they remain colliders. The engine still resolves all other surface contacts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This bridge owns performance-to-collider projection and target identity; closest geometry, departure proof, scan and TOI bisections remain with their owning engine modules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no bounce blacklist, time epsilon or fabricated gap; a handed-back prop reads as absent (an infinite gap) only inside its launch's fitted approach, as leaving it out would, since the collider list is fixed for one resolver call. The existing policy omits every prop with any published launch and ignores finger thickness; the stature rejection assumes the body fits that bound, and the scan's stated thin-contact blind spot remains.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparing P props repeats their action-segment/launch scans and scans profile shapes; C collider closures feed the engine's contact queries, whose cost also includes dynamic FK/nearest-body reads. The engine owns step/bisection cost; this method claims no measured speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each person keeps fixed FK prerequisites only. Props use their exact current carrier. The sweep constructs full contact witnesses only for the chosen impact.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Collider/shape arrays and their performance-capturing callbacks are call-local and released after the sweep or refusal; only the small meeting escapes, with no retained frame history, host or new cache.

# src/perform/HumanPropSweep.ts#HumanPropSweep.IHandback

## @evidence contracts/development/common.md#meaningful-documentation

States the performer, the launch's film second and the start of its fitted approach.

## @evidence contracts/development/design.md#principled-representation

One performer subject and two film seconds, the approach start no later than the launch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by HumanPropFlight from the next published launch and read only by this sweep.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Names no prop: the held props are read from the performance's grips at the launch, as the launcher's own are.
