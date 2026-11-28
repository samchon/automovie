# src/draw/IAutoMovieRenderDrawGlobal.ts#IAutoMovieRenderDrawGlobal

## @evidence contracts/development/common.md#meaningful-documentation

The interface documents the two host and page slots, when they become available and how an event-capable host releases the page.

## @evidence contracts/development/design.md#principled-representation

The props and draw function slots can initially be absent because injection and installation occur separately. The event callback shape is optional for hosts without page events.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The draw installer reads the props slot and installs the shared function. The separate ambient declaration admits the same keys on `globalThis`.
