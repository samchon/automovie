# src/index.ts#subsurfaceTable

## @evidence contracts/development/implementation.md#principled-implementation

Weighted circular clamped-cosine quadrature samples blur over [0,pi] and cosine over [-1,1]; normalized discrete weights preserve a bounded response, with finite-grid/quadrature/wrap truncation error.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A pure numerical producer returns a fresh table; getSubsurfaceTexture alone owns first-use caching and half-float packing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The grid and integration steps are declared sampling conventions, not fixture-fitted values; no source citation is asserted as read, and exact continuous mean or anatomical response is not certified.

## @evidence contracts/development/common.md#meaningful-documentation

Documents grid axes, zero-blur branch, midpoint/wrap approximation and separation from cached texture lifetime.

## @evidence contracts/development/implementation.md#efficient-algorithms

For B blur rows, C cosine samples, S=720 angular samples and W=5 wraps, work is O(B*C*S*W) and returned storage O(B*C); each finite sum is needed for this selected quadrature.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every direct call recomputes fresh rows; material consumers share completed packed data only through getSubsurfaceTexture, so this function itself is not cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only returned numeric arrays survive the call; it acquires no native handle and the texture owner controls any later retained CPU/GPU population.
