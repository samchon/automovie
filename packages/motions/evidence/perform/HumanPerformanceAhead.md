# src/perform/HumanPerformanceAhead.ts#HumanPerformanceAhead.reader

## @evidence contracts/development/common.md#meaningful-documentation

States what each grip is asked with.

## @evidence contracts/development/implementation.md#principled-implementation

The action asked reads its own resolved parameters, and aims from the posture the grip leaves, so a target placed by the performer's frame is placed where they will stand. Sharing successful FK requires the body and candidate posture to remain unchanged during the synchronous demand call; their types do not enforce that premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The action found once per prop, then asked per grip with a lazy aiming frame and lazy candidate bones.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An action the vocabulary lacks asks nothing; any error a law raises propagates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the performer's later actions, once per prop; each demands query constructs at most one successful scalar aiming frame and shares one successful candidate resolve and FK when own bones are requested. Failed constructions are not memoized. Query-local closures add constant allocation even when no own-body target is read; speed improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each prop's action is kept for every grip of it; repeated aiming reads within one candidate query share the body's unchanged measures, candidate root and heading, and resolved bones. Target- and second-dependent aiming still runs on every call and its return ownership is unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The kept actions, one per prop asked, live as long as the context. A finally block releases candidate bones and the scalar frame on return or throw; an aim callback retained by a law reads both fresh after that invocation, so neither memo persists on the reader, grip or performance.

# src/perform/HumanPerformanceAhead.ts#HumanPerformanceAhead.cut

## @evidence contracts/development/common.md#meaningful-documentation

States which cuts are read and where the plant comes from.

## @evidence contracts/development/implementation.md#principled-implementation

The intent's own `until` and the next intent's law and parameters, as the composition gives them; a cut at another action's event or at a proximity is found only once this action is planned, so it is not known here.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read of the cut, one of the next intent.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A next action the vocabulary lacks plants nothing; it is refused where it is placed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one map lookup and one parameter resolution.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The walk-order list and parameter reading `find` uses.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and retains nothing.
