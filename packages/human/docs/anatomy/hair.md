# Hair, brows and lashes

Each value holds only for its cited population, posture and measurement protocol. Derived ratios are research constraints, not generator defaults or clinical identity.

This file gives hairline, scalp coverage, scalp hair, brow and lash values and direction rules. Card construction and shading are in [hair-cards](../techniques/hair-cards.md).

## Hairline

Contour classes ([zhang-2026-female-hairline](../sources/zhang-2026-female-hairline.md), after Suzan et al.; conventional classification, preference measured in Chinese raters):

| Type | Geometry |
| --- | --- |
| Round | Smooth concave contour, no distinct frontotemporal recession |
| M-shaped | Marked frontotemporal recession, lateral frontal line raised, frontotemporal angle usually under 90 degrees |
| Rectangular | Horizontal frontal margin, mild recession, frontotemporal angle 90 degrees or more |
| Bell-shaped | Normal forehead width, midline point about 2 cm higher than average |
| Triangular | Nearly straight line descending from the central forehead to the temples, vellus hairs along the edge |

Preferred proportions for women: hair-bearing height over trichion-glabella forehead height 0.505, width ratio 0.373.

Forehead height tr-g: Kenyan men 61.4 mm, women 55.4; South African women 60.2 mm. Forehead height tr-n: Kenyan 72.2 and 67.5 mm, Nigerian 69.1 mm ([virdi-2019-kenyan-face](../sources/virdi-2019-kenyan-face.md), [wilson-2023-south-african-women](../sources/wilson-2023-south-african-women.md), [adekunle-2022-nigerian-3d](../sources/adekunle-2022-nigerian-3d.md)). Virdi also relays North American white tr-n values, which do not follow the tr-g protocol.

