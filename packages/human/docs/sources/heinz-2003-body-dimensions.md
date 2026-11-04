# Heinz et al. 2003, body dimensions with skeletal breadths

Heinz G., Peterson L.J., Johnson R.W., Kerk C.J. *Exploring relationships in body dimensions.* Journal of Statistics Education 11(2), 2003. Data: https://www.openintro.org/data/csv/bdims.csv (OpenIntro `bdims`, the article's data set). Read on 2026-11-04: the data in full.

## Licence

The article's data set is distributed by the Journal of Statistics Education's data archive and by OpenIntro for open use; only summary statistics and fitted coefficients are recorded here.

## Population and protocol

507 physically active adults, 260 women and 247 men, mostly in their twenties and thirties, measured by the authors. Skeletal breadths are caliper diameters given as the sum of the right and left sides, in centimetres: biacromial, biiliac, bitrochanteric, chest depth and diameter, elbow (biepicondylar humerus), wrist (bistyloid), knee (biepicondylar femur) and ankle (bimalleolar). Girths in centimetres: shoulder, chest, waist, navel, hip, thigh below the gluteal fold (mean of both sides), biceps flexed, forearm extended palm up, knee over the patella slightly flexed, calf maximum, ankle minimum, wrist minimum.

## Values (per side for paired breadths, mm; mean, SD)

| Measure | Women | Men |
| --- | --- | --- |
| Humerus biepicondylar (elbow) breadth | 61.9 (4.2) | 72.3 (4.4) |
| Bistyloid (wrist) breadth | 49.4 (3.3) | 56.3 (3.2) |
| Femur biepicondylar (knee) breadth | 90.5 (6.0) | 97.8 (5.4) |
| Bimalleolar (ankle) breadth | 65.2 (4.4) | 73.7 (4.7) |
| Forearm girth, extended | 237.6 (16.8) | 282.4 (17.8) |
| Thigh girth below the gluteal fold | 572.0 (46.4) | 565.0 (42.5) |
| Wrist girth | 150.6 (8.5) | 171.9 (9.1) |
| Knee girth | 352.6 (25.8) | 372.0 (22.7) |
| Stature | 1648.7 (65.4) | 1777.5 (71.8) |

## Fitted values (population-fitted from the data)

Ordinary least squares by sex, per-side breadth in mm on a girth in mm: elbow breadth = 23.05 + 0.1633 forearm (women, R2 0.43) and 29.23 + 0.1525 forearm (men, 0.38); wrist breadth = 5.41 + 0.2919 wrist (0.56) and 18.20 + 0.2213 wrist (0.40); knee breadth = 28.10 + 0.1770 knee (0.59) and 47.85 + 0.1343 knee (0.33). On stature alone the breadths fit weakly (R2 0.11 to 0.24). Forearm girth = 135.78 + 0.0618 S (women) and 165.47 + 0.0658 S (men), R2 0.06 and 0.07.

## Limits

A small, physically active sample: its thigh and other soft-tissue girths spread less than the Army surveys', so its bands are narrower than a general population's. Its knee girth is taken slightly flexed and its forearm girth palm up, near but not equal to ISO 8559-1 5.3.22 and the relaxed forearm girth.

## Direct protocol follow-up, campaign #3062

The original [JSE article](https://jse.amstat.org/v11n2/datasets.heinz.html), sections 2/3 and complete variable Appendix, was directly reopened. Limb diameters are paired sums, with firm tissue compression; paired limb girth rows average both sides. Forearm specifies extension/palm-up without locating a maximum station. Knee is slightly flexed over the patella. The common tape method delegates further detail to Behnke/Wilmore, not newly read here. These definitions do not turn Human's supplied right-side relaxed maximum or horizontal midpatella tape into those cohort observations; the distinction is retained in the complete input audit. No data rerun, new regression or coefficient was made.
