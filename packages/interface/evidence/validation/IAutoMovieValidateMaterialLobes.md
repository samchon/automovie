# src/validation/IAutoMovieValidateMaterialLobes.ts#IAutoMovieValidateMaterialLobes.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Admit the optional anisotropy, sheen and specular-intensity lobes of one material: record shapes, `[0, 1]` strengths and roughness, a finite rotation and a linear sheen colour. Member documentation states the supplied records, units and absence meanings used by validateMaterialLobes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absent lobes remain neutral rather than fabricated records; the existing material/part shapes carry the supported UV0 tangent-frame requirement.

## @evidence contracts/development/design.md#principled-representation

material supplies optional anisotropy, sheen and specular lobes while parts resolves UV-bearing meshes; path and partsPath locate diagnostics in the caller-owned collector.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateMaterialLobes.IProps, used by validateMaterialLobes. Its material, path, parts, partsPath, collector members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
