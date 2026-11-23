# src/capture/diffAutoMovieCaptureFindings.ts#diffAutoMovieCaptureFindings

## @evidence contracts/development/common.md#meaningful-documentation

States the identity, the severity order and its owner, how intervals are read, when coverage counts as checked over an interval, every state, the outcome rule and the omitted case.

## @evidence contracts/development/implementation.md#principled-implementation

An episode keeps its first and worst observations and its last sample, not every sample time, so an identity's intervals are its episodes' spans. A sample holds each identity once within a scope, so the five-field identity pairs findings across rounds. Absence is a fix or a new finding only where the other round checked the obligation over the whole span; consecutive output frames leave no unsampled time, so coverage ranges merge across them, and a gap between samples does not. Severity uses compareAutoMovieInspectionFindings, the order the reducer keeps the worst witness by.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Summarize each round by identity, classify this round's identities and then the earlier-only ones, then read the outcome from the errors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A finding absent because the other round deferred, could not run, excluded or never sampled its obligation is unmatched with that cause, and an unmatched error keeps the round from being better; a record without diagnostics omits the diff instead of reporting an unchanged round.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the episodes of both rounds for the summaries; each lone identity scans its obligation's coverage ranges once and sorts them.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each round's audit is summarized once per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain values and keeps nothing.
