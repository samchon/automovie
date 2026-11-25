# src/ensemble/HumanFormation.ts#HumanFormation.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States its input, what it lays once and the readers it returns, and when it refuses.

## @evidence contracts/development/implementation.md#principled-implementation

A path frame is laid once by its one owner (`HumanFormationPath.lay`, the engine's speed profile) and read in closed form; a fixed frame is its own origin, a course frame is read by `formationCourseFrame`, and a guide frame reads the guide's placed root through the caller's reader; every slot is the engine's `formationSlotPosition` placed in that frame, and `assign` is Kuhn's Hungarian method (`assignAutoMovieMinimumCost`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare once, read by time: the laid path is the time-independent part and `frame`, `slot`, `path` and `assign` are the light readers of it, so no reader lays or caches anything.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The defaults `ACCELERATION` and `TURN` are the named sourced or provisional constants; a guide frame read without a reader is refused, never placed at a default.

## @evidence contracts/development/implementation.md#efficient-algorithms

One path lay per preparation; each frame read is O(1) for fixed and path frames and the course reader's cost for a course; `assign` is O(n^3) in the members, as the Hungarian method.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The laid path is shared by every reader of the prepared formation; a consumer prepares once per plan and passes the prepared formation to its helpers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The prepared formation holds the authored formation and at most one laid path for as long as its consumer holds it; nothing is retained at module scope.

# src/ensemble/HumanFormation.ts#HumanFormation.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it reads, its units and its refusals.

## @evidence contracts/development/design.md#principled-representation

Frames are world metres and degrees at film seconds; slots carry their block, rank and file; `end` is a film second or null for frames that never rest or whose rest only the performance knows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Serves the ensemble's members, manoeuvres, wheels, populations, the station walk and the tests that read slots; the formation types are imported from the interface.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Every member is required; there is no optional combination.

# src/ensemble/HumanFormation.ts#HumanFormation.AssignRule

## @evidence contracts/development/common.md#meaningful-documentation

Names the two assignment rules.

## @evidence contracts/development/design.md#principled-representation

The rule `order` keeps member order, and `nearest` minimises the total floor distance to the slots.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `IPrepared.assign` and the manoeuvre rules that choose it.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

A closed literal union of the two rules the readers implement.
