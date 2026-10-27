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

## Curl

The L'Oréal classification has eight types, I to VIII, defined from curve diameter, curl index, number of waves and number of twists ([callender-2026-curl-classification](../sources/callender-2026-curl-classification.md)). Types I to IV are separated by curve diameter; types V to VIII (curly and coily) also by curl index, waves and twists. The class thresholds were not in the text read. A helix radius and pitch can serve as guide controls, but the class label alone neither determines them nor requires a helical representation.

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
- A primary multi-ethnic scalp density source; the current data come from one Thai study with secondary comparison values.
- L'Oréal curl class thresholds.
- Lash length by lid position (centre longer than ends) and lift angles by ancestry; the Thibaut study cited by Aumond was not read.
- Brow hair length and density per square centimetre.
- Hair colour (eumelanin and pheomelanin in hair) and greying with age.
