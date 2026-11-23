# src/model/import/IAutoMovieExternalModelInspection.ts#IAutoMovieExternalModelInspection

## @evidence contracts/development/design.md#principled-representation

The record reports only facts read from the declared JSON and checked against resident bytes: counts of the top-level arrays, the extension union, sidecar URIs, profile-proved humanoid slots with weight usage, and motion takes when the motion profile ran.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One inspection result serves every profile, with humanoidBones empty and motion absent where a profile does not compute them; adoption and inspection tests read this common report.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `format` is a family label: a `.vrm` suffix or declared VRM extension produces `vrm`, while `vrm-humanoid-v1` separately checks VRM metadata; the label alone certifies no rig.

## @evidence contracts/development/common.md#meaningful-documentation

The comments state why inspection is synchronous, that hosts still load the render mesh themselves, how `format` is decided, the order of `extensions` and `resources`, how each profile fills `humanoidBones`, and when `motion` is present.

# src/model/import/IAutoMovieExternalModelInspection.ts#IAutoMovieExternalModelInspection.IProps

## @evidence contracts/development/design.md#principled-representation

Container bytes and URI resolution share one synchronous lifetime; profile strings remain open so the runtime guard can diagnose unsupported selections.

## @evidence contracts/development/design.md#minimal-and-owned-surface

These are the four arguments the byte inspector reads; hosts own filesystem and asset-namespace policy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default profile, asynchronous fetch, fallback bytes or inferred container convention is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

States suffix selection, borrowed lifetimes, absent resolver behavior, callback frequency and error propagation.
