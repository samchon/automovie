# Karčiauskas, Peters and Reif 2004, subdivision shape near extraordinary points

Karčiauskas K., Peters J., Reif U. "Shape characterization of subdivision surfaces: case studies." *Computer Aided Geometric Design* 21, 2004. [Author preprint](https://www.cise.ufl.edu/research/SurfLab/papers/03part2.pdf). Read: the preprint's analysis framework, Catmull-Clark section and Loop tables. It applies the general principles of the companion Peters and Reif paper, which was not read.

## Licence

Paper copyright Elsevier.

## What it says

- For generic input, Catmull-Clark and Loop fail to converge to the hyperbolic or elliptic limit shape the input mesh suggests; the limit shape is a function of the extraordinary point's valence rather than of the mesh geometry.
- Standard Catmull-Clark at valence 3: a flat spot at the point that manifests extremely weakly (ratio about 0.99), and no L2-hyperbolic (saddle) shape.
- Valence 4: C2, with both hyperbolic and elliptic shape possible.
- Valence above 4: at least one principal curvature diverges near the point, and by Lemma 3.2 the point is hyperbolic in the limit for generic input, so elliptic surfaces cannot be modeled. "Only if the designer can make sure that all extraordinary points intended to be hyperbolic (and none intended to be elliptic) are of valence n > 4 does Catmull-Clark subdivision deliver the expected shape."
- Curvature-bounded variants (Loop's and Sabin's) cause flatness and a concentric wave pattern of curvature near extraordinary points. The authors give scheme modifications and a chart for detecting undesirable curvature early.
