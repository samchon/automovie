# src/index.ts#IAutoMovieViewerViewpoint

## @evidence contracts/development/design.md#principled-representation

Angles are subject-relative directions while distance uses the subject box half-diagonal with the framing floor; at least factor one is needed to claim whole-sphere fit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A compact direction record separates planning identity from world-space pose calculation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An id names a planned direction and is not proof of rendering; finite angles, valid bounds/lens and positive distance remain caller premises.

## @evidence contracts/development/common.md#meaningful-documentation

Documents axes, angle units, sphere distance and planning-versus-observation identity.
