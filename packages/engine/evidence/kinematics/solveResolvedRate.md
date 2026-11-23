# src/kinematics/solveResolvedRate.ts#solveResolvedRate

## @evidence contracts/development/implementation.md#principled-implementation

The chain rule gives goalRate=J(q)qdot (Lynch and Park, Modern Robotics chapter 5, https://modernrobotics.northwestern.edu/nu-gm-book-resource/velocity-kinematics-and-statics/). Positive diagonal row scaling preserves this square equality. Existing partial-pivot LU solves it without normal equations or damping. Replaying unit right sides estimates ||A||inf||A^-1||inf as in LAPACK DGECON (https://netlib.org/lapack/explore-html/d4/daf/group__gecon_ga4f9b830e19e12c7f082ddb497a57af18.html); actual residuals give normwise and componentwise backward errors as in LAPACK LA_LIN_BERR (https://www.netlib.org/lapack/explore-html/db/d65/group__la__lin__berr_ga56eebc95b5d984d77c0dc2e444e98e6a.html). These measured diagnostics do not certify an analytic input or exact rank.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This leaf admits dimensions/scales, delegates all elimination to prepareLinearSystem, reuses its factor for rates and inverse columns, then measures original and scaled equations through the shared twofold product owner. The motion producer retains Jacobian construction and branch/physical admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No finite-difference derivative, normal matrix, regularization, clipped rate, discarded task, body/fixture branch or new pivot threshold is introduced. Nonzero values lost by scaling and nonfinite diagnostics refuse. An LU result alone is never reported as a valid physical curve derivative.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N coordinates, one O(N^3) factor, N+1 O(N^2) solves and O(N^3) measured inverse-defect work use O(N^2) local storage. Inverse-defect and scaled-residual dots need only their signed sums; only original residuals compute the componentwise absolute denominator. At N=6 this omits 252 unused twofold products while retaining all 288 signed and 36 required absolute products. No query history or pose/FK evaluation is required; runtime gains are unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same privately copied scaled matrix factor serves the actual RHS and all inverse columns. Each completed inverse entry serves its norm and defect, and one twofold scratch serves all current residual dots. Only private copied rows omit unused denominator work; the original caller-row residual retains its complete reads and arithmetic in the same order. No caller rows or rates survive return.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The call owns O(N^2) scaled rows, factor storage and inverse columns plus O(N) vectors and four scratch cells. Only fresh rates/residuals and scalar diagnostics escape; refusal or throw releases all call-local state with no cache, process or handle.

## @evidence contracts/development/common.md#meaningful-documentation

Defines differential equality, task frame and units, physical row scaling, square smooth-branch support, explicit fallback ownership and the limits of every returned diagnostic.
