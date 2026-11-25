# src/actions/prepareJumpPosture.ts#prepareJumpPosture

## @evidence contracts/development/common.md#meaningful-documentation

Defines actual owned open-flight phase, original clock/ballistic units, outside-phase callbacks and the known refusal wrapper.

## @evidence contracts/development/implementation.md#principled-implementation

Preserves the original clamp, push/free/absorb dispatch and c0+v*t-g*t^2/2 COM expressions. prepareJumpFlight owns the achieved-goal construction and actual canonical solve; jumpAirborne owns handed-back rigid turning.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Public and native flight read the same ballistic writer. Its start belongs to push and its end belongs to flight. The public flight posture is the placed solve's articulation (``HumanPosturePreparation.articulated``), so a plan reader evaluates it by forward kinematics alone; native playback takes the same placed solve. Ground fit transfers survive only where landing turn leaves their inputs unchanged. located owns only the refusal wrapper, which passes every posture argument, the explicit evaluation included, to its source unchanged.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No arbitrary callback is registered, sampled or inferred pure. Before/after callbacks remain ordinary. Forwards the native touchdown requirement unchanged. No law-name selection, pose answer cache, changed callback receiver or scripted turn is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Native placement prepares the same constant-size flight anchor and touchdown offset those stages need. A ground phase can lend its actual same-sample leg fit, avoiding the duplicate fit after arm clearance.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The copied clock and ballistic coefficients are fixed for the plan. Canonical flight anchors and the touchdown offset are invariant for their native curve and handback. Every read evaluates its own current shape; a ground sample independently proves its fit can be transferred.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns its existing flight/turning and before/after writers plus fixed clock/COM data. located retains its original source/location, and no query history, raw result, FK loan or handle is kept. Member facts: IPhase states local normalized-clock conversion; IConstruction retains only the original plan surface.
