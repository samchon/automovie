# src/human/generation/IAutoMovieHumanLimbSources.ts#IAutoMovieHumanLimbSources

## @evidence contracts/development/common.md#meaningful-documentation

Side-specific arm and leg source requests over shared resolved measures and direct rest definitions. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IOutput, IInput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IOutput, IInput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanLimbSources exchanges the named IOutput, IInput contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanLimbSources.ts#IAutoMovieHumanLimbSources.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Source requests, with no implicit opposite-side or parent preparation.

## @evidence contracts/development/design.md#principled-representation

Source requests, with no implicit opposite-side or parent preparation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLimbSources.create. Also types AutoMovieHumanBodyLaneInterim.own, AutoMovieHumanBodySources.limbs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyLaneInterim.own, AutoMovieHumanBodySources.limbs, AutoMovieHumanBodySources.limbSources, AutoMovieHumanLimbSources.create for source requests, with no implicit opposite-side or parent preparation.

# src/human/generation/IAutoMovieHumanLimbSources.ts#IAutoMovieHumanLimbSources.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Same public dimensions and direct rest definitions as production.

## @evidence contracts/development/design.md#principled-representation `rest`: Actual direct numerical rest owner, without whole bind publication. `measures`: Resolved public measures; no geometry is acquired to obtain them. `arms`: Public arm and hand dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLimbSources.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `completeLeg`: Complete the genuine coupled parent only at its explicit full demand.
