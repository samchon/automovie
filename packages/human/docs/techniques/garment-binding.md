# Garment binding

This is a method study for [#2846](https://github.com/samchon/automovie/issues/2846), which replaces #2803 within the basic-underwear-only product boundary. The current appearance document declares underwear choices, but `AutoMovieHuman.getModel()` does not emit underwear. The binding below remains a proposal; it is not an existing garment consumer or a cloth-simulation mandate.

## Methods

| Method | What binds a garment point | Property that matters here | Source |
| --- | --- | --- | --- |
| Wrap deformer | Distance-weighted influence from a driver mesh, with max distance, exclusive bind and volume or surface falloff | Industry default; weights depend on 3D distance, so a point near two body surfaces (inner thigh) picks up both | `../sources/maya-wrap-deformer.md` |
| Barycentric plus offset on a body triangle | A body triangle, barycentric weights and an offset along its normal | Simple and exact on the rest body; the offset direction follows the skinned triangle | `../references/makehuman.md` (MHCLO, described from documentation) |
| Mean value coordinates | Weights over a closed cage | Continuous everywhere, smooth inside, linear precision; can be negative, so a garment point and a cage vertex move in opposite directions in concave cages | `../sources/ju-2005-mean-value-coordinates.md`, `../sources/joshi-2007-harmonic-coordinates.md` |
| Harmonic coordinates | Solution of Laplace's equation inside the cage | Non-negative even in strongly concave cages; needs a volumetric solve | `../sources/joshi-2007-harmonic-coordinates.md` |
| Skin weights through skin coordinates | The garment point copies the skin weights at its semantic skin coordinate and is skinned itself | No extra solve; follows exactly what the skin does | Plan in #2803 |

## Binding proposal

Generate the garment on the skin's semantic coordinates (part, station, angle or patch u, v), then store per garment vertex: the skin coordinate, a normal offset (ease plus fabric thickness) and the skin weights at that coordinate. At pose time the garment is skinned with those weights and offset along the posed skin normal. This is the barycentric-plus-offset family, addressed by semantic coordinates instead of triangle indices, so it survives every identity change and resubdivision.

Cage coordinates (mean value, harmonic) solve a different problem, deforming a dense mesh inside a coarse cage, and their negative or volumetric behaviour gives nothing a skin-coordinate binding lacks for tight garments.

## Folds and contact

Skinning a garment point with the weights of the skin under it reproduces the skin's own fold, including self-contact in deep hip flexion and under the arm. The plan says the garment bridges a fold instead of following it. Two techniques do that without simulation:

- Smooth the garment's weights more widely than the skin's around a crease (the waistband over the inguinal fold, a strap over the armpit), so the garment interpolates across the fold rather than into it.
- After skinning, push any garment point that lies inside the skin out along the skin normal by the signed distance plus the thickness. The engine already has signed mesh queries (`createAutoMovieSignedMeshQuery`, `measureAutoMovieMeshClearance`) that can verify the result per pose.

The first can be encoded in existing skin weights. The second needs a runtime deformation consumer; the signed-query API alone does not make a film's viewer run it. Neither proposal proves clearance at zero ease. #2846 must compare the emitted underwear against the actual posed skin and establish any missing generic runtime contract with core, including the posed re-sweep direction in #2843.

## Not read

Brouet et al. 2012, "Design preserving garment transfer", could not be opened (HAL refused access).
