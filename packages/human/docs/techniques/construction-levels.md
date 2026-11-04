# Construction levels

The Human is built in levels. Each level reads only the levels below it and the published outputs of those levels, never the internals of a sibling at its own level. A piece reads its own inputs in its own frame and publishes one declared output, so it can be built, looked at, tested and replaced alone, and a change at one level reaches the levels above it only through what it publishes.

## Levels

| Level | Holds | Reads | Publishes | File names |
| --- | --- | --- | --- | --- |
| 0. Shared mathematics | pure functions and value contracts every level uses: Hermite and quintic spans and jet copies (`AutoMovieHumanSeam`), knot layout (`AutoMovieHumanSeamKnot`), the merge operators (`AutoMovieHumanSeamUnion`, `AutoMovieHumanSeamCarve`), the exchanged value types (`AutoMovieHumanLoftContract`), splines and noise | nothing of the figure: only their arguments | functions and checked values | `...Seam`, `...SeamKnot`, `...SeamUnion`, `...SeamCarve`, `...LoftContract`, `...Spline...`, `...Noise` |
| 1. Inputs and calibration | public parameters, their definitions (ISO 8559-1, ANSUR II, Farkas), the landmark skeleton and the frames placed from them | the parameters and the shared priors | landmarks, frames, measures in calibration millimetres | `...Landmarks`, `...Prior`, `...Calibration`, `I...Layout` |
| 2. Base envelopes | the rounded body of each part without its protrusions and recesses (the face without nose, lips, brow and ears; the cranium; the neck tube; a limb tube), and the stations and rows it is lofted at | level 1 | a radial distance per section and ray, the base's guides and their jets, the stations | `...Section`, `...Radius`, `...Vault`, `...Profile`, `...Sector`, `...Stations` |
| 3. Additive pieces | protrusions in their own frames (nose, lips, brow ridge, chin pad, malar eminence, jaw joint, muscle bellies) merged by `AutoMovieHumanSeamUnion` | level 1 for their frames and sizes, the base's radius only at the merge | a height of at least zero in its own C2 window, or a body distance, with its blend width from its own size | the part and the structure, such as `...NoseTip`, `...UpperLip`, `...Brow` |
| 4. Subtractive pieces | recesses that keep the skin single-valued along the rays (eye socket, philtrum, nasolabial and mentolabial sulci, alar crease, navel) carved by `AutoMovieHumanSeamCarve` | level 1, the merged radius of levels 2 and 3 only at the carve | a depth of at most zero in its own window, or a floor distance | the recess, such as `...Philtrum`, `...Orbit`, `...NoseCrease` |
| 5. Apertures and cavities | holes that change the topology (lid opening, nostrils, oral fissure, ear canal) and the meshes behind them (globe, vestibule, oral cavity) | level 1 for their margins, the lofted skin of levels 2 to 4 at the trim | an aperture margin or a seam, a cavity mesh | `...Aperture`, `...Margin`, `...Nostril`, `...Mouth`, `...OralCavity` |
| 6. Seams between chains | the boundary shared by two chains or by a chain and its appendage, owned by one and adopted by the other with a declared continuity (G1 or G2) | the owner's published jet (value, slope and curvature per millimetre of station) | the shared ring's jet; the adopting chain copies it unchanged | `...Seam...`, `...StationSolve`, `...Strip`, `...Patch` |
| 7. Skin surface and images | the lofted, joined mesh, its normals, its chart and its procedural images | levels 1 to 6 as chains, events, appendages and apertures | the skin mesh, its coordinates, its UV chart and its images | `...BodySurface...`, `...SkinChart`, `...Skin...Field` |
| 8. Hair | the hair family (scalp hair cards, eyebrows, eyelashes) attached to the skin; within the hair family a piece may read its siblings' published pieces | the published landmarks of level 1, the skin of level 7, and in the hair family the sibling hair pieces | their own meshes and attachments | `...Hair...`, `...Eyebrow...`, `...Eyelash...` |
| 8a. Appearance (assembly) | the figure's look composed from the skin images and the hair family | every level below: composing them is its definition | the assembled look | `...Appearance...` |
| 9. Rig, binding and pose | the skeleton's binding, weights and motion | the skin of level 7, the skeleton of level 1 | the bound rig and posed meshes | `...Rig`, `...Skeleton...`, `...Pose...` |

## Rules of reading

