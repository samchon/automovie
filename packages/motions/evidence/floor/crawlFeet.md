# src/floor/crawlFeet.ts#crawlFeet.ITuck

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and frame.

## @evidence contracts/development/design.md#principled-representation

The foot solved once and its place from the knee.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by the crawl.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The foot is `kneelKeys.tucked`'s.

# src/floor/crawlFeet.ts#crawlFeet.rolled

## @evidence contracts/development/common.md#meaningful-documentation

States the two pivots, why and each input.

## @evidence contracts/development/implementation.md#principled-implementation

A foot rolling onto its toes pitches about the metatarsophalangeal joints while the toes lie flat, then about the toes' tips once the toes are at their range (the forefoot rocker, Perry and Burnfield); its heading turns about the tip that bears, the contact held by `HumanFoot`'s offsets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per pivot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The range is read from the range table; the heading turns about the contact that bears.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/floor/crawlFeet.ts#crawlFeet.prepareRoll

## @evidence contracts/development/common.md#meaningful-documentation

States fixed inputs and independent progress; rolled documents units and the two contact phases.

## @evidence contracts/development/implementation.md#principled-implementation

The toes' tip bears throughout: with the toes flat the heel's pitch about their joint leaves the tip in place, so one placement about the standing tip serves both phases, the toes' extension capped at their range; the heading turns about that tip toward the tucked heading along the shortest arc, as angle blends must, whatever turn of the circle the yaw is written in.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed geometry precedes one evaluator about one point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not change the toe-extension range, heading interpolation or endpoint progress.

## @evidence contracts/development/implementation.md#efficient-algorithms

The heading, range, tip and the native toe offset and MTP point readers are prepared once; each share is one rotation and one offset.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The unchanged body and standing placement, heading and lift establish the invariant geometry. Native HumanFoot readers share only fixed socket/rest prerequisites; current progress, rotation, articulation and placement are independently evaluated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One owning plan retains its tip, scalar limits, one MTP point reader and one offset reader until release; no pose, solver reader or history is cached.

# src/floor/crawlFeet.ts#crawlFeet.planted

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved, what is moved, why, and each input.

## @evidence contracts/development/implementation.md#principled-implementation

The tucked foot is the kneel's; the frame's move is the feet's mean difference along the heading, and each foot's own difference across it stays with that foot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One tuck and one roll per side, then one move.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each foot is rolled from its own standing foot.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two tucked feet, once per plan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
