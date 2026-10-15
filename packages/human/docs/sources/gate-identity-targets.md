# Gate identity targets (lean 20-year-olds)

Measured bodies the four gate identities are converted to. Read in full text through Europe PMC.

| Identity | Source | Sample and method | Stature | Mass | BMI | Body fat | ALMI | Girths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Model woman | Park S. "Comparison of body composition between fashion models and women in general." *J Exerc Nutrition Biochem* 21(4):22-26, 2017 (PMC5772072), Tables 1 to 3 | 90 professional Korean fashion models, 24.4 years; ISAK protocol, skinfolds (Durnin and Womersley) | 177.9 cm | 54.3 kg | 17.1 | 24.2% (skinfold) | none | natural waist 62.2 ± 2.6 cm, hip 89.7 ± 2.4 cm, WHR 0.69 |
| Model man | Ralph-Nearman C. et al. "Is there a relationship between body mass index and eating disorder symptoms in professional male fashion models?" *Am J Mens Health* 18(5), 2024 (PMC11421395) | 62 professional male models, UK, 23.1 years; stadiometer, Tanita segmental bioimpedance | 187.0 cm | 76.6 kg | 21.8 | 10.8% (bioimpedance) | none | none measured |
| Muscular woman | Santos D.A. et al. "Reference values for body composition and anthropometric measurements in athletes." *PLoS ONE* 9(5):e97846, 2014 (PMC4022746), Supporting Information S1 Tables 2 and 3 and S2 Tables 5, 7 and 19, athletics (sprinters, hurdlers and jumpers), medians | 16 Portuguese elite female athletes with DXA, 16 to 30 years; Hologic Explorer-W | 166.1 cm | none read | 21.3 | 18.4% (DXA; 25th to 75th percentile 16.0 to 20.8) | 7.66 (appendicular lean soft tissue index; 7.05 to 8.33) | none |
| Muscular man | Same study and tables, male athletics, medians and the 25th fat percentile | 11 Portuguese elite male athletes with DXA, 17 to 26 years; Hologic Explorer-W | 181.6 cm | 74.0 kg | 22.4 | 11.1% median, 9.2% at the 25th percentile (DXA) | 9.21 (8.44 to 10.06) | none |

Grade: measured. Santos's percentiles are empirical Bayes estimates that share information across sports. Body fat methods differ (skinfold, bioimpedance, DXA) while Human's composition is on the scale of the NHANES Hologic DXA reference (Kelly et al. 2009); Santos scanned on a Hologic, so the muscular pair's composition needs no cross-scanner reading. Pettersson et al. (*BMC Sports Sci Med Rehabil* 16:90, 2024, PMC11034045, Table 2) agree on a GE Lunar iDXA: Swedish elite power event women at BMI 22.0, 19.3% fat and ALMI 7.73, men at 22.2, 12.5% and 8.77.

## Why the muscular pair is not at the models' BMI

The muscular pair is meant to sit at the models' BMI with low DXA fat and a higher lean share: a fitness model's build, not a competitor's. At BMI 17 to 18 a woman cannot carry more limb muscle than the median woman. Among NHANES 2017-2018 women aged 18 to 30 (our reading of the public DXX, BMX and DEMO files), the 21 with BMI 16 to 18.5 had an appendicular lean mass index of 4.85 at the median and 5.96 at the 90th percentile, against 6.70 for all women of that age, and those with BMI 21 to 22.6 reached the overall median only at their 90th percentile. Holding even the median woman's fat-free mass index (16.4) at BMI 17.5 needs 6% body fat. That is below the 12.6% DXA that the female fitness competitors of Hulmi et al. (*Front Physiol* 7:689, 2017, PMC5222856, Table 3) reached on stage, at BMI 20.7. Elite female endurance runners in Pettersson's study, at BMI 19.6 and 16.7% fat, held only the median lean mass (ALMI 6.82). The lowest BMI at which measured, non-competing women carry above-median limb muscle at low fat is that of female sprinters and jumpers: 21.3 in Santos's sample and 22.0 in Pettersson's.

The muscular pair must be leaner and more muscular than the model pair at about the same BMI. Sprinters and jumpers are that build in men at the male models' BMI (22.4 against 21.8): a leaner quarter at 9.2% fat or less, and limb lean mass (ALMI 9.21) above the NHANES median man's 8.87, against the model man's 10.8% fat. Women take the lowest BMI argued above, where the female athletes carry 18.4% fat and ALMI 7.66 against the model woman's 24.2% and BMI 17.1.

## Tolerances and resolution

The identity stores body fat and the appendicular lean mass index, not BMI, so the muscular pair is resolved to those two and BMI follows; the model pair, whose lean mass was not measured, is resolved to body fat and BMI.

| Identity | Traits | Body fat | ALMI | Converter BMI | Natural waist | Hip |
| --- | --- | --- | --- | --- | --- | --- |
| Model woman | stature 1779, adiposity -0.755, muscularity -0.71 | 24.2 (target 24.2) | 5.33 | 17.1 (17.1) | 640 mm (622 ± 26) | 902 mm (897 ± 24) |
| Model man | stature 1870, adiposity -0.943, muscularity -0.276 | 10.8 (10.8) | 8.13 | 21.8 (21.8) | 756 mm | 939 mm |
| Muscular woman | stature 1661, adiposity -1, muscularity 0.409 | 20.7 (18.4) | 7.66 (7.66) | 23.5 (21.3) | 689 mm | 942 mm |
| Muscular man | stature 1816, adiposity -1, muscularity 0.127 | 10.0 (9.2) | 9.21 (9.21) | 24.5 (22.4) | 768 mm | 955 mm |

Tolerances: BMI within 0.05 and body fat exact for the model pair; ALMI exact and body fat within the sample's interquartile range for the muscular pair; girths within the sample's standard deviation. Both athletes' fat lies beyond adiposity -1, two NHANES standard deviations below the median person at 20 (women 35.1 - 2 × 7.22 = 20.7%, men 23.4 - 2 × 6.68 = 10.0%), so both take that floor, still below the model pair's 24.2% and 10.8%. The converter's BMI for the muscular pair reads 2.1 above the athletes' measured BMI: it derives the fat-free mass index from limb lean mass at the median person's ratio (2.43 in women, 2.39 in men), while these athletes carry more of their lean mass in their limbs (17.30 / 7.66 = 2.26 and 19.62 / 9.21 = 2.13). The girths read fat and limb lean mass, so this costs them only the fat mass index the extra BMI implies (0.4 kg/m² in women, 0.2 in men).

The model woman's natural waist and hip remain 18 and 5 mm above Park's models. The converter places Park's own control women (161.2 cm, BMI 20.6, 28.5% fat, 23 years) 15 mm above their measured natural waist of 66.3 cm and 16 mm above their hip of 90.5 cm, so that offset belongs to the sample, not to the tall, slim build: from the controls to the models the converter narrows the waist by 39 mm (measured 41) and the hip by 24 mm (measured 8).
