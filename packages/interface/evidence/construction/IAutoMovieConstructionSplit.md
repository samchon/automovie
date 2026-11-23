# src/construction/IAutoMovieConstructionSplit.ts#IAutoMovieConstructionSplit

## @evidence contracts/development/design.md#principled-representation

An open end divided by one chord into two loops gives each child a closed port on the parent's own boundary (construction.md, Connections: end the parent open and split that end into the children's loops along a shared chord), and the bands are the existing join strip between each side's 2-jet across its rail (Hartmann 2001, parametric G^n blending), so the children meet the parent G2 without a Taylor continuation of the parent's field. The members distinguish metre rail and seam geometry from radian loop windows and dimensionless reach shares.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One host end, a two-phase seam and two child records with their bands and rails are the whole declaration; column count and rows are the strip's existing sampling inputs. Split realization reads the shared seam and per-child correspondence records without separate schemas for each child count.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Declares geometry only: no person, fixture or fitted coefficient; the crease is an authored window, and a refusal leaves the whole split out rather than one child with an open chord. Authored forks and child rails remain explicit; absent profile or crease has the documented geometric meaning.

## @evidence contracts/development/common.md#meaningful-documentation

States both loops and their clocks, the band's sides and continuity, the declared creases, the failure effect, the metre and radian units and the admission rules. Child bands, seam curves and declared crease windows at a split end. Member documentation specifies their units, references and absence behavior.

# src/construction/IAutoMovieConstructionSplit.ts#IAutoMovieConstructionSplit.IPlane

## @evidence contracts/development/design.md#principled-representation

A point and a normal are the plane's whole definition in any orthonormal frame, and the normal's sense names the kept half space, so a rigid motion of the frame carries the plane with it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two vectors; the frame they are written in belongs to the record that holds the plane.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values only; a zero normal is refused, never replaced by a default direction.

## @evidence contracts/development/common.md#meaningful-documentation

States the kept side, the unit and the admission rule.

# src/construction/IAutoMovieConstructionSplit.ts#IAutoMovieConstructionSplit.ICut

## @evidence contracts/development/design.md#principled-representation

A rail generated as the part's skin cut by a surface fixed in a frame is the one curve both faces consume (construction.md, Connections: Ownership and Ports), exact with its jets by the implicit function theorem; half spaces intersected, with Ricci's smooth blend of implicit primitives in its exponential form for the rounded edge (Ricci 1973, A constructive geometry for computer graphics; Blinn 1982), express an end plane and the planes between neighbours as one surface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A frame name, the planes and one optional rounding length; the station, its derivatives and the correspondence come from the child's own skin.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Declares planes only: nothing is fitted, searched from a mesh or stored from one pose; a phase without a crossing is refused, never clamped to the child's end.

## @evidence contracts/development/common.md#meaningful-documentation

States the surface, the rail's station rule and jets, the rounding law and its bound, the three frames, the units and every refusal.

# src/construction/IAutoMovieConstructionSplit.ts#IAutoMovieConstructionSplit.ICompose

## @evidence contracts/development/design.md#principled-representation

A branch node's surface is made of its children's root sections (Ji, Liu and Wang 2010, B-Mesh; sweep-based binding of a child's first section to its parent, Yoon and Kim 2006), and the planes between neighbours follow the bisectors of their axes, so the end, its forks and its seams are functions of the children's frames and are re-evaluated when a child moves instead of being stored from one pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One plane, its frame and one optional rounding length; sections, forks, seam planes, host fork phases and rails are derived.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No web depth, fork phase or chord is tabulated; a composition whose premises fail is refused by name and leaves the whole split out, never repaired by a fill or a clamp.

## @evidence contracts/development/common.md#meaningful-documentation

States every derived quantity with its rule, which authored members are not read, the frames, the units and every refusal.

# src/construction/IAutoMovieConstructionSplit.ts#IAutoMovieConstructionSplit.IProfile

## @evidence contracts/development/design.md#principled-representation

A seam tangent to the host at the forks lies in the host's tangent plane there, so the arc's ribbons (the host's own 2-jet), the seam and its lateral ruling share one tangent plane at each fork, the G1 condition a straight chord in the end plane cannot meet; the clamped cubic spline is the C2 interpolant of authored knots with prescribed end tangents (de Boor 1978), and the corner turn keeps every ribbon in its side's tangent plane while giving the corner column a direction transverse to both boundaries.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A knot list and one corner width; the seam's ends, tangents and ruling come from the host and the chord, and its parameter from its own knots.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Authored knots only, nothing fitted or searched; a seam whose knots leave the chord's span is refused, never clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States the plane, the curve, its end tangents, the ruling, the corner turn, the continuity it keeps and the admission rules, in metres and radians.

# src/construction/IAutoMovieConstructionSplit.ts#IAutoMovieConstructionSplit.ISeam

## @evidence contracts/development/design.md#principled-representation

A seam is the same two forks and curve as the split's own, so every seam of an end is read and ruled alike and shared by the two bands beside it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two phases and an optional profile, the split's own seam fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Authored forks and knots only; seams that do not nest are refused, never reordered.

## @evidence contracts/development/common.md#meaningful-documentation

States the fields, their units and the admission rule.

# src/construction/IAutoMovieConstructionSplit.ts#IAutoMovieConstructionSplit.IChild

## @evidence contracts/development/design.md#principled-representation

The child's own face supplies the band's far ribbon at a declared station, so the band reaches the child's actual surface where the child keeps it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A band name, the child's subtree and face, the end that faces the host, one rail depth and an optional crease window.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The rail is an authored depth, not searched; a rail outside the child's realized domain is a diagnostic, never clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States each field's role, its unit and which side of the rail the child keeps.

# src/construction/IAutoMovieConstructionSplit.ts#IAutoMovieConstructionSplit.ICrease

## @evidence contracts/development/design.md#principled-representation

The child side is a C0 meeting by its own contract (a skin fold such as the gluteal sulcus), and the smoothstep's flat ends keep the ribbon fields C2 in the clock, as the strip requires.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two clock bounds and one transition width; the crease's shape is the chord arrival, with no further option.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An authored window; nothing is detected from the surfaces.

## @evidence contracts/development/common.md#meaningful-documentation

States the clock, the window's effect on both ribbons and the transition's law.
