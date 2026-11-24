# Procedural skin fields

Evaluate vertex colour in the person's rest frame. Sample periodic micro-relief through the packed chart coordinates. A vertex index represents a sample of the skin and carries no physical distance. [UV layout](uv-layout.md)

## Colour fields

Use rest position and normal to evaluate regional chromophore multipliers and three-dimensional mottling. When two pieces share a boundary, evaluate their shared colour from the same position and normal so the result stays continuous across that boundary. Pick noise wavelengths that the mesh can resolve. [Skin material](skin-material.md)

Use an image over the packed chart layout for freckles, moles and acne that are smaller than the mesh's edge spacing. Sample the marks in the chart that owns the surface. [Skin material](skin-material.md#marks)

## Micro-relief tile

A periodic height field can encode pores, undulation and grain at physical wavelengths. Repeat the noise phase at tile boundaries. Use measured follicle densities to choose pore spacing and record the basis for pore radius and depth separately. [Skin feature distribution](../sources/skin-feature-distribution.md)

The height derivatives give the tangent-space normal by normalizing `[-dh/du, -dh/dv, 1]`. A separate grain field can multiply base colour. Roughness can vary with the pore field using the same physical coordinates.

## Sampling limits

When a pore occupies less than a pixel, mipmapping averages its normals into a broader shading response. Normal averaging loses slope variance. LEAN mapping describes preserving that variance for its Ward and Beckmann formulations. A normal map changes shading while keeping the original silhouette. [LEAN mapping](https://userpages.cs.umbc.edu/olano/papers/lean/)
