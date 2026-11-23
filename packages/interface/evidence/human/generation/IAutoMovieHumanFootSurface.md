# src/human/generation/IAutoMovieHumanFootSurface.ts#IAutoMovieHumanFootSurface

## @evidence contracts/development/common.md#meaningful-documentation

Describes retained foot source samples and plantar landmark addresses for rigid display modules in metres; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Retained foot source samples and plantar landmark addresses for rigid display modules in metres. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanFootSurface; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing FootSurface contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanFootSurface.ts#IAutoMovieHumanFootSurface.ICourse

## @evidence contracts/development/common.md#meaningful-documentation

One sampled loft course; descriptor extents do not resize its retained points.

## @evidence contracts/development/design.md#principled-representation `chain`: Canonical chain owning every sample. `stationMm`: Material station in calibration mm, not world Y. `centre`: Phase-mean source centre in registered bind metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootCourse.course.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `chain`, `stationMm`, `centre`, `depth`, `breadth`, `points`, `sourcePhases`, `displayCoordinates`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanFootSurface.ts#IAutoMovieHumanFootSurface.Chain

## @evidence contracts/development/common.md#meaningful-documentation

Canonical foot chains, excluding independently articulated toes.

## @evidence contracts/development/design.md#principled-representation

Canonical foot chains, excluding independently articulated toes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanFootSurface.Chain is the canonical exchange used by AutoMovieHumanFootCourse.course, chain.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanFootCourse.course, chain for canonical foot chains, excluding independently articulated toes.

# src/human/generation/IAutoMovieHumanFootSurface.ts#IAutoMovieHumanFootSurface.Landmark

## @evidence contracts/development/common.md#meaningful-documentation

The three anatomical plantar samples the original renderer retains.

## @evidence contracts/development/design.md#principled-representation

The three anatomical plantar samples the original renderer retains. The closed alternatives are "plantarHeel", "medialBall", "lateralBall".

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanFootSurface.Landmark is the canonical exchange used by landmarks, heights.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by landmarks, heights for the three anatomical plantar samples the original renderer retains.

# src/human/generation/IAutoMovieHumanFootSurface.ts#IAutoMovieHumanFootSurface.IModule

## @evidence contracts/development/common.md#meaningful-documentation

Courses belonging to one existing rigid joint.

## @evidence contracts/development/design.md#principled-representation `bone`: Exact existing evaluator joint; not a new pivot. `axis`: Direction of the ordered module courses, dimensionless. `courses`: Same number of source points in every course.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanFootSurface.IModule is the canonical exchange used by modules.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bone`, `axis`, `courses`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanFootSurface.ts#IAutoMovieHumanFootSurface.ILandmark

## @evidence contracts/development/common.md#meaningful-documentation

Address of a source point that must also be an emitted polygon vertex.

## @evidence contracts/development/design.md#principled-representation `module`: Existing rigid module carrying the point. `course`: Zero-based course index in that module. `point`: Zero-based source point, giving ring-major emitted identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanFootSurface.ILandmark is the canonical exchange used by landmarks, address.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `module`, `course`, `point`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanFootSurface.ts#IAutoMovieHumanFootSurface.ISide

## @evidence contracts/development/common.md#meaningful-documentation

One person's source foot; its seam has one geometry owner.

## @evidence contracts/development/design.md#principled-representation `hindfoot`: Ankle and calcaneal envelope driven by Subtalar. `forefoot`: Continuation from the shared course, driven by Midfoot. `landmarks`: Source addresses of actual plantar anatomical samples.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by side.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `hindfoot`, `forefoot`, `landmarks`, `support`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanFootSurface.ts#IAutoMovieHumanFootSurface.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Deeply frozen bilateral display data, shared by evaluations of one fixed body.

## @evidence contracts/development/design.md#principled-representation `units`: All coordinates and extents use physical metres. `left`: Left source foot. `right`: Right source foot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootSurface.derive. Also types AutoMovieHumanFootSurface.output, AutoMovieHumanSkeleton.footSurface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `units`, `left`, `right`; callers supply the complete record.
