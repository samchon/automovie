# Construction declaration contracts log (#3062)

## Documentation round, 2026-11-05 06:53:38 +09:00 (Get-Date)

The separate contracts worker owns documentation only in the thirteen clean tracked Engine files below, after CORE's explicit path/host acknowledgment. The supervisor separately authorized this log. No runtime expression, type meaning, interface, test, Evidence selector or severity changed. The required one-time Prettier pass also changed existing code layout and trailing commas; the complete noncomment diff was read without treating formatting as new behavior. No skill was edited.

Before source work, read issue #3062's complete body and sole debt comment, the tops of all seven existing work logs, AGENTS.md, the human/development/3d-modeling/contracts/prompting/documentation/review/project/pull-request skills and their applicable construction, repair, validation, writing and common/performance references. The issue's old-body and winding debts remain their owners' runtime/visual work. This worker started no Human generation, functional test, viewer request, browser, server or watch, and interrupted none.

### Owned declaration surface

Every path is under `packages/engine/src/geometry/construction/`. The official full configured selection contains 77 owned hosts: thirteen namespaces with existing answers and 64 child declarations that lacked their own answers. Each child now answers the seven selected common/performance questions itself. Private helpers receive no Evidence tags, and no parent citation is substituted for a child's answer.

| File | Child hosts |
| --- | --- |
| AutoMovieHarmonicCurve.ts | width, evaluate, project |
| AutoMovieIllinois.ts | root |
| AutoMovieLoftContract.ts | IDiagnostic, Stations, Jet, Ring, stations, jet, ring, splineGap |
| AutoMovieLoftFrame.ts | IFrame, horizontal, place, local, interpolate, rate |
| AutoMovieLoftParameter.ts | Rule, phases, centroid |
| AutoMovieLoftRelief.ts | height, jet, width |
| AutoMovieLoftStations.ts | bisect |
| AutoMovieNaturalSpline.ts | ISpline, create, evaluate, derivative |
| AutoMoviePolarSector.ts | IGuide, Jet, radius, fullnessAt, point |
| AutoMovieSeamStation.ts | curvatures, slopes, ICopy, copy, continuous, flat, unflat |
| AutoMovieSolidVector.ts | Vec3, add, sub, scale, combine, dot, cross, norm, unit, solve3, solve2, solve |
| AutoMovieSplineCurve.ts | width, evaluate, interpolate, jet, project |
| AutoMovieStationHermite.ts | IEnd, weights, combine, framed, frameEnd, unflat |

The whole owned implementations and their local helpers were read. Consumer tracing included LoftChain/LoftJet station and phase evaluation, ViewLoft/Outline/Section admission and girth solving, continuation boundary jets, SolidIntersection tangent normalization, SolidTraceSolve/SolidFoot linear solves, HorizontalChain's checked rings, EventJoinPlace's uniform projection, and the ear/neck phase readers. The existing view-section, girth, view-section-chain, loft-jet, loft-point and station tests were read as source, not newly executed or adopted as proof of all these primitives. The installed ECMAScript scanner and checklist evaluator were inspected: namespaces, exported functions/types and callable type members are independent selected hosts; unsupported private/constructor carriers cannot supply answers.

### Findings separated by cause

Missing child-host citations and false existing descriptions are documentation findings corrected in this topic. Harmonic evaluation calls sin/cos per harmonic, not an angle-addition recurrence; its constant terms are phase means, not necessarily area centroids, and finite order does not represent arbitrary frequencies. Polar sectors calculate their basis per reading rather than retaining prepared pair coefficients. SeamStation shares station gaps but rebuilds elimination coefficients per column. LoftParameter deliberately uses a near-zero-area vertex mean, anchored crossing checks and small length divisors. Relief scalars are applied along the declared fixed axis. Natural-spline exterior tangents are an explicit extension choice. Illinois monotonicity alone does not prove a universal superlinear rate or convergence at the iteration bound. Frame output may borrow still-branch axes. These explanations now match the code.

The following runtime/design observations were handed to CORE and the supervisor without implementation changes. They are unresolved debt or explicit premise limits, never a declaration that the f1 defects have been explained or repaired.

