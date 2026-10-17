# Eye and hair material methods

Retain Human's procedural iris and hair images. This complements [procedural skin fields](../techniques/procedural-skin-fields.md); skin diffusion, ocular refraction and fiber scattering are different physical problems.

## Eye

The current iris generator bakes a 512-square radial pattern for each of seven conventional colour categories. People sharing a category share its detail; an independently authored iris seed is not currently exposed. Keep colour selection separate from any future seed, radial-fiber, crypt or contrast controls. Such controls need a demonstrated close-up requirement before expanding the interface. Reuse equal generated images by their actual content dependencies.

[Lefohn et al. 2003](https://publications.sci.utah.edu/publications/lefohn03/irisSynthesis.pdf) composes layered ocularist-inspired iris appearance and retains separate corneal geometry. Its scanned paint layers are not an allowed source of Human's generated texture. Structured radial layers are the useful design principle; flattening a procedural approximation into an image does not preserve every layered optical effect. [Berard et al. 2014](https://cgl.ethz.ch/publications/papers/paperPas14a.php) separately reconstructs the cornea, sclera and iris, supporting that component boundary rather than a new capture dependency.

Keep the existing geometric corneal bulge and iris depth separate from iris colour. A flat texture does not supply refraction, parallax or moving highlights. The current real-time transmission/clearcoat material is an approximation. Static palette consumption does not validate pupil deformation, gaze, fine iris structure or corneal shape.

## Hair cards

Human currently shares a 256-square grayscale/alpha strand atlas and tints it through material parameters. Its card population and strand-pattern scales are construction conventions, not measured follicles/cm². Reuse that atlas while testing actual opacity coverage, mip behavior, cap-to-lock transitions, normals and root-to-tip UV/tangent direction. Roughness and anisotropy are separate from texture filtering and do not correct a folded card or invalid head surface.

[Scheuermann 2004](https://shaderwrangler.com/publications/hairsketch/hairsketch.pdf) uses layered polygon patches, opacity and tangent-based effective highlights. It supports the representation, not a claim that Human's current single alpha-mask/GGX material implements the paper's multiple visibility passes or shifted lobes. Add a dedicated card-shading approximation only if matched views demonstrate the need.

The [Khronos anisotropy specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_anisotropy/README.md) defines a tangent-space direction of increased roughness and elongated highlights. Human's present 90-degree setting needs comparison with its actual tangents; the angle alone does not identify a physical strand axis. Direction/roughness data use linear transfer, independently of colour-image roles.

[Marschner et al. 2003](https://www.cs.cornell.edu/~srm/publications/SG03-hair.pdf) models measured fiber reflection, transmission and internal reflection using cylindrical cross sections and cuticles. [Chiang et al. 2016](https://www.disneyanimation.com/publications/a-practical-and-controllable-hair-and-fur-model-for-production-path-tracing/) supplies an energy-conserving near-field fiber model for production path tracing. Neither can be applied unchanged to a flat card and recover missing fiber cross sections, visibility or inter-fiber transport. They are references for a possible effective-lobe fit, not mandatory runtime replacements or a skin BSSRDF.

## Limits

Material appearance depends on camera, exposure, lighting, opacity coverage and tangents; these sources alone establish neither Human's rendered quality nor performance.
