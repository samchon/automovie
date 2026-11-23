# src/posture/HumanHandTarget.ts#HumanHandTarget

## @evidence contracts/development/common.md#meaningful-documentation

Defines surface alignment, current-posture bend solving and fixed geometry preparation. prepareFrame returns orientation/lazy wrist placement without a bend; prepare adds its original bend. prepareMoving serves changing-frame, full-target and wrist-only consumers from one fixed surface; prepareGoal returns the original complete arm goal.

## @evidence contracts/development/implementation.md#principled-implementation

Aligns the surface normal opposite the normalized place normal, chooses the original explicit/heading/up forward, then keeps the original default strain search or stated bend preset.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

oriented and target serve cold, fixed-frame and dynamic-goal consumers. Fixed full-target readers lazily use ArmTarget.prepareTarget's genuine surface metadata; placeHumanHandSurface owns wrist arithmetic and fromWrist owns final goal assembly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves ALONG, surface/shape/curl defaults, actual body-owned offsets and fallback semantics; every current default bend runs its original numerical search. Issuance carries only fixed local geometry, never an achieved pose or solver answer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed readers share actual rest/surface geometry while each world alignment and full-target Bend remains actual; wrist-only consumers omit discarded bends. Fixed full targets bind one genuine local-offset reader for native arm goal assembly rather than two hand lookups per frame, paying fresh placement/row wrappers. Placed goals share one wrist between Bend and goal. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed body/options/surface geometry establish preparation equivalence; full targets receive only ArmTarget's existing private fixed-domain issuance, whose native goal consumer checks body/side/surface/shape. Cold targets stay live, every current point/heading/bend remains actual and changed fixed geometry requires another producer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Cold calls retain nothing; the plan owns fixed body/options/offset/alignment and lazy emitter metadata until release. Issued raw rows weakly retain only ArmTarget's fixed surface metadata while those rows live; current rotations are fresh and points remain borrowed, without an operation FK reader, query/time/pose history or external handle.
