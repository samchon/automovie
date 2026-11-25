# src/everyday/stepOver.ts#stepOver.plan

## @evidence contracts/development/common.md#meaningful-documentation

The namespace states physical goals, phases and bounds; this entry binds fixed body/foot preparation and permits explicit posture-channel observation demand.

## @evidence contracts/development/implementation.md#principled-implementation

Weight transfers over the lead support before the trailing knee folds. The unloaded ankle follows its shank. A measured sole-radius envelope clears the trailing foot, while the fitted lead sockets follow continuous approach and landing ramps over the full obstacle margin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed trunk/knee/contact geometry precedes root/foot placement, lowering, active landing claims and actual lifted-foot clearance correction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both obstacle margins, contact windows, ankle bounds, six-pass limit and 2 mm clearance tolerance apply across body sizes, speeds and headings.

## @evidence contracts/development/implementation.md#efficient-algorithms

Planted spans omit swing geometry. Only the observed swing leg requests fitted sole observations, sharing its current hip and shank-range reader over the correction rounds. A sole already above its required height returns after the first observation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body geometry and both fixed socket demands prepare once per take. Each synchronous query borrows one FK reader for lowering, the current hip and the three observed swing sockets. Partial poses stay inside the observation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns fixed body/path/trunk readers until released; each query releases its FK workspace and current bone demand on return or throw, without retaining postures, solved poses or queried seconds.
