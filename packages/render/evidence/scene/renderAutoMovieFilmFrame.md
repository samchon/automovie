# src/scene/renderAutoMovieFilmFrame.ts#renderAutoMovieFilmFrame

## @evidence contracts/development/implementation.md#principled-implementation

Admits sampled one/two-layer beauty composition before callbacks, dispatches direct/fade/dissolve beauty, hands `transparent` to the fade so a transparent picture fades toward alpha 0, and uses the Engine full-weight dominant layer with incoming tie winner for structural passes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The optional preparation callback applies each selected source's state immediately before the separate render callback. Canonical pass selection and beauty composition stay with their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid weight/cardinality/complement sum refuse rather than clamp or blend structural classifications; host clock/filename observations do not become deterministic delivered-frame identity.

## @evidence contracts/development/common.md#meaningful-documentation

Documents opaque sampled fields, per-source preparation order, reversible pass ownership, beauty weights, the transparent fade, structural tie rule and pre-effect admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

One/two admitted layers give fixed dispatch work; structural selection clones the selected layer payload and compositor draws/readbacks retain their actual pixel/native costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Canonical selection is reused by guide consumers and renderer-scoped beauty owners reuse their allocated copies; sampled source callbacks still execute for each actual requested frame.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The adapter acquires no scene or renderer; callbacks own reversible state and compositor owners retain/release their native display copies, including terminal failure uncertainty.
