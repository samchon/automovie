# src/render/capture/IAutoMovieRunCaptureProps.ts#IAutoMovieRunCaptureProps

## @evidence contracts/development/design.md#principled-representation

Storage and publication failures reject the run; optional video/section values become null in the record when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

runAutoMovieCapture exchanges plan, draw, folder, revision, match, video, section; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Storage and publication failures reject the run; optional video/section values become null in the record when absent.

## @evidence contracts/development/common.md#meaningful-documentation

An admitted capture plan and effectful host ports. runAutoMovieCapture checks the folder round identities, awaits one draw per cell, records draw/raster failures as failed rows, and publishes the complete record after still/sheet/comparison writes. The prose and members document how runAutoMovieCapture interprets and admits these values.
