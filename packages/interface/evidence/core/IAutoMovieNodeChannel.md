# src/core/IAutoMovieNodeChannel.ts#IAutoMovieNodeChannel

## @evidence contracts/development/design.md#principled-representation

channelKey refuses unknown node paths and builds a namespace disjoint from pointer keys; channelValueWidth supplies translation/rotation/scale widths of 3/4/3. channelIsRotation selects quaternion interpolation, but track shape admission does not check unit authored values or separately gate interpolated numeric results.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The address is the node id plus a closed path union, so the value shape follows from the path and needs no separate value-type field, unlike the pointer arm that names an arbitrary property.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The unknown morph-target count of a `weights` channel is stated as unchecked instead of guessed, and a channel naming a node absent from the frame throws rather than being skipped.

## @evidence contracts/development/common.md#meaningful-documentation

States the width and value order of every path, the slerp and renormalization of rotations, the key format, the missing-node failure, and when `node` is a semantic key mapped by a profile binding.
