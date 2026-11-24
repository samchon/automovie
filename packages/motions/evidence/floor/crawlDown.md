# src/floor/crawlDown.ts#crawlDown.IDown

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The posture at a second, the instants the knees and the hands land, which the crawl's knee and hand windows start at, and the way down's length, which its clock starts the crawl at.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, all read by the crawl.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The landing is solved with the posture, so the two agree.

# src/floor/crawlDown.ts#crawlDown

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result; the namespace gives the law.

## @evidence contracts/development/implementation.md#principled-implementation

The sitting state is the balance owner's shift over the feet, bounded by the knee's sitting flexion and by the knees landing on their places; the leaning state is the lean that puts the shoulders an arm from the wrists, at the back that keeps the centre of mass behind the knees found by the engine's bracketed root; joint-space carries join them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The states solved once, then one carry per stretch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each foot rolls about its standing contact, never lerped; a state no back balances keeps the nearest one.

## @evidence contracts/development/implementation.md#efficient-algorithms

The states are solved once, when the way down is built: one balance shift and a bracketed root of lean bisections; each second then costs one posture build and the arm's palm goals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the crawl's posture, `HumanBalance`, `bracketedRoot`, `crawlFeet.rolled` and `crawlFrame`'s arm blend and root.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the solved states for the plan's life.
