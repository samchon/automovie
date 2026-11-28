# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.fitEpipolarMatrix

## @evidence contracts/development/common.md#meaningful-documentation

Fit a normalized algebraic fundamental matrix from at least eight paired image points in pixel-centre coordinates. Return a rank-two row-major matrix and the original normalized design ratio. Mismatched pairs, unresolved rank and nonrepresentable scale throw.

## @evidence contracts/development/implementation.md#principled-implementation

Normalize both point charts, form the original eight-point design and take its least singular direction. Impose rank two in the normalized chart before denormalizing and fixing scale and sign. The pure-x translation fixture identifies only the two equal-and-opposite matrix entries.

## @evidence contracts/development/implementation.md#efficient-algorithms

Form each original design row once. Reuse the two chart similarities for denormalization and work within the supplied SVD sweep limit.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.fitHomography

## @evidence contracts/development/common.md#meaningful-documentation

Fit a normalized homography from at least four paired pixel-centre observations. Return its forward and inverse row-major matrices and original-design singular ratio. Mismatched pairs, degenerate design and an unresolved inverse throw.

## @evidence contracts/development/implementation.md#principled-implementation

Build DLT rows in normalized image charts and denormalize the fitted projective map. The translated-square fixture independently supplies a shift of five and three pixels and compares both map directions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Normalize each image chart once. One original-design factorization produces the forward matrix, whose small inverse is reused for reverse transfer.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.measureEpipolarErrors

## @evidence contracts/development/common.md#meaningful-documentation

Measure signed Sampson residual and mean two-sided point-to-line distance in pixels for each pair of observations. The result keeps input order. A missing or unrepresentable line or residual returns null. Mismatched observations and algebra shape failures throw.

## @evidence contracts/development/implementation.md#principled-implementation

Use the two epipolar lines and their shared incidence. The Sampson denominator combines both normal lengths; the symmetric distance averages the two normalized absolute incidences. The one-pixel sideways fixture gives −1/sqrt(2) and one, respectively.

## @evidence contracts/development/implementation.md#efficient-algorithms

Transpose the input matrix once and visit each matched point pair once. The result retains two scalar measurements per admitted pair.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.measureHomographyErrors

## @evidence contracts/development/common.md#meaningful-documentation

Measure the RMS of forward and backward pixel transfer distances for corresponding observations. Each result uses the original pair's index. An undefined projective transfer returns null. Different point counts throw.

## @evidence contracts/development/implementation.md#principled-implementation

Apply the fitted map in both directions and divide each finite homogeneous result. The identity fixture's (3,4) displacement is five pixels both ways, so its RMS is five. A zero homogeneous last coordinate gives no transfer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use one forward and one backward fixed-size matrix action per pair. Return just the scalar distances or null at each source ordinal.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.scoreCameraResiduals

## @evidence contracts/development/common.md#meaningful-documentation

Keep finite residuals whose magnitude is at most the supplied positive finite pixel threshold. Return their original indices, median and 90th percentile. Empty support has null quantiles. An invalid threshold throws.

## @evidence contracts/development/implementation.md#principled-implementation

Collect absolute magnitudes and interpolate at (N−1)q in their sorted order. At threshold three the authored magnitudes are 0.5, 1, 2 and 3, giving median 1.5 and p90 2.7.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scan source residuals once and sort only the retained values. Preserve source order in the separate indices array.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.requiredCameraTrials

## @evidence contracts/development/common.md#meaningful-documentation

Return the conditional RANSAC trial count for a uniform unique-index sample at confidence strictly between zero and one. Supply safe integer population, inlier and sample counts. A full-inlier population may need one trial. Impossible support or an unrepresentable count returns infinity.

## @evidence contracts/development/implementation.md#principled-implementation

Multiply each remaining inlier-to-population fraction to model without-replacement success within one trial. Apply the independent-trial logarithm to that success probability. The 10-of-5 fixture with two draws gives probability 2/9 and requires 19 trials at confidence 0.99.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluate one product over the sample width and a constant number of logarithms. No candidate subsets are generated to compute the bound.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.refineEpipolarModel

## @evidence contracts/development/common.md#meaningful-documentation

