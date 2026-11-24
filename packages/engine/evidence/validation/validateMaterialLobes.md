# src/validation/validateMaterialLobes.ts#validateMaterialLobes

## @evidence contracts/development/implementation.md#principled-implementation

The domains are those of the glTF `KHR_materials_anisotropy`, `KHR_materials_sheen` and `KHR_materials_specular` factors these fields restate: strength, roughness and intensity in the closed unit interval, a finite angle and a linear colour.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Lobe metadata admission lives here beside overlay admission, while binding admission stays with the shared slot enumeration; the UV requirement reads the parts because it joins a material to the meshes citing it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Values are reported, never clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted domains, the meaning of omission, where the image binding is admitted and the UV0 requirement on citing parts.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of scalar and colour checks per material plus one scan of P parts for an anisotropic material, with diagnostics proportional to faults.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the collector's interval check and the shared colour validator rather than restating their rules.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the collector and its findings; nothing else is retained.
