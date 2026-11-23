# src/production/IAutoMovieCompiledEffect.ts#IAutoMovieCompiledEffect

## @evidence contracts/development/design.md#principled-representation

A protocol-derived seed, copied recipe and emitter bounds, half-open cue window and fixed simulation step define a repeatable stream; its digest hashes every other field through canonical JSON and pure SHA-256.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The compiled record resolves recipe and zone references once and carries the inputs needed by both visual sampling and numerical effect queries, leaving film-global ownership to its separate envelope.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The stream carries copied recipe and bounds rather than consulting mutable world data. Shot materialization drops unresolved references unless a host separately validates them; film materialization explicitly refuses them. Sampling assumes admitted recipe ranges and step and does not authenticate this record's digest itself.

## @evidence contracts/development/common.md#meaningful-documentation

Gives recipe and zone authority, world bounds, deterministic seed, half-open second interval, intensity envelope, optional event binding, fixed step and digest coverage.
