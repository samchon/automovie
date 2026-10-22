# US 6,222,553, hybrid subdivision in computer graphics

Pixar patent US6222553B1, "Hybrid subdivision in computer graphics" (DeRose, Kass, Truong), https://patents.google.com/patent/US6222553.

## Licence and status

Google Patents lists it as "Expired - Lifetime", anticipated expiration 2017-08-04, which Google marks as an assumption rather than a legal conclusion.

## What it says

- Integer sharpness N: apply sharp (Hoppe) crease rules for the first N subdivisions, then smooth rules, then push to the limit.
- Sharp rules on the crease: new edge point r_i = R_i / 2 + S / 2; new vertex point s = R_j / 8 + R_k / 8 + 3S / 4.
- Fractional sharpness: linear interpolation between the neighbouring integer results.
- Varying sharpness along a crease: vertex values smoothed with weights 1/6, 2/3, 1/6.
- Geri's hand stored semi-sharp features with sharpness between 0 and 5, because "skin surfaces do not have infinitely sharp edges".
