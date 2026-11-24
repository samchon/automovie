# src/reaction/stagger.ts#stagger.plan

## @evidence contracts/development/common.md#meaningful-documentation

States its input, its plan and its refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The push read causally at the plan's start; the recovery's steps and the centre of mass's course on the pendulum, admitted by the legs as two-bone chains (`staggerRecover`); the feet and the pelvis read from those courses with the walk's own pelvis settling (`StaggerFeet`); the arms abducted from their measured onset.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The admission (`staggerRecovery`) decides the recovery and its refusal; `recovered` plans from it with one clock, one held base and two rows: the body over its feet, and the arms (`staggerArms`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A push no `STEPS` steps catch is refused with the body's limit instead of shortening a step past the legs' reach; the righting is a named provisional constant.

## @evidence contracts/development/implementation.md#efficient-algorithms

Planning steps at most 30 closed-form pendulum prefixes and admits only the prefixes of an order the pendulum catches; a refused push adds the limit's bisection of such recoveries over one prepared entry geometry. No stance course or quadratic program is solved; each pose query is one course read, one ground settling and at most two prepared swing holds.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the recovery, feet, arm and causal-target owners. While the plan is built, each sample's feet and pelvis with no balance shift are solved once and lent to the legs' writer for the arms' carriage read and the first balance pass, which show the plan there before any shift exists; the second balance pass and every pose query solve their own, shifted. Step endpoints, swing curves and bows are kept per declared step; the arms' let-out is read once per plan (`HumanArmSwing.carriage` at `KNOTS` a second, about 50 samples a second of plan, each raised to its neighbours' largest) and interpolated, so a pose query writes the arms as joint angles with no fit; between samples the clearance is the interpolated envelope's, unverified inside an interval.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds its recovery, feet and authored geometric data; refusal observations end on return or throw. Runtime loans last only through each writer call and never enter posture data, endpoint/bow caches or a solved-pose history.

# src/reaction/stagger.ts#stagger.recovered

## @evidence contracts/development/common.md#meaningful-documentation

States its inputs and its plan.

## @evidence contracts/development/implementation.md#principled-implementation

Plans the steps, the catch and the settling of an admitted recovery: the feet and the pelvis read from its courses with the walk's own pelvis settling (`StaggerFeet`), the displayed centre of mass kept on the pendulum's course (Phillips and Badler 1991), and the arms abducted from their measured onset (`staggerArms`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The plan of an admitted stagger, so `perturb` plans the step it admitted without a second admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Plans only a recovery the admission laid; it never shortens a step past the legs' reach.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each pose query is one course read, one ground settling and at most two prepared swing holds; the arms' let-out is read once per plan at `KNOTS` a second and interpolated.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

While the plan is built, each sample's feet and pelvis with no balance shift are solved once and lent to the legs' writer for the arms' carriage read and the first balance pass, as the explicit loan of that one evaluation (`IAutoMovieMotionHumanEvaluation.loan`, honoured only by this plan's writer at its own second); the second pass and every pose query solve their own, shifted.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds its recovery, feet and authored geometric data; a loan lives only in the evaluation it was passed to and in the plan's `lent` for that one synchronous read, released when the read returns; the writer knows it by identity, with no runtime type check.