Refine a calibrated epipolar candidate under its pixel support policy. Run at most three fixed-inlier refits. Report qualified convergence only after the inlier population stabilizes and its local fit terminates.

## @evidence contracts/development/implementation.md#principled-implementation

A stable updated pose must be supported by the same inlier addresses that supplied the current fit. When the support changes, recompute the original model on the new population. The calibrated pair estimator retains the diagnostics if convergence cannot be qualified.

## @evidence contracts/development/implementation.md#efficient-algorithms

Limit final re-estimation to three refits. Retain the current support and completed measured receipts instead of speculative point populations.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.sampleCameraIndices

## @evidence contracts/development/common.md#meaningful-documentation

Draw a reproducible ordered subset without replacement from a discrete population. Supply its positive size, a supported sample size, a 32-bit unsigned seed, an integer model domain and a nonnegative integer trial identity. Malformed sample identities throw.

## @evidence contracts/development/implementation.md#principled-implementation

Use the seeded value for each draw ordinal to swap a remaining element into the sample prefix. Repeating the same identity produces the same sequence. A whole-population sample is a permutation, verified by the existing sampling test.

## @evidence contracts/development/implementation.md#efficient-algorithms

Represent the source indices once and perform only sample-size swaps before copying the prefix.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.selectCameraPose

## @evidence contracts/development/common.md#meaningful-documentation

Evaluate all four calibrated relative-pose branches on the same nonempty image correspondence set. Return the branch with most positive-depth points, its support and parallax in radians. Equal highest counts leave an explicit ambiguity. Empty or mismatched pairs throw.

## @evidence contracts/development/implementation.md#principled-implementation

Project the fundamental matrix to the essential manifold, enumerate both rotations and translation signs, and measure cheirality using triangulated points. The stereo fixture distinguishes a unique finite branch from a point at infinity with no positive-depth winner.

## @evidence contracts/development/implementation.md#efficient-algorithms

Calibrate once and visit the same supplied population once per four fixed branches. Keep branch support counts and the selected finite parallax summary.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.calibrateEpipolarMatrix

## @evidence contracts/development/common.md#meaningful-documentation

Project a pixel fundamental matrix onto the essential manifold of the supplied pinhole charts. Return the pixel-space projection and four relative poses from the first camera to the second. Translations use a unit baseline. Unresolved singular directions throw.

## @evidence contracts/development/implementation.md#principled-implementation

Equalize the two resolved calibrated singular values and reconstruct the essential directions. Each of two proper rotations combines with both signs of the same unit translation. The calibrated fixture independently checks the sqrt(1/10) discrepancy and all four branches.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use small 3-by-3 camera actions and one fixed-size singular factorization under the supplied sweep ceiling.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.fitEpipolarConsensus

## @evidence contracts/development/common.md#meaningful-documentation

Fit calibrated epipolar support from at least eight tentative pixel pairs under the supplied calibrated charts, trial limits and pixel gate. Report finite support, numerical refusals and whether the conditional trial target was met. The result remains conditional on the observations.

## @evidence contracts/development/implementation.md#principled-implementation

Project each sampled proposal into its calibration before pixel scoring. Eligible proposals receive local refinement, and final refitting recomputes support and the required trial count. The relative-pose estimator consumes the measured support and refuses an exhausted trial target.

## @evidence contracts/development/implementation.md#efficient-algorithms

Share original correspondences and calibrated charts across proposals. Explicit trial and local-refit budgets bound repeated candidate work.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.fitHomographyConsensus

## @evidence contracts/development/common.md#meaningful-documentation

Test a homography explanation over the existing epipolar inlier population. Transfer residuals use pixels. Report whether the forbidden overlap was found and whether search met its conditional trial target. At least four paired observations are required.

## @evidence contracts/development/implementation.md#principled-implementation

Use four-point samples and symmetric transfer errors, comparing support against the forbidden overlap rather than using a weaker winning support ratio to stop. A found forbidden overlap suffices for the pair estimator's homography-ambiguity refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Stop once forbidden overlap is witnessed or the declared trial work ends. Keep one current support and report its fit and search counts.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.fitResectionConsensus

## @evidence contracts/development/common.md#meaningful-documentation

