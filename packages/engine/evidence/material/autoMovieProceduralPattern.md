# src/material/autoMovieProceduralPattern.ts#autoMovieProceduralPattern

## @evidence contracts/development/common.md#meaningful-documentation

States every kind's formula, the frame it reads, which constants are definitions rather than fits, and that the renderer evaluates the same expressions.

## @evidence contracts/development/implementation.md#principled-implementation

Plaster and clay are fractal noise; stone is Worley's F2 − F1, zero on joints, mixed with noise; wood is Peachey's ring solid texture with noise-displaced radius; fabric is a plain weave whose top thread alternates by crossing parity, continuous because every switch happens where its thread profile is zero; brushed metal is noise stretched along the axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns every kind's value; colour, roughness and height interpolation stay with the sampler, and the shader mirrors this function per kind.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The stone weights, the wood wander and the thread jitter are fixed definitions of the kinds stated in the contract; none is tuned to a test.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most four noise octaves, or 27 cells plus four octaves for stone, per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
