# src/gym/createKettlebell.ts#createKettlebell

## @evidence contracts/development/implementation.md#principled-implementation

A ball of the body's diameter on the floor, the handle's bar at the bell's height less half its own thickness, and an upright from each end of the bar down to the ball.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, one ball, three rods, one contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Straight uprights stand for the handle's curved horns, the base is not flattened, and the mass is spread over the shapes by volume though the handle is hollow or thin.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four shapes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how it stands, what it is built of, why the mass leaves the shape alone and the contact.
