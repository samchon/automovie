# src/production/IAutoMovieStoryInterval.ts#IAutoMovieStoryInterval.IWindow

## @evidence contracts/development/design.md#principled-representation

IWindow endpoints are shot-local seconds; IResult endpoints are story seconds obtained by originSeconds + endpoint * rate, with the pin's default rate of one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

autoMovieStoryInterval maps both endpoints through the shared autoMovieStoryTime owner for story overlap and chronology consumers without involving edit positions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Endpoint inclusion belongs to the criterion using the window; mapping neither rounds, clamps nor reorders. Nonfinite or inverted inputs remain visible for caller validation.

## @evidence contracts/development/common.md#meaningful-documentation

Shot-local window and its affine image on the production story clock. IWindow endpoints are shot-local seconds; IResult endpoints are story seconds obtained by originSeconds + endpoint * rate, with the pin's default rate of one.

# src/production/IAutoMovieStoryInterval.ts#IAutoMovieStoryInterval.IResult

## @evidence contracts/development/design.md#principled-representation

IWindow endpoints are shot-local seconds; IResult endpoints are story seconds obtained by originSeconds + endpoint * rate, with the pin's default rate of one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

autoMovieStoryInterval maps both endpoints through the shared autoMovieStoryTime owner for story overlap and chronology consumers without involving edit positions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Endpoint inclusion belongs to the criterion using the window; mapping neither rounds, clamps nor reorders. Nonfinite or inverted inputs remain visible for caller validation.

## @evidence contracts/development/common.md#meaningful-documentation

Shot-local window and its affine image on the production story clock. IWindow endpoints are shot-local seconds; IResult endpoints are story seconds obtained by originSeconds + endpoint * rate, with the pin's default rate of one.
