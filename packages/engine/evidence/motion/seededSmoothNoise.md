# src/motion/seededSmoothNoise.ts#seededSmoothNoise

## @evidence contracts/development/implementation.md#principled-implementation

A seeded sum of sines (Perlin and Goldberg 1996) under a polynomial window whose derivatives vanish at the ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Direct and explicitly prepared reads share parameter admission, one sine-term formula and the polynomial window. The prepared reader owns only its fixed numeric spectrum; the direct path draws each term in its original order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-positive durations, frequencies or term counts throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Direct reads take O(T) time and constant auxiliary storage for T terms. Explicit preparation is constant until its first interior read, which draws and stores O(T) coefficients; subsequent reads retain the original T sine evaluations without repeated indexed random draws or fixed frequency/phase products.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

IAutoMovieRandom is a pure counter-based stream, so fixed stream indices and copied duration/frequency/term parameters define one spectrum. prepare snapshots those exact coefficients lazily; direct reads stay independent and every requested time evaluates its actual sine/window values without quantization or a result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Direct reads retain nothing. One returned prepared reader owns its stream reference and at most two T-element numeric arrays plus a normalizer until the owning action releases it; no queried times, outputs, body, process or handle are retained.

## @evidence contracts/development/common.md#meaningful-documentation

Cites the construction, states the window's boundary property, the draw indices and the value range.
