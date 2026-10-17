# Skin material

[Donner and Jensen](../sources/donner-jensen-2006-spectral-skin.md) describe skin using hemoglobin, melanin amount/type and surface oiliness, with spectral diffusion and a Beckmann surface model. [d'Eon and Luebke](../sources/deon-luebke-2007-skin-rendering.md) separate white surface reflection from subsurface transport. These support Human's parameter choices without calibrating its RGB approximation.

Human converts pigmentation to linear RGB at generation time with an approximate spectral formula. Fixed subsurface radii and the viewer's curvature approximation do not reproduce multipole light transport. Perceptual roughness `sqrt(0.35)` produces GGX alpha 0.35 in the installed material; it is not a measured Beckmann slope or an equivalent BRDF conversion. Index 1.4 gives unscaled dielectric F0 near 0.028, while oiliness also scales the displayed specular intensity.

Regional tint can follow the joined surface without assigning separate anatomical materials. Regional pigment multipliers, roughness and scattering still require evidence; the presence of a texture channel does not supply a regional model.

Micro-relief uses a rest-millimetre procedural field baked into a detail normal atlas. Its periodic source, axes, dimensions and depth remain conventions. A normal map changes shading without papule silhouette displacement, and unresolved normal variance is not calibrated roughness. [Procedural skin fields](procedural-skin-fields.md) owns the units, sampling assumptions and remaining limits.

Generated images travel with the model, but image delivery alone does not establish appearance, filtering or save/resume behavior. Viewer observation and operating policy belong to the [Human skill](../../../../.agents/skills/human/SKILL.md).
