# src/animals/AutoMovieArchetypeQuadrupedLimb.ts#AutoMovieArchetypeQuadrupedLimb.IRange

## @evidence contracts/development/common.md#meaningful-documentation

Both bounds are metres, mathematical tangencies are included, and a zero root-to-goal distance remains orientation-degenerate even when the lower bound is zero.

## @evidence contracts/development/design.md#principled-representation

The interval is [abs(a-lower), a+lower], where a is the first length and lower the folded sum of the last three bars for a point goal, or second/third bars for an oriented terminal goal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The support planner consumes the same bounds that solve admits; no separate anatomical or tuned range can drift from this geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No clinical ROM, biological reach fraction, speed-specific margin or hidden tolerance changes either bound.

# src/animals/AutoMovieArchetypeQuadrupedLimb.ts#AutoMovieArchetypeQuadrupedLimb.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Names the neutral snapshot, model-space fixed root/goal, relative fold in degrees and five independently owned solved points.

## @evidence contracts/development/design.md#principled-representation

A prepared geometric chain retains four scalar lengths, lower relative angles, its sagittal plane and its fore/hind branch; every call returns fresh results.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Point-only range/solve and a declared terminal-direction binding serve the ride's support planner; callers cannot mutate prepared lengths or controls.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

There is no global cache, species dispatch, aliased source array, inferred clinical constraint or mutable per-frame continuation state.

# src/animals/AutoMovieArchetypeQuadrupedLimb.ts#AutoMovieArchetypeQuadrupedLimb.IPrepared.range

## @evidence contracts/development/common.md#meaningful-documentation

Gives fold convention, SI bounds and numerical-degeneracy refusals without asserting anatomical limits.

## @evidence contracts/development/implementation.md#principled-implementation

Sum the three lower vectors with their neutral relative angles plus the declared signed fold, then return abs(a-lower) and a+lower.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lower-piece calculation returns the two scalar triangle bounds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No goal-dependent projection, source replacement, empirical reach multiplier or biological coefficient affects the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three trigonometric vector terms and fixed scalar arithmetic take constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same prepared lengths and lower-piece calculation as solve, so support planning and admission agree.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh two-number record and retains no call results or external resources.

# src/animals/AutoMovieArchetypeQuadrupedLimb.ts#AutoMovieArchetypeQuadrupedLimb.IPrepared.solve

## @evidence contracts/development/common.md#meaningful-documentation

States frame, metres/degrees, exact endpoint copies, four preserved lengths and explicit unsupported-geometry refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Admit raw reach before calling the engine's solveTwoBoneIK, reject any clamped result and rotate the unchanged lower carriage onto its solved fore/hind branch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit finite plane and reach, solve the upper triangle, recover the lower orientation and emit all five controls.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Root and goal never move and raw distance is never clamped. Only an admitted triangle's cosine is bounded to [-1,1]; a scale-derived plane admission accepts roundoff without projecting inputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar/trigonometric work, five fresh output points and four representability checks; no iteration, search or runtime physical simulation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses prepared lengths/angles and the same band as range; one triangle direction resolves every lower joint.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Every point belongs to the caller; mutation and out-of-order calls cannot change the prepared fixed scalar state.

# src/animals/AutoMovieArchetypeQuadrupedLimb.ts#AutoMovieArchetypeQuadrupedLimb.IPrepared.oriented

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes a terminal direction effector from point-only carriage and states normalization, model frame and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Normalize the declared axis, subtract the terminal length along it and solve the remaining three bars with the existing relative carpus/hock fold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validate/snapshot one axis, then share the prepared piece, fit and four-length checks through range/target/solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The effector direction is explicit input; no invented fetlock angle, species case, changed root, clipped foot target or stretched bar makes the goal attainable.

## @evidence contracts/development/implementation.md#efficient-algorithms

One constant-size axis normalization prepares constant-time band, target and closed-form solve operations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares all source geometry and the strict engine-backed triangle owner with point-only solves.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains three normalized scalar components per binding and no input vector alias or growing sample state.

