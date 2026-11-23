# src/gym/createExerciseBike.ts#createExerciseBike

## @evidence contracts/development/implementation.md#principled-implementation

A floor base, a seat post up to the drawn saddle height behind the bracket, a stem up to the drawn handlebar height ahead of it, the handlebar of the drawn width, and the crank of the drawn length with a level pedal on each arm, as `createBicycle` builds them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, the base, posts and bar, the saddle, the grips, then the crank and its pedals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No flywheel or resistance knob; the posts stand upright; the parts' sizes are named estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

About ten parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the bike stands, the crank's rest and sense and its contacts.
