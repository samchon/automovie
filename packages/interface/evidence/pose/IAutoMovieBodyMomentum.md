# src/pose/IAutoMovieBodyMomentum.ts#IAutoMovieBodyMomentum

## @evidence contracts/development/common.md#meaningful-documentation

Explains midpoint COM, interval velocity and both linear/angular momentum units.

## @evidence contracts/development/design.md#principled-representation

World-metre centre and m/s velocity accompany kg m/s linear and kg m²/s angular momentum about the midpoint COM.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieMomentum derives these values from the shared mass model and two resolved poses over a supplied interval.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This is an interval measurement; it does not integrate a trajectory or establish a physical conservation result from authored motion.