| Phenomenon and cause | Contributing factors and actual owner/consumer | Existing verification boundary |
| --- | --- | --- |
| Unbounded retained Fourier turns | SplineCurve.project reaches a process Map keyed by N; each unseen count permanently adds two N-by-N Float64Arrays, 16N² payload bytes, with no eviction/release. Sample values and cutoff do not affect table equivalence. EventJoinPlace/Slope are retained public consumers; ordinary view generation uses interpolate instead. | No retained-byte bound or many-count release test was established. CORE explicitly retained this as performance debt. Acknowledging the missing bound is not fixing it. |
| Repeated station factorization | SeamStation.curvatures computes h once, but recalculates the modified upper coefficients and denominators for every component; continuous separately solves coefficient, optional lift and plane fields. | The code establishes O(LW), not a shared factorization or measured optimization. Existing C2/jet tests concern results, not factorization counts. |
| Checker/type premises narrower than old prose | LoftContract.jet needs a finite bound to reject infinities; its current SeamStation/LegChain callers pass FINITE. ring checks finite coordinates and a positive absolute shoelace sum, not simplicity or finite accumulated area. Brands return borrowed arrays and cannot prevent alias mutation or explicit casts. splineGap's relative policy is not a double-wide stability proof. | Current production callers supply ordinary physical-scale values; no failure on f1 was established. Source-outline admission adds its own finite interval/coefficient checks. The documentation no longer claims these helpers are complete validators. |
| Dot projection differs from an affine inverse on a nonorthonormal basis | LoftFrame.local assumes orthonormal u/v. StationHermite.unflat and LoftChain's component-jet frame branch preserve interpolated basis components without normalization; Jet correctly differentiates those components. | View-section-chain checks its knot frames; synthetic jet cases verify polynomial geometry, including nonorthonormal frames, but do not prove local(place(x,z)) between such knots. This conditional design boundary is not attributed to a current f1 defect. |
| Extreme-scale direction and solve arithmetic is not generally safe | SolidVector.unit divides by the computed norm without max-component scaling; SolidIntersection.walk uses it for crossed surface normals. Its determinant products and Illinois sign/interpolation products also require representable arithmetic. SolidFoot/TraceSolve own actual small-system calls; ViewSection owns the ordinary-scale girth residual. | Existing operator tests use their stated physical/synthetic scales. No new extreme-scale experiment or f1 diagnosis was run. CORE's separate direction repair is not proof that every SolidVector call is scale-safe. |
| Sampled tessellation criterion has finite support | LoftStations tests midpoint rings at 48 phases and stops at a depth bound, so it cannot certify continuous worst-case chord error; a bound-exhausted interval may remain coarse. | construction_stations independently reads the same declared midpoint/48-phase criterion on an ellipsoid below its depth limit. It does not establish an unsampled global maximum. This topic changes neither probes nor criterion. |
| Existing explicit-type debt remains outside JSDoc scope | Five function-valued bindings lack a binding annotation: Frame.still, Stations.at/split, SplineCurve.solve and StationHermite.frameEnd's flat. Their parameter/return annotations do not annotate the binding itself. | No executable/type declaration was changed to hide this rule gap. Shared compilation passing does not establish compliance with every writing rule. |

An adjacent unowned declaration, IAutoMovieLoftRelief, calls a control-net-bearing record constant-size in its retention exclusion. Its rows-by-columns heights and optional shift are variable-sized. That inaccurate existing answer was reported rather than editing an unacknowledged interface path.

### Completed verification and limits

Official selection baseline session 67119, `pnpm exec evidence list --format json`, completed with status complete/exit 1 and exactly 232 graph-checklist-missing diagnostics. Its retained data are `.shots/core_contracts_xhigh/engine-selection-before.json`. This is the actual Engine configuration over all `src/**/*.ts`, selecting type/function hosts and all seven common/performance H2 items, not a bounded file selector that selected zero units.

The first complete after-check, session 1706, ended with 168 graph-checklist-missing diagnostics and no other diagnostic class. The full documentation review then collected the remaining Fourier, Illinois, centroid and frame-description findings and corrected those JSDoc statements together at 06:52:32. The next complete official round, session 13164, was read at 06:53:38: complete/exit 1, one active/complete claim and obligation, zero incomplete obligations, 168 errors, zero warnings, and zero owned-path diagnostics. The retained report is `.shots/core_contracts_xhigh/engine-check-final.json`. All 64 missing owned child-host answers are addressed; 168 other Engine hosts still prevent whole-package success. The seven checklist coverage units are chapters, not a declaration count.

Manual review covered annotation truth, units, optional states, ownership, local helpers, actual consumer premises and the complete source/formatting diff. There was no further documentation finding after the final batch; the runtime/design rows above remain open. Every source file has one filename-named top-level export and fewer than 500 physical lines; the largest is LoftFrame at 411. The one-time format command completed successfully, and the owned whitespace check passed. No new test was written for this comment-only change.

The shared test watch completed cleanly at 06:51:56, and debug completed cleanly at 06:51:02; the later debug 06:52:28 cycle was pending at the read. The earlier affine-support unary-minus/exponent error belonged to CORE's separate test batch and was forwarded without editing that path; test's 06:48:56 cycle subsequently completed cleanly. These are completed compilation snapshots, not a global source freeze or functional/visual acceptance. CORE's shared functional invocation continues under its own ownership.

Runtime acceptance and visual acceptance remain unperformed by this worker. The existing 5197 viewer and both watches were preserved. The owner's original-terminal reload dependency remains pending; no restart workaround or new capture was attempted, and no current PNG claim is made. Dedicated TEMP/TMP remained the absolute `.shots/core_contracts_xhigh/runtime-temp`; ignored paths contain captured reports only, not helper programs.
