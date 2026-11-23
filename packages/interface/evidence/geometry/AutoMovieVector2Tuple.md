# src/geometry/AutoMovieVector2Tuple.ts#AutoMovieVector2Tuple

## @evidence contracts/development/design.md#principled-representation

A fixed ordered pair represents Cartesian coordinates without inventing a universal chart or unit; owning fields preserve those physical meanings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared planar geometry and recovery evaluators use one tuple representation with readonly views for borrowed inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Index pairs, parameter intervals and coefficient pairs remain separate despite having two numbers.

## @evidence contracts/development/common.md#meaningful-documentation

States coordinate ordering, field-owned units and frames, mutation ownership and caller admission obligations.
