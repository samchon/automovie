# src/vehicles/CartFit.ts#CartFit

## @evidence contracts/development/common.md#meaningful-documentation

States what fits a cart to its horse and why it is its own file.

## @evidence contracts/development/design.md#principled-representation

Two steps of the cart's draw: the models a fixed horse admits, and the dimensions the drawn horse gives.

## @evidence contracts/development/design.md#minimal-and-owned-surface `models` and `harness`, which `createCart` calls for a horse's cart, and `lines`, which `createCart.lines` gives the towing ride.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The horse's sizes come from `createHorse` itself, never a copy.

# src/vehicles/CartFit.ts#CartFit.models

## @evidence contracts/development/common.md#meaningful-documentation

States which models it keeps and when it keeps them all.

## @evidence contracts/development/implementation.md#principled-implementation

A model without a read range of horses is made for every horse; one with a range keeps the fixed height inside it. A fixed clearance sets the shafts' length, so it keeps only the models whose shafts are not read, which derive their shafts from it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter over the kind's models, by the fixed withers height and the fixed clearance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: every model is kept or left by its read range and whether its shafts are read.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over a handful of models.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call filters one kind's models.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/vehicles/CartFit.ts#CartFit.harness

## @evidence contracts/development/common.md#meaningful-documentation

States what is derived and from what, and when a fixed clearance is refused.

## @evidence contracts/development/implementation.md#principled-implementation

The girth from the horse's own profile at the drawn height, and the shafts from the horse's rig, its point of shoulder to its point of buttock and the drawn or fixed clearance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The girth, then the shafts where none were read; where they were read, a fixed clearance is refused.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Read shafts are kept, never replaced by the derived length, and a clearance the author fixed on such a cart is refused naming the models that take it, never ignored in silence, as the draw session refuses a fixed figure of a read model.

## @evidence contracts/development/implementation.md#efficient-algorithms

One rig.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call fits one cart.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/vehicles/CartFit.ts#CartFit.lines

## @evidence contracts/development/common.md#meaningful-documentation

States the four lines, where each runs and when it refuses.

## @evidence contracts/development/implementation.md#principled-implementation

Each trace goes from the collar's point of draft to the single tree at the horse's draft spread. Each driving line runs through the bit ring, the neck strap's ring and the terret to the material end behind the modeled hand station, or to the driver's displayed palm when a hand reader is given.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Refuse a cart without lines, then the traces, then the driving lines.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The lines are straight runs between their points, the ride's to lay.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four lines of a few points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call lays one cart's lines.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