Register one calibrated view against distinct existing landmarks in their map gauge. Pixel residuals use the supplied threshold and intrinsics. Return a candidate pose and reasons if the support, local fit or conditional trial target fails. The optional proposal observer runs once per draw; observer exceptions propagate.

## @evidence contracts/development/implementation.md#principled-implementation

Initialize nonplanar six-point DLT proposals and compare their positive-depth reprojections. Eligible local refinement operates on existing landmarks; require stable final inlier support and its recomputed trial target. The camera scene uses this before staging new points.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use existing landmark coordinates throughout resection. Proposal, local-refit and sweep caps bound work. Optional observer snapshots are delivered as events without retaining history.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.fitResectionDesign

## @evidence contracts/development/common.md#meaningful-documentation

Initialize a calibrated camera from at least six nonplanar world points and paired pixel observations. The pose uses the supplied world gauge. An optional trace receives completed normalization and factorization evidence. Planar or unresolved designs throw.

## @evidence contracts/development/implementation.md#principled-implementation

Normalize both world and calibrated image charts, solve the original DLT, project the recovered block to a proper rotation and undo world centering using that rotation. The noisy chart fixture verifies transformed positions and identical physical pixel predictions under translation, scaling and rotation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Normalize the supplied populations once and build one original design before interpreting the rigid pose. Pass stage diagnostics only to an explicitly supplied trace.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.refineResection

## @evidence contracts/development/common.md#meaningful-documentation

Refine one calibrated camera against fixed world landmarks and paired pixel observations. Angular increments are in radians and translation is additive in the map gauge. Use the supplied pixel-error scales and work limits. Invalid inputs or a nonpositive initial depth throw.

## @evidence contracts/development/implementation.md#principled-implementation

Combine both pixel-coordinate residuals under one soft-L1 weight and use the analytic rotation and translation derivatives. Accept only decreased measured cost with positive-depth support. The resection consensus consumes the termination and final pose together.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse fixed points and calibration through bounded camera-only steps. Store only the current candidate, compact original design and fitting receipt.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.refineCameraPose

## @evidence contracts/development/common.md#meaningful-documentation

Refine one calibrated relative pose on an unchanged paired pixel subset. The soft-L1 scale uses pixels, rotation increments use radians, and translation stays on the unit sphere. Return the accepted local pose and termination. Unresolved original rank or invalid chart data throws.

## @evidence contracts/development/implementation.md#principled-implementation

Differentiate the signed Sampson residual and apply robust weights before column scaling. Check undamped rank before solving the damped augmented design. The calibrated consensus calls this on each admitted fixed subset.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse the subset and calibration through the bounded local fit. Keep the fixed five-coordinate design and current candidate rather than a trajectory.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.normalizeImagePoints

## @evidence contracts/development/common.md#meaningful-documentation

Centre a nonempty pixel-point population and scale its mean Euclidean distance to sqrt(2). Return normalized coordinates and a row-major similarity transform. Coincident or unrepresentable charts throw.

## @evidence contracts/development/implementation.md#principled-implementation

Compute the centroid and its mean Euclidean distance before deriving the scale. The fixture's square has centroid (1,1) and mean radius sqrt(2), so the expected transform changes only its origin.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use a constant number of traversals and one output tuple per observation. The source raster remains with the caller.

# src/geometry/AutoMovieRecoveryCameraGeometry.ts#AutoMovieRecoveryCameraGeometry.triangulateCameraPoint

## @evidence contracts/development/common.md#meaningful-documentation

Triangulate a calibrated observation pair in the first camera's unit-baseline gauge. Return coordinates, depths, parallax in radians and pixel reprojection error for a representable point. Finite points behind a camera remain marked nonpositive. Unresolved rays, rank, homogeneous weight or measured error return null.

## @evidence contracts/development/implementation.md#principled-implementation

Measure calibrated rays and their separation before a four-row DLT. Resolve the third design direction before dividing its homogeneous point and reprojecting. The quarter-turn fixture supplies the known front and back points, exact expected parallax and parallel-ray refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use one fixed 4-by-4 design within its sweep limit. The result retains only a point and its measured support, not the correspondence population.
