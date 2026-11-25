# src/human/generation/hand/IAutoMovieHumanNail.ts#IAutoMovieHumanNail.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

The frame of the last digit segment or the plate it carries.

## @evidence contracts/development/design.md#principled-representation

The origin is in millimetres in the figure's frame. Distal and dorsal are orthogonal unit directions. Orthonormality remains the caller's premise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanNail builds and classifies the plate in this frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Three named vectors express the frame independently of the digit family.

# src/human/generation/hand/IAutoMovieHumanNail.ts#IAutoMovieHumanNail.ISkin

## @evidence contracts/development/common.md#meaningful-documentation

Complete skin of a digit before a nail relief is applied. `grid`: Gives units, equal spacing, endpoint inclusion, phase wrap and identity with point. `proximal`: Separates the physical fitting aperture from actual proximal relief support; stations and world coordinates are millimetres, with the existing periodic phase samples.

## @evidence contracts/development/design.md#principled-representation

The reader takes course millimetres and chart radians, returning a figure-space point in millimetres. First and tip bound the allowed station interval. `grid`: The same sampled point authority lets the relief bound affine phase edges and their lateral slopes in station millimetres and phase radians. `proximal`: An explicit station per borrowed ring preserves the real chart and its unique seam, including an interval of different pitch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanNail reads the unmodified skin throughout the distal segment. `grid`: An optional borrowed grid describes production readers that already interpolate this exact chart; other readers retain the point, first and tip contract. `proximal`: The optional rings only extend an existing reader's owning chart for relief; callers without an extension use the existing bounds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The callback provides the digit's own evaluated skin. The nail producer admits its usable region. `proximal`: No ring is inferred beyond the part's real proximal source, and the core grid's first row is not repeated.

# src/human/generation/hand/IAutoMovieHumanNail.ts#IAutoMovieHumanNail.IProportions

## @evidence contracts/development/common.md#meaningful-documentation

Plate proportions for a measured or explicitly estimated digit class.

## @evidence contracts/development/design.md#principled-representation

Width, aspect, lunula and wrap are dimensionless. Thickness, fold and a specified radius are in millimetres. Null delegates the radius to the skin.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanNail uses each value to build the plate and its skin reliefs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Population data and admissible numeric domains remain under the caller and producer respectively.

# src/human/generation/hand/IAutoMovieHumanNail.ts#IAutoMovieHumanNail.IReadings

## @evidence contracts/development/common.md#meaningful-documentation

Measurements and convergence observations from one plate calculation.

## @evidence contracts/development/design.md#principled-representation

Distances and residual components follow the named figure or nail frame, with lengths in millimetres and turns in radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Nail diagnostics and visual tools consume the producer's measurements from the plate actually built.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Observed fit data describes that calculation and supplies no acceptance tolerance.

# src/human/generation/hand/IAutoMovieHumanNail.ts#IAutoMovieHumanNail.INail

## @evidence contracts/development/common.md#meaningful-documentation

The plate, skin reliefs and ownership data produced for one digit.

## @evidence contracts/development/design.md#principled-representation

The family and frame use figure-space millimetres. The outline uses course millimetres and chart radians, while the ownership plan uses plate-plane millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanNail produces one record that the skin builder, ownership predicate and inspection paths consume.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reliefs and the plate family describe the same input digit. No extra topology or material ownership is inferred from their meshes.

# src/human/generation/hand/IAutoMovieHumanNail.ts#IAutoMovieHumanNail.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

The outline of the plate in its own distal and transverse axes.

## @evidence contracts/development/design.md#principled-representation

All coordinates and extents are millimetres from the nail frame. Front and edge samples are piecewise linear and require ordered sample coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanNail.owns reads the same plan that defines the plate's skin region.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The plan defines a plate-plane region and one floor. It carries no assumptions about the final mesh.
