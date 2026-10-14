# Face aesthetics

What makes a generated face read as attractive, and which classic rules are not supported. Feeds the beauty judgement of #2804 and the defaults of #2798 and #2799.

## Findings

| Finding | Evidence | Grade | Source |
| --- | --- | --- | --- |
| Averageness, symmetry and sexual dimorphism are attractive in both sexes and across cultures | critical review and meta-analyses | measured (meta-analysis, abstract read) | `../sources/rhodes-2006-facial-beauty.md` |
| On natural, unmanipulated faces, averageness predicts attractiveness in both sexes and femininity in women; symmetry and male masculinity do not predict it independently | objective shape measures, mixed models, white faces | measured | `../sources/lee-2025-averageness-femininity.md` |
| Effects found by manipulating face images shrink or vanish on natural faces | literature cited in Lee 2025 | measured (relayed) | Lee 2025 |
| Optimal spatial relations are the average ones: eye-to-mouth distance 36 percent of hairline-to-chin length, interpupillary distance 46 percent of inner-ear-to-inner-ear face width | paired comparisons on female photographs | measured | `../sources/pallett-2010-golden-ratios.md` |
| Even skin colour distribution draws attention and reads younger and more attractive, independent of shape and relief | eye tracking, standardized female faces | measured (abstract read) | `../sources/fink-2008-skin-colour-distribution.md` |

Rules for Human (derived from the table):

1. The default face for an identity is the population mean for its sex, age and pigmentation-linked reference population; every departure from the mean is an explicit parameter. Averageness is the one robust beauty rule, and it is free when the defaults are means.
2. Female faces gain from femininity (smaller jaw and brow ridge relative to face size, the female values in `../anatomy/head.md`); male faces do not need exaggerated masculinity.
3. Symmetry needs no special treatment beyond keeping generated asymmetry small and natural.
4. Skin maps of young identities stay homogeneous; age adds patchiness (`../anatomy/skin.md`).
5. Ratios are checks on a finished face, never generators.

## Classic ratios that the data reject

| Rule | What the data show | Source |
| --- | --- | --- |
| Golden ratio (phi) for face proportions | The phi construction gives 0.38 for both Pallett ratios; the preferred values are 0.36 and 0.46 and differ significantly from it | Pallett 2010 |
| Equal facial thirds (tr-n = n-sn = sn-me) | Kenyan adults: forehead height exceeded nasal height in every subject, and tr-n equalled sn-me in only 6 percent of men and 11 percent of women; Nigerians have a long upper and lower face and a short midface | `../sources/virdi-2019-kenyan-face.md`, `../sources/adekunle-2022-nigerian-3d.md` |
| Nasal height equal to lower face height | European-ancestry 3D norms: n-sn over sn-gn is 0.77 (men) and 0.82 (women) (derived from the means) | `../sources/weinberg-2016-3d-facial-norms.md` |
| Intercanthal width equals eye fissure width ("one eye between the eyes") | ratio 1.13 (European-ancestry 3D), 0.95 (Kenyan), 1.23 to 1.26 (Chinese in Gao 2025); valid in a third or less of Kenyan subjects | 3DFN, Virdi 2019, `../sources/gao-2025-periocular-chinese-caucasian.md` |
| Nasal width equals intercanthal width | true for no Kenyan subject; South African women's nasal width averages 124.5 percent of intercanthal width | Virdi 2019, `../sources/wilson-2023-south-african-women.md` |
| Face width equals five eye widths | zy-zy over en-ex is 4.8 (European-ancestry men), 4.7 (women), 3.9 (Kenyan), about 4.9 (Chinese men, Du face width over Gao fissure) (derived) | 3DFN, Virdi, Du, Gao |
| Mouth width 1.5 times nasal width | held in 6 percent of Kenyan men and 11 percent of women | Virdi 2019 |

Farkas's international study found mouth width, forehead height and ear height nearly identical across ethnic groups while nose and orbits varied most (`../sources/farkas-2005-international.md`): the features a canon would need to fix are exactly the ones that vary by population.

## Surgical ideals versus population means

Rhinoplasty ideals (`../sources/brito-2020-nasal-analysis.md`) such as a nasolabial angle of 95 to 110 degrees in women differ from measured means (85.6 degrees in South African women, 85.2 in Kenyan women, 104.2 in North American white women as quoted by Virdi). Ideals of one population and profession are not defaults; they can bound a "refined" style parameter at most.

## Open questions

- Neoteny (child-like proportions such as large eyes relative to face) as an attractiveness factor: Jones 1995 and related work were not accessed. The growth data in `../anatomy/head.md` and `../anatomy/eye.md` give the proportions a neoteny parameter would move toward (large vault and globe relative to face, short nose, small mouth).
- Male-specific ideal ratios: Pallett tested female faces only.
- Attractiveness evidence for East Asian and African faces with objective shape measures (Lee 2025 cites Japanese and Vietnamese studies, not read).
- Whether the population mean should be per ancestry group or a continuous blend; the parameter design question belongs to the identity, not to aesthetics.