- A level-2 base is cut as if no piece existed: its guides, stations and sections come from the landmarks and its own sizes.
- A level-3 or level-4 piece is a function of its own inputs and its frame. At its merge it receives the base's radius along a ray as a number and returns the merged radius through the shared operator; it never evaluates the base's guides, profiles or sections.
- The order of merges is fixed: base, then every additive piece, then every subtractive piece, then the apertures. Within one level the merges commute.
- A seam's owner publishes the shared ring's jet and the neighbour adopts it; the neighbour reads the published jet, never the owner's layers.
- A measure solved on the construction's own surface (an input whose definition is a skin distance) is a declared feedback from level 7 to the level-1 key that measure owns, named in the solve, and nowhere else.

## Totality and diagnostics

`AutoMovieHuman.generate` returns a figure for every person inside the declared parameter domain. Contracts stay loud, and where a broken contract lands decides what happens:

| Where the contract breaks | What the figure gets | What is recorded |
| --- | --- | --- |
| an optional piece: an additive or subtractive piece, an aperture and its interior, a hair piece | the piece's base: no piece over the base envelope; an aperture that cannot leave one closed loop leaves the skin closed (the mouth's seam lips meet) | an `AutoMovieHumanLoftContract.IDiagnostic` (producer, level, contract, message with its numbers) in the shape's `diagnostics` |
| a base envelope's row (a section, a station list, a ring) | the neighbouring valid row's frame, by construction of the row rule | the same diagnostic, naming the chain and the layer |
| a value contract at a shared module (`AutoMovieHumanLoftContract.stations`, `jet`, `ring`) | the producer catches it at its own level and degrades as above | the diagnostic |

A diagnostic is a defect of the piece's law. The universality test turns diagnostics into failures: it fails on any thrown error and on any non-empty `diagnostics`, for the ten core people and for a fixed-seed sample of the parameter domain (a Latin hypercube over the input ranges), so "never fails" is a property test.

What each owner returns: a piece returns its own value (height, depth, body distance, mesh) or, when it cannot meet its contract, nothing plus one diagnostic; it never throws past its own level. The mouth's interior is the first piece written so (`AutoMovieHumanOralCavity.attempt`).

## Head pieces off their level

| Where | What it reads | Level it should read | Plan |
| --- | --- | --- | --- |
| `AutoMovieHumanHeadRelief` and `AutoMovieHumanHeadSkin` | the reliefs are summed with their signs and added to the base radius in one step | levels 3 and 4 apart | the relief returns the additive sum and the subtractive sum; the skin merges the first by `SeamUnion.bump` and carves the second by `SeamCarve.dent`, so a piece of the wrong sign is refused at the merge |
| `AutoMovieHumanHeadNoseBridge`, `AutoMovieHumanHeadNoseFrame` | the compiled median profile P, a level-2 guide, for the dorsum's course | level 1 only | the nose's own frame from the nasion, pronasale, subnasale and alare, its dorsum a curve in that frame between those landmarks, merged by `SeamUnion.body` |
| `AutoMovieHumanHeadLipFrame`, `AutoMovieHumanHeadUpperLip`, `AutoMovieHumanHeadLowerLip` | the lips' lead from the layout's profile solve | level 1 only | the lips in the stomion's frame from the vermilion inputs and the published lip protrusion; heights merged by `SeamUnion.bump` |
| `AutoMovieHumanHeadBrow`, `AutoMovieHumanHeadForehead`, `AutoMovieHumanHeadCheek`, `AutoMovieHumanHeadChin`, `AutoMovieHumanHeadMouthCorner` | declared windows of zero amplitude | level 1 | each derived in its own frame and merged by `SeamUnion.bump` |
| `AutoMovieHumanHeadStationDensity` | the skin with the reliefs on, so a protrusion sets the base's stations | level 2 only | the base's stations from the base outline; each piece's sampling demand published as its window's own extent and pitch, which the station rule adds |
| `AutoMovieHumanHeadStationSolve.continuous` | the neck chain's top layer, its coefficients and lifts | the neck's published jet | the neck publishes its top ring's jet through `AutoMovieHumanSeamStation.copy`; the head adopts that copy |
| `AutoMovieHumanHeadEarRoots`, `AutoMovieHumanHeadEarChains` | the ear spliced into `head.middle`'s sections | level 3 appendage in its own frame | the chain tree of [ear pieces](ear-pieces.md), rooted on a plain `head.middle` through the appendage strip |
| `AutoMovieHumanHeadPass.build` | the cut skin, for the globes' seat and the jaw's chin | level 1 | the seat from the nasion and the eye's recess; the jaw's chin from the pogonion and menton |
| `AutoMovieHumanHeadSolve` | the cut skin, for every Farkas measure | declared feedback | stays, as the one declared feedback from level 7 to level 1 |