# src/animals/AutoMovieArchetypeQuadrupedLimb.ts#AutoMovieArchetypeQuadrupedLimb.IOriented

## @evidence contracts/development/common.md#meaningful-documentation

Range is root-to-ankle, target converts a terminal endpoint to that ankle, and solve emits all five model-space controls with the declared terminal axis.

## @evidence contracts/development/design.md#principled-representation

The final vector d*u is fixed by the explicit unit direction; only the proximal three bars participate in the radial triangle band at a relative fold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared ride uses the same target and range for root planning that solve uses for exact foot placement and orientation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Position and orientation are explicit effector constraints, not implicit biological constants or an angle chosen to make one floor fixture pass.

# src/animals/AutoMovieArchetypeQuadrupedLimb.ts#AutoMovieArchetypeQuadrupedLimb.IOriented.range

## @evidence contracts/development/common.md#meaningful-documentation

Gives metres from root to target(endpoint), not root to the terminal, and preserves the existing relative fold convention.

## @evidence contracts/development/implementation.md#principled-implementation

The folded second/third resultant has length L; the first length a gives [abs(a-L),a+L].

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegate to the same lower-piece owner with the explicitly constrained terminal vector removed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No terminal-radius allowance, anthropometric margin or position clamp changes the radial band.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant trigonometric/scalar work and one fresh bound pair.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the neutral relative fold and source lengths prepared for solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no range result and creates no external resource.

# src/animals/AutoMovieArchetypeQuadrupedLimb.ts#AutoMovieArchetypeQuadrupedLimb.IOriented.target

## @evidence contracts/development/common.md#meaningful-documentation

States the exact target(endpoint)=endpoint-d*u relation, finite sagittal input and fresh result.

## @evidence contracts/development/implementation.md#principled-implementation

Subtract the terminal length times the prepared normalized ankle-to-terminal axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the point, subtract one fixed vector and admit representable output.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The terminal endpoint and axis do not move to fit reach or avoid geometry; the caller owns sole contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three multiply/subtract operations and finite/plane admission take constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the prepared terminal vector for support planning and solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector and retains no caller point.

# src/animals/AutoMovieArchetypeQuadrupedLimb.ts#AutoMovieArchetypeQuadrupedLimb.IOriented.solve

## @evidence contracts/development/common.md#meaningful-documentation

Inputs are fixed model-space root/terminal and relative fold in degrees; five fresh outputs preserve four lengths and the supplied root/endpoint exactly, with RangeError for unsupported geometry.

## @evidence contracts/development/implementation.md#principled-implementation

Fit the first bar against the folded second/third resultant to target(endpoint), then append the exact terminal endpoint along the declared final axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Convert the goal, invoke the shared strict engine-backed triangle fit and check all four represented bar lengths.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No goal/root projection, final-axis relaxation or engine-clamped miss is returned as a successful contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant closed-form scalar work and five fresh points; no iteration or simulation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same target/band operations as root planning and the same triangle/length-validation owners as point-only solving.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Every output point is independent; no source/goal alias or mutable sample cache is retained.

# src/animals/AutoMovieArchetypeQuadrupedLimb.ts#AutoMovieArchetypeQuadrupedLimb.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the five-point model-space input, metres/degrees, fore/hind branch and source/solve refusal categories.

## @evidence contracts/development/implementation.md#principled-implementation

Read four Euclidean lengths and lower relative sagittal angles once. Solve the first bar and folded rigid lower carriage as a triangle with admitted raw reach and unchanged endpoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit source geometry, prepare the folded lower piece, then expose its band and the closed solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads no species standing angles or follow share and changes no source point. A scale-derived binary64 plane bound admits arithmetic noise only; no clinical limit, projected reach, shifted root or fixture coefficient is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation examines five controls/four bars once; every range and solve takes constant work with no retained history.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Prepared scalar lengths and neutral angle differences serve every fold and sample; source arrays are not revisited.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains fixed scalar source values and closures, not the source array or points; fresh results acquire no handles or caches.
