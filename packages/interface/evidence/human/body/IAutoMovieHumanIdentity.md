# src/human/body/IAutoMovieHumanIdentity.ts#IAutoMovieHumanIdentity

## @evidence contracts/development/common.md#meaningful-documentation

Clinical anthropometric, craniofacial, joint-mobility, composition and pigmentation inputs.

## @evidence contracts/development/design.md#principled-representation `body`: Trunk, limbs and body landmarks. `head`: Cranial vault and face frame. `composition`: Fat and lean mass, which decide surface relief and where volume sits.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanIdentity is the canonical exchange used by IAutoMovieHumanIdentitySchema.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `body`, `head`, `composition`, `pigmentation`; callers supply the complete record.
