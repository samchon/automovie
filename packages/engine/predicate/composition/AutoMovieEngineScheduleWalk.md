# src/composition/AutoMovieEngineScheduleWalk.ts#AutoMovieEngineScheduleWalk.create

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies the supplied laws and the empty walk it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The walk starts with no entries, anchors or interruptions. Its initial cue tracks come directly from the laws and are available before an action is placed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Construction copies the track names into an owned map and retains the supplied law object and track entries. The walk holds the state for its caller until that caller discards it.

# src/composition/AutoMovieEngineScheduleWalk.ts#AutoMovieEngineScheduleWalk.instants

## @evidence contracts/development/common.md#meaningful-documentation

The declaration gives the inclusive played interval, fallback endpoint names, film seconds and the result when an anchor or track is absent.

## @evidence contracts/development/implementation.md#principled-implementation

A placed action event qualifies exactly when its second lies between the entry's start and end. The inclusive comparison keeps the event at a cut and omits the unplayed tail. A declared or law-supplied track uses its own film clock. The schedule test checks the interval boundary and the distinction between a played event and an independent cue track.

## @evidence contracts/development/implementation.md#efficient-algorithms

Read the anchor or track by name. For an anchor, traverse its events to keep only played instants and supply missing endpoint names. The work and returned array are bounded by that action's declared events. The read retains no new state.

# src/composition/AutoMovieEngineScheduleWalk.ts#AutoMovieEngineScheduleWalk.placed

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies the names a later placement can use and the source of those names.

## @evidence contracts/development/implementation.md#principled-implementation

The resolver registers action anchors and fixed tracks in separate maps. Listing the keys of each map reports exactly those registered names.

## @evidence contracts/development/implementation.md#efficient-algorithms

Enumeration reads each registered anchor and track once and returns their names in a new array. It retains no new state.

# src/composition/AutoMovieEngineScheduleWalk.ts#AutoMovieEngineScheduleWalk.instant

## @evidence contracts/development/common.md#meaningful-documentation

The declaration specifies the source list, event name, zero-based occurrence, film seconds and refusals for an absent name or occurrence.

## @evidence contracts/development/implementation.md#principled-implementation

Filtering the supplied list by event name preserves its order. Indexing the filtered list selects that occurrence. An absent name yields an event error with available names, and an absent index yields an index error with available occurrences.

## @evidence contracts/development/implementation.md#efficient-algorithms

The read visits the supplied events to select matching occurrences. A failed lookup enumerates the corresponding alternatives. Its temporary arrays are bounded by the supplied events and released on return or refusal.

# src/composition/AutoMovieEngineScheduleWalk.ts#AutoMovieEngineScheduleWalk.leading

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies the composition forms whose first intent it reads and states when it returns undefined.

## @evidence contracts/development/implementation.md#principled-implementation

An intent returns itself. A sequence or parallel group delegates the decision to its first part. An empty group or aligned part has no leading intent under this lookup.

## @evidence contracts/development/implementation.md#efficient-algorithms

The read follows only the first-child path and its call stack is bounded by that path's depth. It allocates no result or persistent state.
