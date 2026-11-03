# Head pieces

How the head and face are divided, so each piece is built, looked at, checked and replaced alone. The division follows [surface composition](surface-composition.md): guides at fixed phases, sectors between them, relief windows for local features, appendages for the ears, every join through the shared seam module in `src/lofting/`.

## Frame and reflection

Head frame: x forward, y up, z left, the Frankfort plane horizontal, the midsagittal plane `z = 0`, calibration millimetres. A piece is written for the median or for the left side. The right side is its declared reflection: `z -> -z` and the phase run backward (`t -> -t`), jets reflected by `AutoMovieHumanSeam.reflect`. No piece carries a left or right number or branch; a side takes its own input values into the same construction.

## Guides and sectors

Six guides, each owning its point, tangent and curvature in every ring it crosses:

| Guide | Course |
| --- | --- |
| P | median front profile: vertex, glabella, nasion, pronasale, subnasale, labrale superius, stomion, labrale inferius, sublabiale, pogonion, gnathion, menton, cervical point |
| A | paramedian: endocanthion column, alar crease, philtral column, cheilion, mentolabial end |
| Z | face lateral boundary: frontotemporale, lateral orbital rim, zygion, masseter border, gonion |
| T | preauricular: temporal line, tragion, ramus to gonion |
| E | eurion line, the cranium's widest place |
| B | median back profile: vertex, opisthocranion, nape, neck back |

A half ring runs front to back through four sectors, each a whole number of at least four knot spans of the section spline: S1 between P and A (forehead, nasal root and dorsum, lips, chin), S2 between A and Z (orbit, cheek, nasolabial, jaw body), S3 between Z and E (temple, zygomatic arch, masseter) and S4 between E and B (parietal, occipital, nuchal). Along the height the spans are bounded by the vertex, the eurion's level, the glabella, the nasion, the orbitale, the subnasale, the stomion, the sublabiale, the menton and the cervical point, and one C2 station solve joins every head chain.

## Ownership of the section between the face and the cranium

Every section of the base envelope has three owners along its rays, front to back:

