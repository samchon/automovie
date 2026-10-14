# US 6,222,553, hybrid subdivision in computer graphics

Pixar patent US6222553B1, "Hybrid subdivision in computer graphics" (DeRose, Kass, Truong). Read at https://patents.google.com/patent/US6222553 (the first 100,000 characters of the page).

## Licence and status

Google Patents lists it as "Expired - Lifetime", anticipated expiration 2017-08-04, which Google marks as an assumption rather than a legal conclusion. Human takes the method from the text.

## What it says

- Integer sharpness N: apply sharp (Hoppe) crease rules for the first N subdivisions, then smooth rules, then push to the limit.
- Sharp rules on the crease: new edge point r_i = R_i / 2 + S / 2; new vertex point s = R_j / 8 + R_k / 8 + 3S / 4.
- Fractional sharpness: linear interpolation between the neighbouring integer results.
- Varying sharpness along a crease: vertex values smoothed with weights 1/6, 2/3, 1/6.
- Geri's hand stored semi-sharp features with sharpness between 0 and 5, because "skin surfaces do not have infinitely sharp edges".

## What Human takes

Semi-sharp crease rules for the lip border, eyelid margin, nail fold and alar groove (`../techniques/subdivision-and-cage.md`).

## Not read

The SIGGRAPH 1998 paper "Subdivision surfaces in character animation" by the same authors could not be opened: the Pixar copy returned an HTML page and the University of Washington copy required a sign-in.
