# src/actions/walkPosture.ts#walkPosture

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body preparation, arm units, action time and the optional leg demand.

## @evidence contracts/development/implementation.md#principled-implementation

The gait's sinusoidal pelvic turn with the chest's counter-rotation (`CHEST`), its arm angles held out by the standing clearance plus the pelvis's tilt (`PELVIS`), an upright-relative lumbopelvic inclination and footprint-heading knee hints, then the trunk pivoted about the hips.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Lower-leg rest points precede one posture reader; standing alignment and relaxed arm preparation start only on their first demand, while foot reach stays with the supplied solve owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every angle comes from the gait record or a named constant; unread leg goals are omitted only under explicit channel demand.

## @evidence contracts/development/implementation.md#efficient-algorithms

The supplied solve computes only requested swinging feet, with at most two leg goals; root/trunk/leg-only reads skip relaxed-arm clearance preparation and arm tuples, while hand-only reads take HumanHand's relaxed shape directly.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One take fixes body, gait, arm modifiers and step plan. Each lazily prepared alignment, relaxed record, abduction and hand shape depends on those alone and is reused for the take, with no queried posture cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader owns fixed body/step references and standing terms until its plan releases it, without a sample history or external handle.
