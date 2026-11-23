# src/core/AutoMovieNodeKind.ts#AutoMovieNodeKind

## @evidence contracts/development/design.md#principled-representation

Follows the glTF node model, where a node is a transform that may reference one payload, and `sceneToNodes` and `lowerSkeletonNodes` write the kind that matches the payload they lower.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed literal union labels the node for readers while the payload id fields carry the actual reference, so grouping and hierarchy need no type beyond the node itself.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No reader infers behaviour from the tag in place of the payload field; the remaining gap is that a tag contradicting its payload ids is not refused, which the documentation states.

## @evidence contracts/development/common.md#meaningful-documentation

States that every node is a transform, how a group expresses hierarchy and range of motion, and that the tag is descriptive and unchecked against the payload fields.
