# src/motion/human/perform/AutoMovieHumanForceSite.ts#AutoMovieHumanForceSite

## @evidence contracts/development/common.md#meaningful-documentation

A force application site on a person: a humanoid surface region or a point in a named bone's local frame, measured in metres.

## @evidence contracts/development/design.md#principled-representation

bone: Bone carrying the force application point. point: Force application point in that bone's local frame, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanForceExchange, HumanForceThrow and hit conversion share one anatomical application-site meaning; the point alternative reuses canonical humanoid bones and vectors.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The closed region alternative is distinct from the bone-local metre point. Runtime site resolution owns translating either form to the posed body's world frame.
