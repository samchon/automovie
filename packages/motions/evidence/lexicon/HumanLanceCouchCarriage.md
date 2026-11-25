# src/lexicon/HumanLanceCouchCarriage.ts#HumanLanceCouchCarriage
## @evidence contracts/development/common.md#meaningful-documentation

States the carriage it lays (the hand line continuing the forearm, the elbow one upper arm from the shoulder, the lower of the two), its inputs and its refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Closed form: the forearm at the grasp angle about the shaft solves A cos(phi) + B sin(phi) = C for the elbow one upper arm from the shoulder; of the two roots the lower elbow is taken, the arm hanging from the shoulder; the hand is then turned onto the forearm by the least rotation (`between`) and rolled about it until the shaft runs along the asked direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `HumanLanceCouch` as the one owner of a carriage; the hanging carry and the strike search call it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A grip no elbow reaches is refused on `target` with the arm's reach as the feasible range; nothing is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one trigonometric solve and two rotations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanLanceCouchCarriage.ts#HumanLanceCouchCarriage.ICarriage

## @evidence contracts/development/common.md#meaningful-documentation

States the two members and their frame.

## @evidence contracts/development/design.md#principled-representation

The grip frame and the elbow, seat-frame metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Laid by `HumanLanceCouchCarriage` and read by the lance couch and its searches.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: both members always present.

# src/lexicon/HumanLanceCouchCarriage.ts#HumanLanceCouchCarriage.IArm

## @evidence contracts/development/common.md#meaningful-documentation

Each member names its unit and frame.

## @evidence contracts/development/design.md#principled-representation

Lengths in metres and the hand line in the hand's frame, read from the body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read only by the carriage and the carry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
