# src/affordance/operateInsert.ts#operateInsert.depth

## @evidence contracts/development/common.md#meaningful-documentation

Defines dimensionless stroke progress and metre depth, with full-depth midpoint and returned mouth for withdrawal.

## @evidence contracts/development/implementation.md#principled-implementation

Withdrawal uses the original half-cosine out-and-back depth; insertion uses authored depth times actual progress.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One original withdraw branch owns both depth formulas for full targets and wrist observations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No progress clipping, depth fitting, endpoint substitution or tolerance changes.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant scalar work with at most one cosine.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All insertion consumers use this same depth owner; each progress remains actual.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or result.

# src/affordance/operateInsert.ts#operateInsert.travel

## @evidence contracts/development/common.md#meaningful-documentation

Defines total metre travel as one depth or two when withdrawn, consumed by the original stroke timing.

## @evidence contracts/development/implementation.md#principled-implementation

The original path covers one authored depth inward and an equal return only for withdrawal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar multiplier retains the path-length policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the original authored depth without changing pace or timing bounds.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant scalar work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

operate uses this one owner for insertion duration.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/affordance/operateInsert.ts#operateInsert.tool

## @evidence contracts/development/common.md#meaningful-documentation

States entry-held geometry, acting side, original tip default and one plan-time read.

## @evidence contracts/development/implementation.md#principled-implementation

StrikingHeld.of reads the actual rigid prop-in-hand geometry and named working point through its canonical owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One unchanged held-tool owner receives original prop/side/tip data.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing hold/affordance refusals remain delegated, with no inferred tool shape or substituted point.

## @evidence contracts/development/implementation.md#efficient-algorithms

The delegated entry geometry cost occurs once per operation; the tool then serves all original roll queries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Full targets and wrist-only observations consume this same unchanged held tool.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the original numeric held-tool record, without a sampled pose or live solver reader.

# src/affordance/operateInsert.ts#operateInsert.target

## @evidence contracts/development/common.md#meaningful-documentation

States actual posture/progress, world socket and rigid tool inputs and original complete grip target output.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates one request to the same original insertion-depth, roll selection, wrist placement and default elbow search as prepared full targets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cold facade selects the shared prepared full-target owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains every original roll candidate, full fit, fallback, depth and complete target field.

## @evidence contracts/development/implementation.md#efficient-algorithms

A cold request pays one fixed geometry preparation plus its original ranks, fits and elbow sweep; repeated operation requests use the plan-owned producer instead.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Cold and prepared entry points share prepareMoving's single full-target implementation rather than duplicate insertion geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Cold preparation releases with this call; only numeric original target fields escape.

# src/affordance/operateInsert.ts#operateInsert.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States which source values must remain unchanged, the varying world-posture/progress inputs, and original grip/elbow target output.

## @evidence contracts/development/implementation.md#principled-implementation

The original normalized inward axis and held-tool roll grid are prepared once; each actual depth point still runs the original posture-dependent ranks, legal fits/refinement and elbow solve.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The cold prepared facade selects prepareMoving's full target; that owner shares one axis/roll-grid/hand surface between full targets and wrist-only reach observations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Original depth/reversal arithmetic, cone zero, candidate grid, fit admission, grip geometry, fallback and all contact bounds remain; no placement or pose result is reused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed socket normalization, hand surface and G rigid grid orientations prepare once for Q requests. Every request retains actual ranks/refinement/full roll fits; full targets additionally retain the default Bend, while wrist-only observations omit that unconsumed sweep. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

operate supplies the same initial socket, tool and body for the plan; a changed source frame requires new preparation, while each progress/posture computes its own actual depth, ranks and fitted target.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains fixed source records, axis and the original bounded roll-grid readers until release; no changing posture, queried time, target-result history or external handle is retained.

# src/affordance/operateInsert.ts#operateInsert.prepareMoving

## @evidence contracts/development/common.md#meaningful-documentation

Defines unchanged body/tool/socket, actual posture/progress inputs and distinct complete-target versus world-wrist outputs for operateHand.

## @evidence contracts/development/implementation.md#principled-implementation

Both outputs use the original inward depth point, actual StrikingRollHand ranks/refinement/full fits and rigid grip placement; only complete targets additionally run their actual default Bend.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed geometry preparation and placed-hand owner feed two consumers according to whether they read an elbow target or wrist point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains original cone zero, all roll candidates/fits, depth/reversal arithmetic, target fields and full-target fallback; wrist observations carry no fake bend or fit answer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Axis normalization, bounded rigid roll grid and one local grip offset prepare once for Q queries; every actual roll computation remains, while wrist-only queries omit the unconsumed default Bend sweep. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed context body, immutable tool and socket geometry establish equivalence for this plan; progress/posture remain actual, with changed source geometry requiring another producer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns constant-size fixed geometry and bounded roll readers until release; current frames/wrists/targets are fresh and do not enter any time, pose, target or fit history.
