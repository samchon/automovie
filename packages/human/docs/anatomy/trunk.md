# Trunk

## Landmark heights

The initial station shares are pooled ANSUR II means over the crotch-to-cervicale span. Crotch and cervicale are 0.4809 and 0.8605 of stature in this survey conversion. The person's measurements set cervicale, axilla and acromion. The neck-to-waist and side-neck-to-bust courses move the waist and bust stations in the tape solve. [ANSUR II trunk ratios](../sources/ansur-ii-trunk-ratios.md), [ANSUR II](../sources/ansur-ii.md)

| Landmark | Height as a share of stature, women and men | Share of the span |
| --- | --- | --- |
| Buttock point | 0.5118, 0.5054 | 0.073 |
| Omphalion | 0.6017, 0.6014 | 0.318 |
| Iliocristale | 0.6113, 0.6044 | 0.335 |
| Natural waist at the start of the solve | Midway between iliocristale and the tenth rib (0.6485, 0.6380) | 0.382 |
| Chest point | 0.7194, 0.7351 | 0.649 |
| Axilla | 0.7607, 0.7567 | 0.732 |
| Acromion | Regressions at the sexes' mean statures, 0.8199, 0.8203 | 0.894 |

The acromial and GH definitions are in the [arm anatomy](arm.md#shoulder-and-bind).

## Sections and masses

`AutoMovieHumanBackProfile` places the posterior median curve through two arcs and the lower sacral tangent. The person's kyphotic and lordotic angles turn the arcs. The published C7-to-PSIS chord and thoracic bending angle give the survey defaults. The trunk's station planes carry the supplied breadths and depths and set fullness by their tapes. `AutoMovieHumanChestWall` uses the compressed thoracic aspect ratio from Heinz's sex-specific tape fits and scales an ellipse to the underbust circumference. `AutoMovieHumanLumbarSection` transfers the ANSUR 1988 navel breadth and depth regressions to the nearest lumbar tapes. [Ohlendorf et al. 2023](https://www.nature.com/articles/s41598-023-27976-8), [Heinz et al. 2003](../sources/heinz-2003-body-dimensions.md), [ANSUR 1988](../sources/ansur-1988.md)

ESTIMATE: carry the upper arm's girth radius medially from the acromion for axillary support. A quintic blends chest-wall depth to the original neck cut, which supplies the receiving section and its jets.

At each trunk tape station, the conic fullness is a value. The inter-site rule uses the quintic with zero first and second derivatives at both endpoints. Its Bernstein controls repeat the endpoint values, so even the lowest and highest candidate tapes stay within the section's fullness range. The actual neck field supplies the two derivatives at its own station.

Breast and gluteal constructions use the positive depth increase above the adjacent bare-wall estimate. Their forward or back tip reaches the person's given chest or buttock depth. Breast centres use the given bust-point span. Their medial edge stops at the mean female sternal border measured by CT. The two intercostal spaces to the inframammary fold set the lower reach. ESTIMATE: use equal upper reach. Gluteal centres are at a quarter of the given hip breadth, midway between the side and the median. Their lateral and medial edges leave one fold radius of wall and their vertical reach uses the person's crotch and iliocristale heights. [Ateşoğlu et al. 2018](https://pubmed.ncbi.nlm.nih.gov/29345718/)

The starting gluteal footprint describes a soft-tissue mass. Cadaveric dissection shows thicker fat centrally and a smooth transition into the lateral thigh. MRI and dissection locate the fibrous fold on the medial third. ESTIMATE: keep the footprint's proportions and public apex, shortening the unmeasured footprint only when the person's actual trunk and proximal leg have no common AP root around it. The attachment's fold reach sets the search resolution. [Han et al. 2023](https://doi.org/10.1002/ca.23988), [Si et al. 2024](https://pubmed.ncbi.nlm.nih.gov/37220258/), [Stivala et al. 2021](https://pubmed.ncbi.nlm.nih.gov/33462737/)

The same original hip section constrains the leg's unmeasured outward and anterior lines. Each line copies its own parent contact's value and two derivatives, then reaches the first measured thigh station and preserves the distal source. Its positive control-hull span is determined by that contact's derivatives. The actual cuts from these lines and the two admitted gluteal masses supply the public hip tape solve.

The older tape and course solve uses centred elliptical trial sections, with the pooled ANSUR II depth-to-breadth ratios of 0.718 at the waist and 0.684 at the buttock. ESTIMATE: carry the nearer aspect ratio to the unmeasured high hip and crotch. The initial crotch width follows the adjacent buttock section unless a thigh tape and the junction's own girth ratio are supplied. This solve uses the same posterior posture law anchored to the actual neck cut and leaves the crotch wall smooth for the adjoining limb junctions.
