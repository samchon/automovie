# src/human/generation/IAutoMovieHumanHeadPrior.ts#IAutoMovieHumanHeadPrior.IFace

## @evidence contracts/development/common.md#meaningful-documentation

The face's named features.

## @evidence contracts/development/design.md#principled-representation `profileKnots`: Nose profile along the dorsum: fractions from the tip (0) to the nasion (1). `profile`: Share of the tip's height at each fraction. `dorsum`: Half-width of the dorsum per half nose width, by the same fractions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadEyeMargin.margin, canthi, AutoMovieHumanHeadNoseAla.lobes. Also types AutoMovieHumanHeadLandmarks.f, AutoMovieHumanHeadEyeParts.face.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `profileKnots`, `profile`, `dorsum`, `tipBall`, `ala`, `underside`, `nasolabial`, `crease`, `fissure`, `gape`, `joint`, `philtrum`, `socket`, `eyeRecess`, `globeRise`, `radius`, `margin`, `marginForward`, `nostrilSize`, `nostrilCentre`, `nostrilSweep`, `nostrilTear`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanHeadPrior.ts#IAutoMovieHumanHeadPrior.IPrior

## @evidence contracts/development/common.md#meaningful-documentation

The whole prior.

## @evidence contracts/development/design.md#principled-representation `tilt`: Hump of the section planes' tilt about the lateral axis, nose side down: height in radians, its station, its widths below and above. `ratios`: Input ratios. `profile`: Midline profile.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadLandmarks.compile. Also types AutoMovieHumanHeadLandmarks.prior, AutoMovieHumanHeadPrior.PRIOR.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `tilt`, `ratios`, `profile`, `frame`, `face`, `mandible`, `ear`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanHeadPrior.ts#IAutoMovieHumanHeadPrior.IRatios

## @evidence contracts/development/common.md#meaningful-documentation

Ratios from public inputs to places the inputs do not define.

## @evidence contracts/development/design.md#principled-representation `neck`: Menton above the neck ring, per neck length. `forward`: Skull centre (midway from glabella to opisthocranion) ahead of the neck ring's centre, per neck radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHeadLandmarks.r.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `neck`, `forward`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanHeadPrior.ts#IAutoMovieHumanHeadPrior.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

The midline profile's landmarks, relative to glabella and face height.

## @evidence contracts/development/design.md#principled-representation `unit`: Face height the published millimetres below are scaled from: the 3D Facial Norms' adult women's n-gn, 118.6 mm (Weinberg 2016). `glabella`: Glabella above nasion, per face height. `nasion`: Nasion behind glabella, millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHeadLandmarks.p.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `unit`, `glabella`, `nasion`, `subnasale`, `pogonion`, `lips`, `sulcus`, `lip`, `chin`, `bridge`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanHeadPrior.ts#IAutoMovieHumanHeadPrior.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

The face's frame beside the midline, per its own measures.

## @evidence contracts/development/design.md#principled-representation `tragion`: Upper facial depth t-n per head length: the 3D Facial Norms' 118.9 / 187.3 = 0.635 in women, 126.7 / 198.3 = 0.639 in men. `tragionDrop`: Tragion below the fissures' centre, per face height: the Frankfort plane passes orbitale, about 10 mm under the fissure's centre, and porion, a few millimetres under tragion. `base`: Cranial base width t-t over maximum cranial width eu-eu: 139.0 / 145.8 = 0.953 in women, 147.9 / 152.3 = 0.971 in men (3D Facial Norms).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHeadLandmarks.fr, AutoMovieHumanHeadLandmarks.frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `tragion`, `tragionDrop`, `base`, `zygion`, `arch`, `frontal`, `plan`, `union`, `clear`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanHeadPrior.ts#IAutoMovieHumanHeadPrior.IMandible

## @evidence contracts/development/common.md#meaningful-documentation

The mandible's skin, a volume in the section union.

## @evidence contracts/development/design.md#principled-representation `plane`: Mandibular plane's rise toward the back, degrees, and per unit of the masculine-feminine control. `angle`: Gonial angle, degrees, and per unit of the masculine-feminine control. `gonion`: Gonion ahead of the ear's line, millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadPrior.IMandible is the canonical exchange used by IAutoMovieHumanHeadPrior.IPrior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `plane`, `angle`, `gonion`, `throatAngle`, `under`, `round`, `fat`, `taper`, `inset`, `back`, `throat`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanHeadPrior.ts#IAutoMovieHumanHeadPrior.IEar

## @evidence contracts/development/common.md#meaningful-documentation

The auricle.

## @evidence contracts/development/design.md#principled-representation `lengthRatio`: Length along the ear per the ear length input. `breadthRatio`: Chord per the breadth input. `drop`: Ear's centre below eye level, in ear lengths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHeadEarParts.prior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `lengthRatio`, `breadthRatio`, `drop`, `forward`, `lean`, `egg`, `stand`, `lobeFree`, `topFree`, `splitFree`, `roofFree`, `root`, `rim`, `lobeFrom`, `lobeBlend`, `frontRim`, `helix`, `scapha`, `antihelix`, `concha`, `tragus`, `antitragus`; callers supply the complete record.
