# src/actions/walkReach.ts#walkReach.turn

## @evidence contracts/development/common.md#meaningful-documentation

States heading/pivot units and the scheduled-foot dependency; root and pelvis-joint angles cannot affect this orientation decision.

## @evidence contracts/development/implementation.md#principled-implementation

Applies each claiming foot's original weighted hip-twist band, heel-rise pivot share and two-band gap rule in the same left/right order as pelvis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One orientation owner serves full pelvis placement and contact-window pivot reads, separating the later hip FK that only full placement consumes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every heading/pitch, weight, strict comparison, wrap, twist and heel-rise coefficient; no contact sample or bound changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work for two feet; pivot-only contact sampling omits unread root-path evaluation, pelvic-angle trigonometry and hip FK while retaining all actual stance samples.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Full placement and pivot-only reading share this exact formula owner; every distinct scheduled-foot pair is actually evaluated and no completed orientation is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns only two local bands and one fresh pivot record per call; no body, pose, query history or external resource is retained.

# src/actions/walkReach.ts#walkReach.footPivot

## @evidence contracts/development/common.md#meaningful-documentation

States the angle's unit and independent stance dependency.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same claim, heel pitch and permitted hip twist as the full pelvis evaluation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One foot's claim and direction feed the shared pivot formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the declared twist and heel range unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work, with no opposite-foot, root or FK evaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The contact-window reader shares its pivot formula with turn.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no value or caller state.

# src/actions/walkReach.ts#walkReach.prepareSwing

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/side and the returned settled-pelvis, foot and optional-share reader.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the unchanged sphere/cone, hip/ankle and clearance rules to one prepared owner with this law's exact named bounds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bound record and one prepared swing owner; raw swing delegates here too.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same knee, extension, side, twist and fade values govern raw and prepared paths, with every varying input evaluated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation per side; repeated reads retain the bounded solver work while sharing body-only reach and socket terms.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A reader is valid for the unchanged body and side only; no pelvis, foot or share result is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owning action releases one reader per used side with its plan, without growing query history.
