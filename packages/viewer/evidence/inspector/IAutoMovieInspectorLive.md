# src/inspector/IAutoMovieInspectorLive.ts#IAutoMovieInspectorLive

## @evidence contracts/development/design.md#principled-representation

The subject, the resources it is drawn with, the inspection in force and the frame loop's state, which the mount and its helpers share once the subject is ready.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mount owns it; only the inspector's own helpers read or write it, and it is not exported from the package.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is state the loop needs; no derived value is cached.

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds and when it changes.