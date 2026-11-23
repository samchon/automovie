# src/reaction/staggerPendulumCourses.ts#staggerPendulumCourses

## @evidence contracts/development/common.md#meaningful-documentation

States the phase order premise, common clock, frequency, world centre and the outputs.

## @evidence contracts/development/implementation.md#principled-implementation

Selects the last span starting at or before the second, the first before every start, and evaluates the closed-form held-pressure pendulum: x - p as cosh/sinh, xi - p growing as exp(omega t).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One span selector and three formulas.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every span is the pendulum's own; no sample, table or time memo replaces the formulas.

## @evidence contracts/development/implementation.md#efficient-algorithms

A binary search over P spans per read, O(log P), valid because the pendulum appends spans at its advancing clock; equal starts resolve to the last, as a linear scan of the latest would.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each read computes from the retained span records; nothing is cached by time.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned readers retain the span array, centre and frequency until their owning recovery releases them; each result is fresh.
