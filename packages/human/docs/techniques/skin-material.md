# Skin material

[Donner and Jensen](../sources/donner-jensen-2006-spectral-skin.md) describe skin using hemoglobin, melanin amount/type and surface oiliness, with spectral diffusion and a Beckmann surface model. [d'Eon and Luebke](../sources/deon-luebke-2007-skin-rendering.md) separate white surface reflection from subsurface transport. They motivate separate physical controls but do not calibrate an RGB approximation.

Converting pigmentation to linear RGB with an approximate spectral formula requires calibration. Fixed subsurface radii and the viewer's curvature approximation do not reproduce multipole light transport. Perceptual roughness `sqrt(0.35)` produces GGX alpha 0.35 under the stated GGX convention; it is not a measured Beckmann slope or an equivalent BRDF conversion. Index 1.4 gives unscaled dielectric F0 near 0.028, before any separate artistic specular-intensity scale.

Regional tint can follow the joined surface without assigning separate anatomical materials. Regional pigment multipliers, roughness and scattering still require evidence; the presence of a texture channel does not supply a regional model.

Micro-relief can use a rest-millimetre procedural field baked into a detail normal atlas. Its periodic source, axes, dimensions and depth remain conventions. A normal map changes shading without papule silhouette displacement, and unresolved normal variance is not calibrated roughness. [Procedural skin fields](procedural-skin-fields.md) owns the units, sampling assumptions and remaining limits.

Delivering generated images with a model does not establish appearance, filtering or save/resume behavior.