| Rays | Owner | Rule |
| --- | --- | --- |
| in front of Z (the face's widest place) | the face's front half; over the glabella the cranium joined to it | the cranium's share there (`brow`) is 1 at and above the glabella, 0 at and below the nasion, the quintic smoothstep between: the forehead is the vault's, the skin under the brow is the face's |
| Z to E (the cranium's widest place) | the temple sector | the quintic Hermite span in the ray angle between the face's jet at Z and the cranium's jet at E, G2 to both |
| behind E | the cranium | the vault's super-ellipse about the skull's centre |

The cranium's front apex is the vault's ellipse over the glabella continued under it by the parabola of the same curvature, so it is C2 through the glabella and recedes slowly. Its front half is narrowed by the taper `1 + k u^3` solved so the vault passes the frontotemporale at half the minimum frontal width: the cube leaves E's value, slope and curvature untouched, where an exponent under 2 would give E unbounded curvature. A front apex that fell from the glabella's place to the zygion's within 33 mm of height swept the cranium's flank across each forward place within a few millimetres and cut the groove from the eye to the ear.

## Stations

A head chain's stations follow the surface they cut. With `samples` points round each ring, the skin's quads stay isotropic when, between two stations, the skin advances along each guide no further than the ring's sample spacing (perimeter over `samples`) and turns no more than the ring turns between two samples (`2 pi / samples`). Along a guide `x(s)` that gives the station density `max(sqrt(1 + x'^2) / spacing, |x''| / (1 + x'^2) / (2 pi / samples))`, the largest over the guides, at most one station per opening pitch (0.5 mm, the spacing an aperture's rim needs). The guides are the skin along the section's forward, lateral and backward rays: the base outline with the jaw and the reliefs on it. Stations stand at equal shares of the density's integral (`AutoMovieHumanHeadStationDensity`), so the chin's underside, the throat, the lips, the nose's base and the crown crowd their own layers and the count follows from the person.

## Merging pieces

The base envelope is the face without its nose, lips, brow ridge and ears, the cranium and the neck, rounded as if the protrusions did not exist. Each protrusion is its own piece in its own frame and is merged by adding volume only (`AutoMovieHumanSeamUnion`); each recess that keeps the skin single-valued along the section's rays is carved by removing volume only (`AutoMovieHumanSeamCarve`); a recess that opens the skin is an aperture ([subtractive pieces](subtractive-pieces.md)).

| Piece | Form | Merge |
| --- | --- | --- |
| brow ridge, forehead eminence, malar eminence, chin pad, philtrum columns, lips | radial height over the base in its own C2 window | `SeamUnion.bump` |
| nose as a whole (dorsum, tip, alae, columella) | its own radial surface in the nose frame (origin subnasale, axis to pronasale) | `SeamUnion.body`, blend width from its own size |
| ear (helix, antihelix, concha, lobule) | its own chain loft in the ear frame, attached through an opening of `head.middle` by a G1 blend patch of the seam module, the patch adapting to the ear | appendage strip |
| eye socket hollow, temple hollow, philtrum groove, nasolabial and mentolabial sulci | depth under the base in its own C2 window | `SeamCarve.dent` |
| lid opening, nostrils, oral fissure, ear canal | holes | apertures |

The head's reliefs (`AutoMovieHumanHeadRelief`) are radial heights summed in their own windows over the base, so a positive window is a bump and a negative one a dent; the nose's parts, the lips and the ear's splice read the face's lofting stations.

## Files

One file per piece, under 500 lines, one symbol named after the file (a namespace, or an interface under an `I` name). The composing namespace `AutoMovieHumanHeadConstruction` only composes: `apply`, `seat`, `owns`. A piece reads a typed input (the landmark skeleton and the published jets of the guides it borders) and publishes curves, a relief window or a jet, never the whole body, so it builds from fixed inputs alone.

The files stand in `packages/human/src/generation/` under `AutoMovieHumanHead...`: the skeleton (`Landmarks`, `Solve`, `Pass`, `Generate`), the guides and contours (`MedianProfile`, `BackProfile`, `Vault`, `FaceBoundary`, `SideSector`, `Paramedian`), the section (`Section`, `Radius`, `Skin`, `SkinReading`, `Stations`, `StationSolve`, `NeckBase`, `JawBody`, `JawJoin`), the relief windows (`Orbit`, `JawJoint`, `NoseFrame`, `NoseBridge`, `NoseTip`, `NoseAla`, `NoseCrease`, `NoseBase`, `Nose`, `Philtrum`, `LipFrame`, `UpperLip`, `LowerLip`, `OralGroove`, `Forehead`, `Brow`, `Cheek`, `MouthCorner`, `Chin`, with `Window` the generic window and `Relief` the sum), the openings (`EyeMargin`, `Nostril`, `LipBoundary`, `MouthPlacement`), the submental sheet (`Submental`) and the ear (`EarRoots`, `EarFree`, `EarLoop`, `EarLobe`, `EarHelix`, `EarRim`, `EarPocket`, `EarChains`). Each piece's typed inputs are the `Pick<IAutoMovieHumanHeadLayout, ...>` of the fields it reads, or the setup of the person (`IAutoMovieHumanHeadSetup`). A window of amplitude zero is declared with its frame and inputs and contributes nothing until its owner derives its shape.

## Standalone entries

Every piece has a TypeScript entry that builds it in its own frame from the fixed inputs of one person (the head inputs and the neck chain of the shared fixture, read once per process) and writes a component document (`HumanComponentModel`). Run with `ttsx` and look at the result in the part viewer or a CPU render before the piece is wired into the composition. A piece is wired only after its own check passes.

## What a piece must not do

- Cut the number of curves, sections or knots below the reference's: a rule produces at least as many as the reference has, never fewer for simplicity.
- Read a reference curve before checking it against the mesh cut at the same plane, or derive a constant from a flagged curve.
- Fit a number to the reference's rows. A constant has a published source, a population measurement with the person held out, or a derivation.
