# src/composition/AutoMovieSchedulePlace.ts#AutoMovieSchedulePlace.intent

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the end and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The laws time the intent, the cut shortens it, then `outcome` and `state` read the entries placed so far and the draft, so an outcome may depend on earlier state.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validate the timing, cut, build the draft, push the entry, name the anchor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A duration, a contact or an anchor name that is not valid is refused.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the intent's events.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reuses the cut and the walk's readings.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The entry joins the walk's list and nothing else is kept.

# src/composition/AutoMovieSchedulePlace.ts#AutoMovieSchedulePlace.at

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the end and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The anchor's contact instant (its start when it has none) or its named event, plus the offset, is the target; an aligned part asks `laws.align` for the start that puts its own instant on it and is then timed again there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the target, then place directly or through the alignment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A cue track named without an event, an occurrence index named without an event, an unplaced anchor, a part with no intent to align and laws without `align` are refused.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work besides the part and the anchor's instants.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the walk's instants.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
