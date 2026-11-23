# src/sport/createPoolEdge.ts#createPoolEdge

## @evidence contracts/development/implementation.md#principled-implementation

The end wall as one block from the deck down to the pool's floor at the rules' least depth, the rest ledge a box on its face at the rules' depth below the water, and a platform as a pedestal set back from the wall under a top slab tilted by the drawn slope, the slab as thick as the 0.04 m FR 2.7 names, its front on the wall's line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, build the wall and the ledge, then the platform when the kind has one.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The water is a contact, not a part; the deck's run behind the edge, the ledge's thickness and the pedestal's recess are named construction estimates (`createPoolEdge.ESTIMATES`), none placing a contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most five parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States where the deck, the wall and the water are, which way a swimmer faces, each contact, and how a ladder and the missing law stand.
