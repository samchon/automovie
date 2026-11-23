# src/animals/AutoMovieArchetypeEquineGait.ts#AutoMovieArchetypeEquineGait

## @evidence contracts/development/common.md#meaningful-documentation

States the source of every number, the population it measured and the known gap to a larger horse.

## @evidence contracts/development/design.md#principled-representation

Measured rows by gait and speed, one landing phase per hoof per gait, and the ride's ranges, each in its source's own variables, gathered into one `AutoMovieArchetypeQuadrupedGait.ITable`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The horse's gait data; the timing, the change points and the pose that read it are the shared quadruped's (`AutoMovieArchetypeQuadrupedGait`, `QuadrupedChange`, `rideQuadruped`).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No fitted curve stands in for the rows; a value one gait borrows from another, and every estimate, says so.

# src/animals/AutoMovieArchetypeEquineGait.ts#AutoMovieArchetypeEquineGait.Gait

## @evidence contracts/development/common.md#meaningful-documentation

Names the measured horse subset independently of other species' gait vocabulary.

## @evidence contracts/development/design.md#principled-representation

The existing four closed literals describe exactly the horse rows and phase data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Horse data excludes the camel's pace without narrowing the shared quadruped grammar.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Adding a gait to another species cannot invent an unmeasured horse row.
