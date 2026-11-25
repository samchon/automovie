# src/human/generation/head/IAutoMovieHumanHeadEarRidge.ts#IAutoMovieHumanHeadEarRidge.IRidge

## @evidence contracts/development/common.md#meaningful-documentation

Ridge together with the original coordinate sources its course evaluates.

## @evidence contracts/development/design.md#principled-representation `coordinates`: Original world-mm coordinates in the same physical station clock as axis.at.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadEarRidge.of, AutoMovieHumanHeadEarRidgeAxis.of. Read by AutoMovieHumanHeadEarRidge.port. Also types AutoMovieHumanHeadEarParts.ridge, AutoMovieHumanHeadEarParts.source.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `coordinates`; callers supply the complete record.

# src/human/generation/head/IAutoMovieHumanHeadEarRidge.ts#IAutoMovieHumanHeadEarRidge.IPort

## @evidence contracts/development/common.md#meaningful-documentation

A regular fork's complete original source, frame and available local derivatives.

## @evidence contracts/development/design.md#principled-representation `site`: Shared anatomical source site. `owner`: Actual generating ridge, in calibration mm. `station`: Actual regular station on that original ridge, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadEarRidge.port. Read by AutoMovieHumanHeadEarRidge.extension. Also types AutoMovieHumanHeadEarParts.junction, AutoMovieHumanHeadEarRidge.port.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `site`, `owner`, `station`, `source`, `inputs`, `jets`, `jetFailure`, `frame`, `originJet`, `phase`; callers supply the complete record.

# src/human/generation/head/IAutoMovieHumanHeadEarRidge.ts#IAutoMovieHumanHeadEarRidge.IPorts

## @evidence contracts/development/common.md#meaningful-documentation

A local named port or a borrowed complete parent port.

## @evidence contracts/development/design.md#principled-representation `start`: Source start's regular fork, before its hidden closing pole. `end`: Source end's regular fork, before its hidden closing pole.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadEarRidge.of, AutoMovieHumanHeadEarRidgeAxis.of. Also types AutoMovieHumanHeadEarParts.ridge.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `start`: Source start's regular fork, before its hidden closing pole. `end`: Source end's regular fork, before its hidden closing pole.
