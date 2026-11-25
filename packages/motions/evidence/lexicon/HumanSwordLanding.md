# src/lexicon/HumanSwordLanding.ts#HumanSwordLanding.frame

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result; the namespace states the order.

## @evidence contracts/development/implementation.md#principled-implementation

Every candidate keeps the landing part on the target and the edge along the travel (`StrikingHeld.hand`); the arm's fit chooses among them and refines the lean and the turn between them (`StrikingRoll.chosen`), so the ranges of the shoulder, the forearm and the wrist decide.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Candidates on the line first, then the turned ones by strain, then one choice.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The turns and leans are a stated search resolution; the cut's refusal still judges the chosen pose.

## @evidence contracts/development/implementation.md#efficient-algorithms

The candidates are a fixed grid (`TURNS` by `LEANS` on the line; the leans by the cone's tilts, eight directions and the rolls off it), each ranked by its closed-form strain; `StrikingRoll.chosen` fits the arm only to the ranked ones it tries, at most `StrikingRoll.TRIED` off the line.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each candidate frame is built from the props as given and ranked once; the arm's fits are `StrikingRoll.chosen`'s.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The candidate arrays end with the call; only the chosen hand frame is returned.
