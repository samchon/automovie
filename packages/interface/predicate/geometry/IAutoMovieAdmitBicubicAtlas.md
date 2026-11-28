# src/geometry/IAutoMovieAdmitBicubicAtlas.ts#IAutoMovieAdmitBicubicAtlas.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result describes original patch and control ordinals, separate structural and source-fit diagnostics, and borrowed canonical declarations.

## @evidence contracts/development/design.md#principled-representation

The model selector admits a finite represented tolerance and safe work limits before reading local patch data. It removes patches incident on invalid converted coefficients, control addresses or bindings. Independent patches retain their original ordinals, and source-fit diagnostics do not suppress them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result selects references rather than copying coefficients or generated geometry. Used authorities and bindings retain original object identity.

# src/geometry/IAutoMovieAdmitBicubicAtlas.ts#IAutoMovieAdmitBicubicAtlas.IResult.patches

## @evidence contracts/development/common.md#meaningful-documentation

The new list gives retained recipe patch ordinals in original declaration order.

# src/geometry/IAutoMovieAdmitBicubicAtlas.ts#IAutoMovieAdmitBicubicAtlas.IResult.controls

## @evidence contracts/development/common.md#meaningful-documentation

The new sorted list gives unique retained control references across selected patches and authorities.

# src/geometry/IAutoMovieAdmitBicubicAtlas.ts#IAutoMovieAdmitBicubicAtlas.IResult.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

The new list preserves recognized local omissions and source-fit qualifications in observation order.

# src/geometry/IAutoMovieAdmitBicubicAtlas.ts#IAutoMovieAdmitBicubicAtlas.IResult.boundaryAuthorities

## @evidence contracts/development/common.md#meaningful-documentation

The new list contains only authorities used by retained bindings and borrows each declaration.

# src/geometry/IAutoMovieAdmitBicubicAtlas.ts#IAutoMovieAdmitBicubicAtlas.IResult.boundaryBindings

## @evidence contracts/development/common.md#meaningful-documentation

The new list contains admitted bindings incident on retained patches and borrows each binding record.
