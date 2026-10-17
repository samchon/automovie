# Garment binding

Basic underwear is within Human's product boundary, but `AutoMovieHuman.getModel()` does not emit it. The following binding remains a proposal.

Generate a garment in the skin's semantic coordinates and retain a normal offset in millimetres, comprising ease and fabric thickness. Skin coordinates survive identity changes and resubdivision more naturally than fixed triangle indices. Copying the skin's local weights avoids a separate volumetric solve for a close-fitting garment, but also copies its folds and deformation defects.

## Method choice

[Maya's wrap deformer](../sources/maya-wrap-deformer.md) uses spatial distance and falloff, so nearby opposing body sheets can both influence a garment point. [Mean value coordinates](../sources/ju-2005-mean-value-coordinates.md) provide linear precision over a closed cage but may be negative in concave configurations. [Harmonic coordinates](../sources/joshi-2007-harmonic-coordinates.md) remain non-negative but require a volumetric solve. These address general cage deformation rather than the close-fitting skin-coordinate case.

A garment must bridge some skin folds instead of reproducing them. Wider weight blends near creases and a posed normal-clearance correction are candidate techniques. A signed-distance query alone does not make the viewer apply that correction. Neither candidate establishes clearance at zero ease; the emitted garment and actual posed skin remain the unresolved consumers in [#2846](https://github.com/samchon/automovie/issues/2846).

Viewer observation and operating policy belong to the [Human skill](../../../../.agents/skills/human/SKILL.md).
