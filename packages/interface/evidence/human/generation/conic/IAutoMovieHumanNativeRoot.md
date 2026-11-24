# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot

## @evidence contracts/development/common.md#meaningful-documentation

Native root controls, original-source calibration and inspection data.

## @evidence contracts/development/design.md#principled-representation

Physical source positions use millimetres and chart angles use radians. Each observation has its own clock and derivative scope.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanNativeRootLaw and AutoMovieHumanNativeRootLevel produce and consume these contracts for Human assembly and inspection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Observed values, discarded targets and unavailable reads remain distinct.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.ITargets

## @evidence contracts/development/common.md#meaningful-documentation

Paired original and changed world controls for one root.

## @evidence contracts/development/design.md#principled-representation

The three point sequences are in world millimetres and share the original clock order. The basis and scale identify the original child axes and their dimensionless caliper ratios.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The native root control and contact producers compare the same paired points.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Equal sequence lengths and correspondence ownership remain runtime premises.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.ICurves

## @evidence contracts/development/common.md#meaningful-documentation

Parent and child target control curves on their declared root clock.

## @evidence contracts/development/design.md#principled-representation

Both control sequences carry world positions in millimetres and must share a control count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Native root construction reports both target curves for its clock transport and residual observations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Targets retain their identity independently of the actual parent and child source jets.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.IOriginal

## @evidence contracts/development/common.md#meaningful-documentation

The original native parent and child definition of one root.

## @evidence contracts/development/design.md#principled-representation

Part readers use physical millimetres. The radial loop uses metres/radians, and rail stations use millimetres. Clock correspondence is closed to angle or length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The native root calibration consumes the immutable original boundary and source control record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Explicit target calipers and basis retain their construction scope without inferred clinical measures.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.ICalibration

## @evidence contracts/development/common.md#meaningful-documentation

Original source calibration shared by one native-root preparation.

## @evidence contracts/development/design.md#principled-representation

The chart controls use millimetres and radians. World samples use millimetres and the unwrapped child phases use radians. The rail callback reads child phases and returns millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Native root resolution reuses the calibration established by its original source readers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The result is borrowed during the invocation. Array length and clock consistency are the calibrator's responsibility.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.IRootRow

## @evidence contracts/development/common.md#meaningful-documentation

Root clock correspondence and actual positions at one emitted column.

## @evidence contracts/development/design.md#principled-representation

Addresses carry millimetres and radians, world points and residual vectors use millimetres, and the level observation is dimensionless.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The native root spec and its inspection consumers read the original target and actual evaluations together.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Actual data and discarded affine targets remain separately identified. The residuals carry no geometric acceptance threshold.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.IRootSpec

## @evidence contracts/development/common.md#meaningful-documentation

Native port and dependent cutter controls emitted by one original-source invocation.

## @evidence contracts/development/design.md#principled-representation

Port controls use metres and radians. Child rail stations and distances use millimetres. Inspect and seed operate on the actual named sources.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Native root resolution, cutter contact and inspection share these port and seed transport controls.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The unchanged flag concerns the local source binding. The port operator owns geometric admission.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.ISeed

## @evidence contracts/development/common.md#meaningful-documentation

A cutter's fixed-phase search line in its original material interval.

## @evidence contracts/development/design.md#principled-representation

The phase is in radians and both endpoints are dimensionless shares of the source interval. The producer checks their domain and order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The native root seed transport copies the original binding or converts it to a changed chart address.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fixed-phase line is a qualified source prior with its own two endpoints.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.ISeedTransport

## @evidence contracts/development/common.md#meaningful-documentation

Controls issued for one cutter search and their source-clock evidence.

## @evidence contracts/development/design.md#principled-representation

Chart addresses use station millimetres and phase radians. Target, actual and residual points use world millimetres. Null denotes an unavailable source clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The root builder and capture diagnostics share the transported line, optional chart seed and its observations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The result describes the original and current controls without asserting a geometric acceptance condition.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

One root's candidate source axes and deferred resolution.

## @evidence contracts/development/design.md#principled-representation

Each axis retains its existing material station in millimetres. The resolver consumes the actual candidate view source.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The native root builder prepares axes once and resolves one named root when the source is available.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Preparation remains independent of the later rail or operator result.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.IClockJet

## @evidence contracts/development/common.md#meaningful-documentation

The value and first two derivatives of a target curve on the original root clock.

## @evidence contracts/development/design.md#principled-representation

The value is in world millimetres and derivatives are per radian and per radian squared.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Native root diagnostics read the paired target-curve jets to describe the original target.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Actual physical source derivatives use their own type and coordinates.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.IProjection

## @evidence contracts/development/common.md#meaningful-documentation

A signed residual projected on a regular source normal and tangent plane, or an explicit unavailable reason.

## @evidence contracts/development/design.md#principled-representation

The signed normal magnitude and tangent vector use world millimetres. The union separates a projection from an unavailable reading.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Native root inspection reports projection at the parent, candidate and final sources.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unavailable source cannot be replaced by a zero residual.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.IInspected

## @evidence contracts/development/common.md#meaningful-documentation

A root inspection column with source jets and residuals available.

## @evidence contracts/development/design.md#principled-representation

The available discriminant accompanies actual physical derivatives, target-clock derivatives and the respective residuals in their documented units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Native root resolution publishes this variant for consumers that report protected source and target observations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record distinguishes target, candidate and final original-source reads.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.IUnavailable

## @evidence contracts/development/common.md#meaningful-documentation

A root inspection column whose physical source derivatives are unavailable.

## @evidence contracts/development/design.md#principled-representation

The unavailable discriminant carries the original row and the reason for the missing source reading.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Native root inspection consumers can retain the source clock while displaying its unavailable outcome.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record supplies no fabricated physical derivatives.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.IInspection

## @evidence contracts/development/common.md#meaningful-documentation

The closed outcome of reading one emitted root column.

## @evidence contracts/development/design.md#principled-representation

The discriminant separates available physical source observations from a diagnostic-only column with the same root address.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Native root inspection exposes this union to capture and source-check consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Numerical availability and geometric admission are separate observations.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.ILevelOriginal

## @evidence contracts/development/common.md#meaningful-documentation

Original elliptic-radius level controls for one root, with observed radial derivatives.

## @evidence contracts/development/design.md#principled-representation

The metric uses millimetres and the levels are dimensionless. Missing derivatives carry explicit reasons per source control.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanNativeRootLevel publishes the original controls to the root calibration that reuses them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The underlying physical caliper metric shares the root input representation. Missing derivatives keep a null slot.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.ILevelColumn

## @evidence contracts/development/common.md#meaningful-documentation

Source-domain evidence for one generated radial root control.

## @evidence contracts/development/design.md#principled-representation

Radial shares, reference levels and residuals are dimensionless. The bracket is ordered on the original chart ray or null when direct reuse applies.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The level solver produces a row per clock so the root result can trace its source membership.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The row records a solved branch and residual. Geometric acceptance remains a separate operator decision.

# src/human/generation/conic/IAutoMovieHumanNativeRoot.ts#IAutoMovieHumanNativeRoot.ILevelResult

## @evidence contracts/development/common.md#meaningful-documentation

The generated parent-chart loop and its level observations.

## @evidence contracts/development/design.md#principled-representation

The loop uses metres and radians in the parent chart. One dimensionless column reading corresponds to each emitted clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanNativeRootLevel hands this result to the native root operator and inspection path.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record pairs each loop with the observations that produced it.
