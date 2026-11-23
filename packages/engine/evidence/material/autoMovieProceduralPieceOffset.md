# src/material/autoMovieProceduralPieceOffset.ts#autoMovieProceduralPieceOffset

## @evidence contracts/development/common.md#meaningful-documentation

States the id hash with its constants' origin, the span, its reason and that face pieces add nothing.

## @evidence contracts/development/implementation.md#principled-implementation

FNV-1a turns the id into one word, and PCG3D of the seed and that word gives three uniform words; a span of 64 feature sizes reaches unrelated parts of every pattern while coordinates stay small for 32-bit shading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the offset; the CPU sampler and the renderer's uniform both call it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The span is a stated design bound, not a fitted value; no id is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the id length, one hash.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The renderer computes it once per material.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
