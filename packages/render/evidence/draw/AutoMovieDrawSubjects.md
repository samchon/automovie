# src/draw/AutoMovieDrawSubjects.ts#AutoMovieDrawSubjects

## @evidence contracts/development/design.md#principled-representation

A function of the injected props, because some subjects exist only once the host hands over their data; the result is a plain record so the page can list every name it offers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `installAutoMovieDraw` once per page; the props stay `unknown` because only the module that reads them knows their shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No subject kind is named; a module validates its own props.

## @evidence contracts/development/common.md#meaningful-documentation

States what the props are, who reads them, what the names choose, and shows a production's form.
