# src/pose/IAutoMovieResolveBalanceOutcome.ts#IAutoMovieResolveBalanceOutcome.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States world impulse/COM data, capture-step timing and optional application point/gravity defaults.

## @evidence contracts/development/design.md#principled-representation

Metres, kg, m/s and N s form an inverted-pendulum capture request; length/reach/margin and second-based step timing require admissible scalar values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieBalanceOutcome uses the shared centre-of-mass and capture-step mathematics; the caller owns the body's measured support points.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The model predicts absorb/step/fall under its pendulum assumptions, not a solved physical landing; missing at places the impulse at COM.

# src/pose/IAutoMovieResolveBalanceOutcome.ts#IAutoMovieResolveBalanceOutcome.IBounds

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the push magnitudes separating absorption from stepping and recoverability from falling.

## @evidence contracts/development/design.md#principled-representation

Both thresholds are N s along the supplied push direction, rather than positions or elapsed time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieBalanceOutcome returns these bounds with its capture prediction for impact and motion consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The thresholds belong to the stated support/capture model and cannot certify a native simulation outcome.

# src/pose/IAutoMovieResolveBalanceOutcome.ts#IAutoMovieResolveBalanceOutcome.IOutcome

## @evidence contracts/development/common.md#meaningful-documentation

Separates predicted outcome, post-impulse momentum and proposed landing positions.

## @evidence contracts/development/design.md#principled-representation

The literal outcome accompanies world m/s velocity, kg m²/s angular change, world-metre extrapolated COM and ordered capture steps.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieBalanceOutcome allocates the prediction for callers that author or inspect an impact response.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Steps are empty for absorb/fall by producer convention; the interface permits ordinary mutable arrays and does not encode successful measured landings.
