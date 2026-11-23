# src/math/rotationVectorJacobian.ts#rotationVectorJacobian.apply

## @evidence contracts/development/common.md#meaningful-documentation

r is in radians and derivative in radians per second; the result is body angular velocity.

## @evidence contracts/development/implementation.md#principled-implementation

Uses I-a[r]+b[r]^2, a=(1-cos(theta))/theta^2 and b=(theta-sin(theta))/theta^3. Half-angle sine avoids cancellation in a; the convergent alternating series computes b through pi, and its direct formula has no near-zero cancellation above pi.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Compute scalar coefficients, then apply two cross products without vector temporaries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Zero uses the exact identity limit. Series stop at floating-point stagnation rather than a guessed angle or physical-error floor.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-size vector work plus a rapidly convergent scalar series on the bounded interval zero through pi; above pi direct trigonometry is used.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the scalar cross application with the inverse and uses one half-angle sine ratio for a.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a fresh numeric vector escapes; inputs are not mutated or retained and no cache or handle is acquired.

# src/math/rotationVectorJacobian.ts#rotationVectorJacobian.inverse

## @evidence contracts/development/common.md#meaningful-documentation

The rate is body-frame radians per second. An exact-zero determinant test admits commuting rates even across full turns; a noncommuting inverse outside the first chart or an unrepresentable output returns null. Rounded cross zeros alone never bypass the chart boundary.

## @evidence contracts/development/implementation.md#principled-implementation

Uses I+[r]/2+c[r]^2. Above pi, c=(1-(theta/2)/tan(theta/2))/theta^2 has no subtraction cancellation. Through pi, c=N/sinc(theta/2)^2 with N=sum((-1)^k*2(k+1)*theta^(2k)/(2k+4)!), derived directly from sine and cosine; its alternating terms decrease since the largest first ratio is pi^2/15 below one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the exponential chart, evaluate its stable scalar coefficient and apply the inverse differential.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The pi split follows the cotangent sign, not a tuned precision threshold. The convergent series stops at binary64 stagnation; roundoff is not presented as a rigorous interval certificate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-size vector work and a convergent scalar series through pi; larger admitted angles use direct cotangent. A rounded-zero cross outside the chart invokes at most three fixed-size exact determinant predicates, whose integer storage is bounded by binary64's exponent range.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same scalar cross application as the forward Jacobian and the existing exact determinant owner for the chart exception; no new integration or shape evaluation is required.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector or null with no input mutation, retained state, cache or external resource.
