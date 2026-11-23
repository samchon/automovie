# src/capture/planAutoMovieCapture.ts#planAutoMovieCapture

## @evidence contracts/development/common.md#meaningful-documentation

States the cell order and why, how names and captions are formed, which planners supply times and layout, and every refusal with what it names.

## @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/capture.md` fixes a cell by subject, time, view and pass and asks for every cell before any is drawn; every check here needs only the request and what the host learned of the subject, so a refused capture costs no drawing and leaves the previous one in place.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check the subject, the views and the marks, expand the selections, plan the times, then one nested loop builds the cells and one call lays them out.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Mark kinds and paths are matched by the inspection core's own pattern rule, sweeps grouped by its own sweep, and names collide only when two cells' fixing values write alike, which is refused instead of overwritten.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the cells, which are selections × times × views × passes, plus the mark-kind and sweep checks over the subject's kinds and drawables.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the request and the subject.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the cells it returns and one set of their names.
