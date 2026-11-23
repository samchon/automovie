# src/authoring/IAutoMovieBlocking.ts#IAutoMovieBlocking

## @evidence contracts/development/design.md#principled-representation

blockBeat checks beat and placed-node membership, positive finite duration, anchor ranges/order and hero/coverage framing vocabulary. performShot compares beat, duration within 1e-6 s, non-frame actor-action coverage within 1e-9 s and the earliest chronological frame's framing/move; camera election instead follows the first frame camera in authored list order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record holds the beat-level plan, with per-actor intent, the hero camera and each alternate take as their own types, so the gates that read each part own its rules and the review prose sits beside the facts it explains.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `analysis` and `rationale` are documented as unchecked prose rather than given a fake verifier, and a `static` hero intent accepting no `frame` action is the documented locked-off case, not an exemption for a fixture.

## @evidence contracts/development/common.md#meaningful-documentation

States which gate checks each field, that the prose fields are never read, the hero camera's comparison rule and its static case, the coverage camera distinctness rule, and the duration unit and matching tolerance.