Forehead over lower face (derived from Virdi's table): tr-n / sn-me is 0.980 and 0.924 for North American white women and men, 0.971 and 0.945 for Kenyan women and men, 0.938 and 0.913 for African American women and men; mean 0.945. It varies far less across these groups than tr-n itself (63.0 to 72.2 mm) or tr-n / n-sn (1.22 to 1.42), and it is the classical canon of facial thirds, which hairline design uses with the forehead set 5 to 7 mm longer than the lower third from the mid-brow ([jung-2014-female-hairline-correction](../sources/jung-2014-female-hairline-correction.md)).

Lateral landmarks of the frontal line (design rules, conventional): the temporal recession's apex aligns with the lateral canthus in the frontal view, and the temporal point lies at least 2 cm from the brow's tail, about 1 cm behind the canthus's vertical (Jung and Yun 2014, after Nusbaum); in Garg's rule of eight the frontotemporal point stands above the lateral canthus and the temporal peak 5/8 of the way from it down to the canthus ([garg-2017-hairline-design](../sources/garg-2017-hairline-design.md), surface distances, men with hair loss).

Transition zone: about 1 cm of single hairs at 50 to 60 per cm2 before the full density; exit angles rise from 15 to 20 degrees at the sideburn to 60 to 90 degrees beside the parting (Jung and Yun 2014).

## Scalp coverage

| Site | Density (hairs/cm²) | Diameter (μm) | Population | Grade | Source |
| --- | --- | --- | --- | --- | --- |
| Frontal | 154.3 (12.8) | 81.1 (6.9) | 239 Thai adults, trichoscopy | measured | [leerunyakul-2020-thai-hair](../sources/leerunyakul-2020-thai-hair.md) |
| Vertex | 162.9 (15.7) | 80.8 (5.9) | same | measured | same |
| Temporoparietal | 133.7 (14.6) | 80.1 (4.5) | same | measured | same |
| Occipital | 160.2 (15.3) | 80.3 (5.1) | same | measured | same |
| Frontal / vertex / occipital, Caucasian | 230 / 226 / 214 | | quoted trichoscopy study | measured (relayed) | same |
| Same, African | 160 / 149 / 148 | | quoted | measured (relayed) | same |
| Same, Hispanic | 174 / 178 / 169 | | quoted | measured (relayed) | same |

In the Thai sample density does not differ by sex and falls about 6 percent from the 20s to the 60s, while diameter holds near 80 μm. Temporoparietal density is about 18 percent lower than the vertex. Hair density and diameter constrain coverage but do not give a card count, because a card represents a bundle.

What the scalp shows follows from them (derived): fibres of diameter d rooted at density rho occlude the scalp as independent random occluders, so the share of scalp seen through hair is exp(-tau), tau the projected fibre area per scalp area of the hair lying over it. Beside a parting the hair rooted between the line and a point at distance x lies over it, tau = rho d x, so the scalp is half seen at x = ln 2 / (rho d): 5.6 mm at the Thai mean (152.8 per cm2, 80.6 μm) and 3.8 mm at the quoted Caucasian frontal density. A parting is a graded line a few millimetres wide on each side, not a strip.

The hair also shades the scalp it leaves visible (derived): diffuse light from the hemisphere above reaches the scalp along rays at angle theta from the normal, each crossing the optical depth tau along the slant path tau / cos(theta). The cosine-weighted mean of the transmittance is `L = 2 * E3(tau)`, E3 the third exponential integral, 1 for bare scalp and about a third where the scalp is half seen (tau = ln 2). The scalp layer's alpha is therefore `1 - T * L`, the hidden share plus the shade on what is seen. The shade assumes sky light; a single directional light replaces `L` by `exp(-tau / cos(theta_light))`.

## Curl

The L'Oréal classification has eight types, I to VIII, defined from curve diameter, curl index, number of waves and number of twists ([callender-2026-curl-classification](../sources/callender-2026-curl-classification.md)). Types I to IV are separated by curve diameter; types V to VIII (curly and coily) also by curl index, waves and twists. The class thresholds were not in the text read. A helix radius and pitch can serve as guide controls, but the class label alone neither determines them nor requires a helical representation.

## Standing hair

Hair leaves the scalp at an angle over the surface, and the angle rises toward the top of the head (Jung and Yun 2014, measured on patients; [jung-2014-female-hairline-correction](../sources/jung-2014-female-hairline-correction.md)): 15 to 20 degrees at the sideburn and the temporal point, 20 to 30 at the supratemporal line, 30 to 45 at the lateral frontal line, 45 to 60 at the central frontal line, 60 to 90 beside the parting. The generator takes the midpoint of each range and places the zones along the hairline from the front midline to the sideburn by convention.

How far a fibre stands before gravity bends it follows from its own stiffness and weight. A fibre of Young's modulus E and diameter d has the bending stiffness E pi d^4 / 64 and, at density rho, the weight per length rho g pi d^2 / 4; their ratio is the cube of one length, the gravitational bending length `(E d^2 / (16 rho g))^(1/3)`, about 50 mm for E near 4 GPa, d = 80.6 μm and rho = 1.32 g per cm3 (modulus and density are values relayed from the hair-science literature, not read here). A fibre of length l clamped at the exit angle theta0 is bent at its root with the curvature `l^2 cos(theta0) / (2 lambda^3)`, so the angle relaxes over the decay length `theta0` over that curvature: hair much shorter than lambda stands straight in its exit direction, hair much longer falls within millimetres of its root. For a 300 mm bob the decay length is 2.5 mm at the central frontal line and 5 mm beside the parting; for 70 mm hair about 40 mm. The stiffness depends on the physical length of the hair, not on the shortened guide that feathers the hairline's edge: using the feathered length made the short edge hairs stand straight and stick out like antennae.

A card shorter than it is wide is a patch, not a strand: it shows neither a root band nor a tip band, only a dark fleck apart from the hair (the two black dots at the frontotemporal corners were such cards). The minimum card length is the card's width.

## Brows

Form and direction ([rajput-2021-eyebrow-restoration](../sources/rajput-2021-eyebrow-restoration.md), conventional; [gray-1918](../sources/gray-1918.md)):

| Part | Length share | Position | Hair direction |
| --- | --- | --- | --- |
| Head | 10 to 15 percent (0.6 to 0.8 cm) | below the orbital margin | one or two staggered rows, vertical (pointing up) |
| Body | about 60 percent (2.5 to 3 cm) | arches up onto the orbital margin | upper-border hairs down and outward, lower-border hairs up and outward, crossing at the axis; middle rows along the axis |
| Tail | 20 to 25 percent (1.2 to 1.7 cm) | above the margin, beyond the lateral canthus | horizontal and outward, sloping down |

All brow hairs lie nearly flush with the skin ("directed obliquely on the surface", Gray), and density falls toward the tail. Brow lengths are 5 to 6 cm by 1 to 1.5 cm in men and 4.5 to 5 cm in women. The measured lower-margin arc is 69.5 (men) and 61.4 mm (women) in Caucasians and 68.5 and 62.0 mm in Chinese ([gao-2025-periocular-chinese-caucasian](../sources/gao-2025-periocular-chinese-caucasian.md)). The peak lies over the lateral limbus ([park-2017-eyebrow-ageing](../sources/park-2017-eyebrow-ageing.md)).

The direction field derived from the table uses a normalized position u along the brow (0 at the head, 1 at the tail) and v across it (-1 lower border, +1 upper). The hair angle from the brow axis is about 90 degrees at u < 0.12, converges as θ(v) ≈ -k·v in the body (upper hairs point down toward the axis, lower hairs up), and falls to a few degrees below the axis in the tail. Hairs bend into the skin tangent plane.

## Lashes

From [aumond-2018-eyelash](../sources/aumond-2018-eyelash.md) (measured, relayed) and Gray 1918:

- The upper lid has 90 to 160 lashes in five to six rows, the lower 75 to 80 in three to four rows.
- Length rarely exceeds 12 mm.
- Every lash curves from the bulb; upper lashes curve upward and lower downward, so they do not interlace on closing.
- Lashes root along the anterior lid margin and follow the lid in blinks (AU45) and closure (AU43), without intersecting each other or the opposite lid.

## Open questions

- European-ancestry tr-g and East Asian forehead height (trichion position) by sex and age, and male pattern recession by age (Norwood stages).
- The nape hairline's height and the margin over the auricle (no published distance found; both are conventions in the generator).
- A primary multi-ethnic scalp density source; the current data come from one Thai study with secondary comparison values.
- L'Oréal curl class thresholds.
- Lash length by lid position (centre longer than ends) and lift angles by ancestry; the Thibaut study cited by Aumond was not read.
- Brow hair length and density per square centimetre.
- Hair colour (eumelanin and pheomelanin in hair) and greying with age.
