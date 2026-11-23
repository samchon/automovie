# src/skeleton/AutoMovieHumanoidSocket.ts#AutoMovieHumanoidSocket

## @evidence contracts/development/common.md#meaningful-documentation

Gives each socket's place, normal and forward direction and what the body does there.

## @evidence contracts/development/design.md#principled-representation

Contact frames where the body itself touches, holds or bears weight, a point with a normal and a forward direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Names only; the engine resolves each frame from the body's profile.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed union separate from the struck regions, instead of overloading region names with frames.
