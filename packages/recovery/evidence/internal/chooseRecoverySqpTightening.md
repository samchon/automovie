# src/internal/chooseRecoverySqpTightening.ts#chooseRecoverySqpTightening

## @evidence contracts/development/implementation.md#principled-implementation

Uses r=norm(p_S), G=-f*p_M and W=sum(lambda_i*norm(A_i)) from one admitted physical chart and untilted QP. For W>0 choose min(norm(p_M)^2.5,sqrt(r)*G/W); structural W=0 retains the ceiling. The square-root exponent is the original 2.5 minus the quadratic model order, not an independent parameter. Comparable step norms, G>=c*r^2 and bounded W give a conditional 2.5-order margin; actual retraction, working stability, solve accuracy and Lagrangian consistency remain separate requirements.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Scalar-only target preparation belongs to the current arc owner. It needs the physical objective dot and selected row norms, without a metric forward action or a new factor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses original untilted multipliers without normalization or clipping. Positive-product underflow is not structural zero, and unresolved products, sums, descent or division supply no target. Nearest Float64 arithmetic is not an outward bound or a replacement for actual gates.

## @evidence contracts/development/common.md#meaningful-documentation

Borrows admitted rows, selected indices, nonnegative duals and the actual mixed step. Malformed ownership/dimensions throw; computed arithmetic refusal returns bounded finite-or-null metadata. Selected row norms and all norm units refer to the unchanged physical tangent chart.

## @evidence contracts/development/implementation.md#efficient-algorithms

The width-n direction admission scan, one objective sparse dot and one selected-row norm/price scan cost O(n+Z_f+Z_E+H) visits and O(1) numerical scratch. The arc prepays these scans in its conservative linear reserve before calling, including when no correction is later requested.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the existing unmixed and mixed norms, physical rows and certified untilted dual. It performs no geometry evaluation, factorization, new model or trial.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a fixed scalar result transfers; borrowed rows, directions and multipliers are not retained.
