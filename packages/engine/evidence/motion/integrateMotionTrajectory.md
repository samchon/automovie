# src/motion/integrateMotionTrajectory.ts#integrateMotionTrajectory

## @evidence contracts/development/implementation.md#principled-implementation

Classical RK4 or adaptive DP5(4) advances orientation by RKMK's truncated algebra differential (Munthe-Kaas 1999). Playback uses exact Jr^-1 endpoint slopes, fixing finite-step C1 matching. Optional paired continuous control measures actual Jr(r)r' through a caller-owned normalized physical defect without reinterpreting generic RMS units. Smoothness is an estimator premise, not an arbitrary-history guarantee.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, hand adaptive requests to the stepper, else retain fixed knots. MotionTrajectoryRead owns both interpolation and fresh actual-interval snapshots selected by the same adjacent index.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The frame grid never enters integration; reads use actual retained knots. Fixed interval snapshots neither resample the model nor classify adaptive extensions as cubic Hermite data.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed integration uses four new f calls per step after the initial call; adaptive trials use six, with four additional paired-extension calls when a physical defect is requested and the RMS admits. Physical callback probes additionally depend on the paired polynomials' extrema. Full reads cost O(n+1) plus interval lookup and copy output; quaternion projection skips the vector block and costs O(1) fixed or O(log A) adaptive.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each knot's derivative is the next step's first stage, evaluated once. Fixed retained rates are numeric snapshots; intermediate stages borrow the pure callback's results without modifying them. The zero-dimensional vector has no components to advance and shares its private empty record across stages and knots; nonempty states remain separate. Readers reuse only their immediately preceding Object.is-equal requested time and always copy public output.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fixed output holds ceil((t1-t0)/h)+1 owned numeric states and rate snapshots; adaptive output holds accepted numeric steps, at most DOPRI5's default 100000 attempts. MotionTrajectoryRead constructs both readers outside the callback's scope, retaining at most one previous read and returning fresh vector and orientation records, so only completed numeric data escapes.

## @evidence contracts/development/common.md#meaningful-documentation

States method, knot count, orientation, held ends, determinism and stiffness; optional interval reads copy actual adjacent fixed states/rates with their knot seconds and remain absent for adaptive curves.
