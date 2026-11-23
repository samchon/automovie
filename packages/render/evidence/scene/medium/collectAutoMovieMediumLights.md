# src/scene/medium/collectAutoMovieMediumLights.ts#collectAutoMovieMediumLights

## @evidence contracts/development/implementation.md#principled-implementation

Reads every visible light's world placement as the renderer aims it (target for directional and spot, local −Z for a panel with its scale ignored), its colour times intensity, and its drawn shadow map by the map's own format and compare mode, which is how the renderer chose the shadow type.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separates scene reading from shader generation and drawing, so the march sees one plain record per light.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No light is skipped by name; a point light without a compare cube marches unshadowed, as documented.

## @evidence contracts/development/common.md#meaningful-documentation

States each record field, the aiming rule, the shadow kinds and the point-light limit.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal of the scene and constant work per light.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Lights move per sample, so they are read per draw.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records that reference the renderer's shadow textures for one draw; it owns none of them.
# src/scene/medium/collectAutoMovieMediumLights.ts#collectAutoMovieMediumLights.ILight

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit, frame and the kinds that read it.

## @evidence contracts/development/design.md#principled-representation

World metres and per-channel photometric colour; one record shape for all kinds, with members a kind does not read held at neutral values, because the shader generator reads them uniformly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The medium pass and its shader generator are the only readers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A union per kind would split the uniform writing four ways for no checked invariant; the neutral values are documented.

# src/scene/medium/collectAutoMovieMediumLights.ts#collectAutoMovieMediumLights.IShadow

## @evidence contracts/development/common.md#meaningful-documentation

States each kind and each member.

## @evidence contracts/development/design.md#principled-representation

The texture, matrix, bias and clip planes the renderer's own lookups use.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the medium pass's uniforms.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The point kind ignores matrix, as its lookup uses the light-to-point vector; the member stays for one shape.