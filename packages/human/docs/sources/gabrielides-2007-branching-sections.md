# Gabrielides et al. 2007, G1 branching surfaces from cross sections

Gabrielides N.C., Ginnis A.I., Kaklis P.D., Karavelas M.I. "G1-smooth branching surface construction from cross sections." *Computer-Aided Design* 39(8):639-651, 2007. https://doi.org/10.1016/j.cad.2007.05.004 ([repository record](https://strathprints.strath.ac.uk/45123/)). Read: abstract.

## Licence

Paper copyright Elsevier. Human takes only the method.

## What it says

- Input: data points on parallel cross sections containing simple, disjoint, non-nested contours. Cross tangent vectors are estimated and the problem splits into local Hermite problems: one-to-one, one-to-many and many-to-many; many-to-many reduces to two one-to-many problems by zone separation.
- One-to-many combines skinning, trimming and hole filling with a C1 surrounding curve. The hole is covered by quadrilateral Gordon-Coons patches with G1 continuity, using shape-preserving guide curves; data symmetries can be preserved.
- The authors name the surrounding-curve step as the point to improve for robustness and applicability. Tests: two synthetic data sets and two design examples, in a Rhino 3.0 plug-in.

## What Human takes

A branching construction that starts from level sections, matching the trunk-to-thighs split ([junctions](../techniques/junction-and-seams.md#branch-patches)).
