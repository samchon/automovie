# src/material/autoMoviePcg3d.ts#autoMoviePcg3d

## @evidence contracts/development/common.md#meaningful-documentation

The doc comment cites the hash, states the constants' origin, the word ranges and why CPU and GPU agree.

## @evidence contracts/development/implementation.md#principled-implementation

PCG3D as published by Jarzynski and Olano (2020): an LCG step per word, two rounds of cross products with a shift-xor between. `Math.imul` and `>>> 0` keep every product and sum exact modulo 2³², as GLSL `uint` arithmetic is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the hash; the lattice hash, the noise, the cells and the piece offset call it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The multiplier and increment are the published ones; nothing is tuned.

## @evidence contracts/development/implementation.md#efficient-algorithms

Twelve integer operations per call, no allocation beyond the returned tuple.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
