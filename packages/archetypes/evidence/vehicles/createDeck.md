# src/vehicles/createDeck.ts#createDeck

## @evidence contracts/development/implementation.md#principled-implementation

Every guardrail size is ISO 5480's, single figures at its limits; the stanchions the fewest bays inside the spacing, the lower rails the fewest courses inside the openings, both derived from the drawn bounds and the site's length; the mass is steel's density times the parts' volumes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, admit the site, lay out the stanchions and the courses, the plate, each side's guardrail, then the contacts and the mass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The plate's thickness is a construction estimate after a recorded search; the taper, sheer, camber, stays and brackets are not modelled.

## @evidence contracts/development/implementation.md#efficient-algorithms

One box per stanchion and one rod per course per side.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States what the stretch is, which dimensions are the site's, how the guardrails are laid out, what is not modelled, its axes and contacts, and how it floats and carries.
