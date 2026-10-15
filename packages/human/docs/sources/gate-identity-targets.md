# Gate identity targets (lean 20-year-olds)

Measured bodies the four gate identities are converted to. Read in full text through Europe PMC.

| Identity | Source | Sample and method | Stature | Mass | BMI | Body fat | ALMI | Girths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Model woman | Park S. "Comparison of body composition between fashion models and women in general." *J Exerc Nutrition Biochem* 21(4):22-26, 2017 (PMC5772072), Tables 1 to 3 | 90 professional Korean fashion models, 24.4 years; ISAK protocol, skinfolds (Durnin and Womersley) | 177.9 cm | 54.3 kg | 17.1 | 24.2% (skinfold) | none | natural waist 62.2 ± 2.6 cm, hip 89.7 ± 2.4 cm, WHR 0.69 |
| Model man | Ralph-Nearman C. et al. "Is there a relationship between body mass index and eating disorder symptoms in professional male fashion models?" *Am J Mens Health* 18(5), 2024 (PMC11421395) | 62 professional male models, UK, 23.1 years; stadiometer, Tanita segmental bioimpedance | 187.0 cm | 76.6 kg | 21.8 | 10.8% (bioimpedance) | none | none measured |
| Muscular woman | Pettersson S. et al. "Off- to in-season body composition adaptations in elite male and female endurance and power event athletics competitors: an observational study." *BMC Sports Sci Med Rehabil* 16:90, 2024 (PMC11034045), Table 2, female power event athletes, off-season | 15 Swedish elite sprinters and jumpers, 22.4 years; GE Lunar iDXA | 171 cm | 64.2 kg | 22.0 | 19.3 ± 3.3% (DXA) | 7.73 (arms 5.2 + legs 17.4 kg) | none |
| Muscular man | Same study and table, male power event athletes, off-season | 17 Swedish elite sprinters and jumpers, 22.3 years; GE Lunar iDXA | 184 cm | 75.3 kg | 22.2 | 12.5 ± 1.6% (DXA) | 8.77 (arms 7.5 + legs 22.2 kg) | none |

Grade: measured. BMI is the sample's mean mass over its mean stature squared. Body fat methods differ (skinfold, bioimpedance, Lunar DXA) while Human's composition is on the scale of the NHANES Hologic DXA reference (Kelly et al. 2009).

## Why the muscular pair is not at the models' BMI

The muscular pair is meant to sit at the models' BMI with low DXA fat and a higher lean share: a fitness model's build, not a competitor's. At BMI 17 to 18 a woman cannot carry more limb muscle than the median woman. Among NHANES 2017-2018 women aged 18 to 30 (our reading of the public DXX, BMX and DEMO files), the 21 with BMI 16 to 18.5 had an appendicular lean mass index of 4.85 at the median and 5.96 at the 90th percentile, against 6.70 for all women of that age, and those with BMI 21 to 22.6 reached the overall median only at their 90th percentile. Holding even the median woman's fat-free mass index (16.4) at BMI 17.5 needs 6% body fat. That is below the 12.6% DXA that the female fitness competitors of Hulmi et al. (*Front Physiol* 7:689, 2017, PMC5222856, Table 3) reached on stage, at BMI 20.7. Elite female endurance runners in Pettersson's study, at BMI 19.6 and 16.7% fat, held only the median lean mass (ALMI 6.82). The lowest BMI at which a measured, non-competing sample of women carries above-median limb muscle at low fat is that study's power event athletes, at 22.0.

Men at the models' BMI do have such a sample: Pettersson's male power event athletes at 22.2. Their fat-free mass index (19.5) equals the male models' (76.6 kg at 10.8% fat over 1.87 m squared: 19.5), so at this BMI a man carries no more lean mass than a male fashion model, and the measured athletes carry more fat.

## Tolerances and resolution

The converter resolves body fat from adiposity and BMI from adiposity and muscularity, so it reaches two of a sample's composition values exactly and the others follow.

| Identity | Traits | BMI | Body fat | ALMI | Natural waist | Hip |
| --- | --- | --- | --- | --- | --- | --- |
| Model woman | stature 1779, adiposity -0.755, muscularity -0.71 | 17.1 (target 17.1) | 24.2 (24.2) | 5.33 | 640 mm (622 ± 26) | 902 mm (897 ± 24) |
| Model man | stature 1870, adiposity -0.943, muscularity -0.276 | 21.8 (21.8) | 10.8 (10.8) | 8.13 | 756 mm | 939 mm |
| Muscular woman | stature 1710, adiposity -1, muscularity 0.173 | 22.0 (22.0) | 20.7 (19.3 ± 3.3) | 7.17 (7.73) | 679 mm | 936 mm |
| Muscular man | stature 1840, adiposity -0.816, muscularity -0.274 | 22.2 (22.2) | 12.5 (12.5 ± 1.6) | 8.14 (8.77) | 768 mm | 943 mm |

Tolerances: BMI within 0.05; body fat within the sample's standard deviation; girths within the sample's standard deviation. The muscular woman's 19.3% lies beyond adiposity -1, two NHANES standard deviations below the median woman at 20 (35.1 - 2 × 7.22 = 20.7%), so she takes that floor, 1.4 points above the sample mean. ALMI is not a target: the converter scales the fat-free mass index with limb lean mass at the median person's ratio (2.43 in women, 2.39 in men), while these athletes carry more of it in their limbs (2.25 and 2.22), so at the measured BMI and fat the converter places 0.56 and 0.63 kg/m² less limb lean mass than DXA measured, within the samples' spread of about 0.9 (the arm and leg standard deviations added).

The model woman's natural waist and hip remain 18 and 5 mm above Park's models. The converter places Park's own control women (161.2 cm, BMI 20.6, 28.5% fat, 23 years) 15 mm above their measured natural waist of 66.3 cm and 16 mm above their hip of 90.5 cm, so that offset belongs to the sample, not to the tall, slim build: from the controls to the models the converter narrows the waist by 39 mm (measured 41) and the hip by 24 mm (measured 8).
