# src/measureAutoMovieGeometryCamera.ts#measureAutoMovieGeometryCamera

## @evidence contracts/development/implementation.md#principled-implementation

Uses the current compiled camera, canonical projection helper and exact composed actor root positions, testing inclusive near/far depth and NDC [-1,1] bounds; root-point visibility does not measure body coverage or occlusion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The camera branch owns query admission and count aggregation while camera sampling, actor root placement and NDC projection stay in shared helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing shot/contract/camera/production, invalid time and empty/duplicate subjects refuse; absent nodes are counted as missing and a fully missing set reports margin -1 explicitly.

## @evidence contracts/development/common.md#meaningful-documentation

States root-point scope, shot-local time, crop-aware projection and absence of occlusion measurement.

## @evidence contracts/development/implementation.md#efficient-algorithms

Camera lookup and per-subject actor lookup/sampling dominate cost; projection/count filters are linear in subjects, and minimum margin uses a reduction without argument-spread limits.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One camera sample and one per-subject projection serve depth, frame and margin results; no cross-call cache assumes scene or camera motion is unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local projection arrays scale with requested subjects and are released after completion; output has scalar counts/margins and acquires no renderer or GPU handle.
