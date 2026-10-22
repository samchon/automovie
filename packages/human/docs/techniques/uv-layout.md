# UV layout

A curve-generated surface can retain semantic tube and patch coordinates. Fixed UV charts let a texture address the same semantic region across identities, while physical texel density changes with body dimensions. Constant packing rectangles alone do not establish identity-invariant coordinates inside them.

[LSCM](../sources/levy-2002-lscm.md) motivates seams where shading can conceal discontinuities; semantic domains can avoid a separate optimizing unwrap when their distortion is acceptable. [Ptex](../sources/ptex.md) avoids UVs, but downstream glTF textures require a published UV layout. [OpenSubdiv's face-varying boundaries](../sources/opensubdiv-documentation.md) preserve chart edges while allowing interior interpolation.

UV cuts duplicate render vertices, not physical surface points. Their normals and physical identity must remain common; averaging normals independently over render aliases would expose seams. A published layout version is a texture compatibility contract.

## Hand charts

A hand chart can separate logical texture coordinates from physical sweep addresses. A shared block correspondence must preserve relief and landmark meaning while preventing identity-dependent dimensions from moving the chart. Webs and caps use two-dimensional patch domains; flattening them into a single station would collapse texture area.

Equal logical bands, rectangular web/cap domains and the palmar texture cut are chart conventions, not anatomical measurements. Additional cuts create render aliases without changing the physical skin. Changing an existing layout requires an explicit compatibility decision.

Hand chart invariance does not establish invariance for every other part. Filtering across separate web/cap rectangles, mip behavior and physical stretch remain material-appearance limits.
