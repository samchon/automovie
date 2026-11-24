# src/human/generation/IAutoMovieHumanHeadPrior.ts#IAutoMovieHumanHeadPrior

## @evidence contracts/development/common.md#meaningful-documentation

Head, face, jaw and auricle priors with source-specific dimensional scales and anatomical placement conventions. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups IFace, IPrior, IProfile, IFrame, IMandible, and IEar declarations. Each member retains its own concrete data representation.

## @evidence contracts/development/design.md#principled-representation

IFace, IPrior, IProfile, IFrame, IMandible, and IEar separate the declared inputs and related quantities. The Human producers and engine operators own their numeric domains and geometric consistency.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the IFace, IPrior, IProfile, IFrame, IMandible, and IEar type declarations used by AutoMovieHumanHeadPrior and its Human callers.

# src/human/generation/IAutoMovieHumanHeadPrior.ts#IAutoMovieHumanHeadPrior.IFace

## @evidence contracts/development/common.md#meaningful-documentation

The face's named features.

## @evidence contracts/development/design.md#principled-representation `profileKnots`: Nose profile along the dorsum: fractions from the tip (0) to the nasion (1). `profile`: Share of the tip's height at each fraction. `dorsum`: Half-width of the dorsum per half nose width, by the same fractions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadEyeMargin.margin and AutoMovieHumanHeadNoseAla.lobes. Also types AutoMovieHumanHeadLandmarks.f and AutoMovieHumanHeadEyeParts.face.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The complete record owns nasal curves, alar and nostril dimensions, oral and philtral details, and the globe and nominal aperture. The resting gape is an absolute millimetre quantity.

# src/human/generation/IAutoMovieHumanHeadPrior.ts#IAutoMovieHumanHeadPrior.IPrior

## @evidence contracts/development/common.md#meaningful-documentation

The whole prior.

## @evidence contracts/development/design.md#principled-representation

The profile, transverse frame, face, mandible and ear each have a dedicated record with the units defined at their members.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadLandmarks.compile. Also types AutoMovieHumanHeadLandmarks.prior, AutoMovieHumanHeadPrior.PRIOR.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Callers supply all five prior records. The generating layout positions the head from the person's measures and the generating nape datum.

# src/human/generation/IAutoMovieHumanHeadPrior.ts#IAutoMovieHumanHeadPrior.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

The midline profile's landmarks, relative to glabella and face height.

## @evidence contracts/development/design.md#principled-representation

`unit` is the 3D Facial Norms adult women's morphological face height in millimetres. `glabella` and `nasion` give the brow chord's fallback components per face height and in norm millimetres, respectively.

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

## @evidence contracts/development/design.md#principled-representation

`plane` and `angle` give the mandibular plane and gonial angle in degrees, with their respective changes per unit of the masculine-feminine control. The mandibular floor and ramus meet at the generated gonion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadPrior.IMandible is the canonical exchange used by IAutoMovieHumanHeadPrior.IPrior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record contains angular conventions for the mandible and its underside.

# src/human/generation/IAutoMovieHumanHeadPrior.ts#IAutoMovieHumanHeadPrior.IEar

## @evidence contracts/development/common.md#meaningful-documentation

The auricle.

## @evidence contracts/development/design.md#principled-representation

The auricle record gives insertion and lobular length shares by sex and two geometric breadth shares for the carrier and circular ridge. The ear's place follows the person's own tragion and ear measurements.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHeadEarParts.prior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Callers supply the four dimensionless shares. The auricle generators convert them to the person's own length and breadth.
