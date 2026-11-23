# src/planAutoMovieChromiumLaunch.ts#planAutoMovieChromiumLaunch

## @evidence contracts/development/common.md#meaningful-documentation

Tabulates each backend's switches and name and states where the executable comes from.

## @evidence contracts/development/implementation.md#principled-implementation

Chromium's SwiftShader documentation selects the software backend through ANGLE with exactly these two switches, and Playwright already adds `--enable-unsafe-swiftshader`; `--use-angle=default` lets ANGLE pick the platform's GPU backend, such as Direct3D 11 on Windows, and the blocklist switch keeps a headless browser from refusing it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table lookup and one environment read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No backend is chosen from the machine; the caller states it, and the record names what the browser reported.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure mapping.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh arrays and keeps nothing.
