# src/construction/IAutoMovieViewPart.ts#IAutoMovieViewPart

## @evidence contracts/development/design.md#principled-representation

A part is drawn by its front and side outlines about its own axis with a fullness owner, the inputs of conic lofting.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record of axis, stations, two outline pairs, fullness, pole, order and samples.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Departures need a published source or derivation and are never fitted to a reference.

## @evidence contracts/development/common.md#meaningful-documentation

States declared section planes, scalar source parameters, extremes/fullness ownership and the pole closure's premises rather than certifying emitted geometry.

# src/construction/IAutoMovieViewPart.ts#IAutoMovieViewPart.IKnot

## @evidence contracts/development/design.md#principled-representation

Site/station/value remain source identities; explicit normalized jets supply shared knot tangency and curvature without observing an emitted section.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three required measurement fields and one optional two-component jet serve all scalar owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Neither site spelling nor mesh output determines a jet; null starts from the natural value and only a separately requested wholly-unauthored range filter may change it.

## @evidence contracts/development/common.md#meaningful-documentation

States millimetre station and scalar/normalized-jet units.

# src/construction/IAutoMovieViewPart.ts#IAutoMovieViewPart.IOutline

## @evidence contracts/development/design.md#principled-representation

Natural interpolation remains the default; explicit shared first/second jets or a sufficient scalar control-hull bound select C2 quintics in the same source parameter. Radial closure is separate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A knot list and optional source parameter serve the same scalar evaluator for outlines and origins.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A world parameter endpoint does not invent a radial zero or station-finite derivative.

## @evidence contracts/development/common.md#meaningful-documentation

States source parameter, kernel endpoint units and closure separation.

# src/construction/IAutoMovieViewPart.ts#IAutoMovieViewPart.IPair

## @evidence contracts/development/design.md#principled-representation

Two signed coordinate sources own a section box's opposite extremes; non-pole sections require positive and negative edges on their respective sides of the axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same pair shape serves front and side views without encoding anatomical side names in the evaluator.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Outlines own their signed measurements; neither a side swap nor emitted geometry supplies replacement coordinates, and knot signs alone do not bound an interpolated source.

## @evidence contracts/development/common.md#meaningful-documentation

States sign, kernel millimetres and the interior-axis premise, with pole endpoints governed by the part's closure.

# src/construction/IAutoMovieViewPart.ts#IAutoMovieViewPart.IQuarters

## @evidence contracts/development/design.md#principled-representation

A fixed four-tuple assigns a value to each cyclic guide interval, matching the section's ordered +u/+v/-u/-v chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One generic tuple reuses that same quarter order for scalar shoulders, departures and source outlines.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type does not infer an anatomical side or validate a value; consumers must preserve the declared chart order.

## @evidence contracts/development/common.md#meaningful-documentation

Lists all four intervals and their wrap from the last guide to the first.

# src/construction/IAutoMovieViewPart.ts#IAutoMovieViewPart.Fullness

## @evidence contracts/development/design.md#principled-representation

A closed discriminated union selects the scalar source of quarter fullness while the front and side sources keep owning the extremes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The kind field gives ViewLoft one exhaustive branch among the three existing ownership modes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No mode derives fullness from observed diagonals or final geometry; the type alone does not admit its numerical laws.

## @evidence contracts/development/common.md#meaningful-documentation

Names each alternative and separates fullness ownership from box-extreme ownership.

# src/construction/IAutoMovieViewPart.ts#IAutoMovieViewPart.IGirth

## @evidence contracts/development/design.md#principled-representation

The authored tape value targets the convex-hull perimeter; ViewSection.solve adjusts one common shoulder with quarter departures, requiring a convex admitted section for curve length to represent that tape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One girth source and optional four departure sources keep the measured perimeter separate from its derived shoulder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tape definition is retained. Finite convexity checks do not certify the hull, ViewSection's root fallback does not certify the requested residual, and ViewLoft's later cap-shoulder adjustment can change the solved girth; these remain implementation gaps.

## @evidence contracts/development/common.md#meaningful-documentation

States the taut-tape meaning, millimetre girth, dimensionless shoulder departures and published-source requirement.

# src/construction/IAutoMovieViewPart.ts#IAutoMovieViewPart.IShoulder

## @evidence contracts/development/design.md#principled-representation

One dimensionless shoulder source supplies the conic fullness law, with sourced quarter departures and independently owned box extremes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shoulder discriminator distinguishes a directly authored law from girth's solved shoulder and top's four independent laws.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No reference is fitted here; the ellipse reference is not a proof of asymmetric conic fidelity, and section admission still belongs to ViewSection.

## @evidence contracts/development/common.md#meaningful-documentation

Defines rho's diagonal-share meaning, dimensionless units and the limited ellipse-reference claim.

# src/construction/IAutoMovieViewPart.ts#IAutoMovieViewPart.ITop

## @evidence contracts/development/design.md#principled-representation

Four sourced shoulder curves own quarter fullness at each station while the same front and side curves continue to own section extremes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The top discriminator and one ordered four-tuple reuse the existing scalar outline evaluator for the third view.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Top laws do not replace the four extreme coordinates or reverse-engineer shoulders from emitted section observations.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the third-view use, quarter source values and interpolation ownership without assuming every source is a natural cubic in station.

# src/construction/IAutoMovieViewPart.ts#IAutoMovieViewPart.ISplit

## @evidence contracts/development/common.md#meaningful-documentation

States chart millimetres, the tangent angle's reference and orientation, and which piece owns the shoulder.

## @evidence contracts/development/design.md#principled-representation

Two chart coordinates and one tangent locate the shared conic contact. The following conic owns the dimensionless shoulder.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four outlines reuse the existing scalar evaluator and carry only the extra data the native chain needs at this contact.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required. The producer supplies the measured contact and tangent from the traced section.
