# src/validation/validateFootSkate.ts#validateFootSkate

## @evidence contracts/development/implementation.md#principled-implementation

Sample admitted contact windows, resolve FK and warn when adjacent foot XZ displacement divided by elapsed seconds exceeds the declared speed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared window clock and reachability prevent missing FK lookups and mismatched physics sample times.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

physicsIntent suppresses skate warnings only; finite positive rate and valid reachable bone/window/speed remain mandatory errors.

## @evidence contracts/development/common.md#meaningful-documentation

Defaults24Hz and0.02m/s, contact-local sample paths and advisory behavior are stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

T samples pay motion/FK plus one bone find each; stored samples use O(T) space per contact.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Topology/reachability are computed once for the invocation, not again for every window.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Sample arrays release per contact; returned warnings grow with violations and retain no playback or solver handle.
