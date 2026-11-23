# src/geometry/curve/AutoMovieBernsteinRational64.ts#AutoMovieBernsteinRational64.thirdsR

## @evidence contracts/development/implementation.md#principled-implementation

Numerator and denominator are partitioned with corresponding thirds so the quotient chart remains aligned.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Rational partitioning composes the existing polynomial partition owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No denominator sampling or quotient fitting replaces the homogeneous representation.

## @evidence contracts/development/common.md#meaningful-documentation

Partition numerator and denominator together so the rational quotient is unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Numerator and denominator subdivision dominate O(n²) work for their supplied degrees.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both coefficient families use one identical three-domain partition.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each returned record owns its new numerator and denominator arrays.

# src/geometry/curve/AutoMovieBernsteinRational64.ts#AutoMovieBernsteinRational64.evaluateR

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates N and Q and uses (N′Q-NQ′)/Q² for the optional derivative.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quotient operation shares vector/scalar evaluation and differentiation owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A nonpositive evaluated denominator rejects; polynomial quotient fitting is not used.

## @evidence contracts/development/common.md#meaningful-documentation

Evaluate N/Q or its quotient derivative; a nonpositive denominator rejects.

## @evidence contracts/development/implementation.md#efficient-algorithms

Coefficient evaluation and derivative-net evaluation dominate quadratic work in supplied degrees.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The already evaluated N and Q are reused in the quotient derivative.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the new result triple escapes local numerator/denominator calculations.

# src/geometry/curve/AutoMovieBernsteinRational64.ts#AutoMovieBernsteinRational64.evaluateS

## @evidence contracts/development/implementation.md#principled-implementation

Scalar quotient evaluation uses N/Q or (N′Q-NQ′)/Q² at the same parameter.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The scalar quotient composes the same coefficient evaluation and derivative operations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonpositive evaluated denominators reject without a replacement epsilon denominator.

## @evidence contracts/development/common.md#meaningful-documentation

Evaluate a scalar quotient or its derivative; a nonpositive denominator rejects.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of scalar Bernstein evaluations dominates quadratic degree cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

N and Q values are reused within the derivative expression.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only one scalar returns; coefficient and derivative scratch arrays are not retained.

# src/geometry/curve/AutoMovieBernsteinRational64.ts#AutoMovieBernsteinRational64.positiveScalar

## @evidence contracts/development/implementation.md#principled-implementation

Endpoint slope signs choose neighboring positive support values and solve homogeneous weights for those endpoint derivatives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One four-control rational transition preserves the supplied endpoint data.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonpositive endpoint values reject; finite binary64 representability remains a caller premise.

## @evidence contracts/development/common.md#meaningful-documentation

Construct a control-positive rational transition with the supplied endpoint values and slopes.

## @evidence contracts/development/implementation.md#efficient-algorithms

The construction uses four supports and four weights with fixed work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Solved weights directly supply both homogeneous numerator and denominator.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned record owns two new four-number arrays.
