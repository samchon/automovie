# src/motion/MotionTrajectoryPolynomial.ts#MotionTrajectoryPolynomial.value

## @evidence contracts/development/common.md#meaningful-documentation

Coefficients and output share the scalar state's unit; u is dimensionless.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates u*a+u(1-u)b+u²(1-u)c+u²(1-u)²(d+u*e) in nested form; omitted e uses the original quartic expression exactly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Select quartic or quintic nested evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamping, quantization or replacement curve is applied.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant scalar work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One formula serves every vector and rotation component.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number and retains no input.

# src/motion/MotionTrajectoryPolynomial.ts#MotionTrajectoryPolynomial.slope

## @evidence contracts/development/common.md#meaningful-documentation

The result is per share; callers divide by the physical step in seconds.

## @evidence contracts/development/implementation.md#principled-implementation

Analytically differentiates the four polynomial basis terms and the optional u³(1-u)² term.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Form powers once and sum each coefficient's derivative weight.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not difference sampled orientations or invoke a physical model.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant scalar work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The derivative uses precisely value's polynomial coefficients.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number without retention.

# src/motion/MotionTrajectoryPolynomial.ts#MotionTrajectoryPolynomial.fit

## @evidence contracts/development/common.md#meaningful-documentation

a,b,c retain endpoint increment/slopes; firstRate and secondRate are derivatives per share at NODES.

## @evidence contracts/development/implementation.md#principled-implementation

The two free quintic coefficients multiply u²(1-u)² and u³(1-u)², preserving endpoint values and derivatives. Solves their two-by-two derivative constraints at the distinct cited nodes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Subtract the cubic's derivative at each node and solve the fixed linear system.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fitted fixture coefficient or extra endpoint approximation enters the constraints.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work and one five-number output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same fixed node weights and determinant serve every component and both paired extensions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a fresh coefficient array escapes; no callback or model is retained.
