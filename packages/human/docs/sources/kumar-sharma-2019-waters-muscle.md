# Kumar and Sharma 2019, enhanced Waters muscle model

Kumar D, Sharma D. "Enhanced Waters 2D Muscle Model for Facial Expression Generation." GRAPP 2019 (14th International Conference on Computer Graphics Theory and Applications), pp. 262-269, doi:10.5220/0007379302620269. Read from https://www.scitepress.org/Papers/2019/73793/73793.pdf; the equations were partly garbled by PDF text extraction.

## Licence

Copyright SCITEPRESS; method description only.

## What it says

- Waters (1987) modelled linear muscles that pull skin vertices within a zone of influence toward a fixed bony attachment, and one elliptical sphincter around the mouth that pulls vertices toward the ellipse centre; sheet muscles were described later (Zhang et al. 2001). The equations the paper uses come from Tanguy 2001 and Edge and Maddock 2001.
- Sphincter, in the plane: for a skin point P, epicentre c, semi-axes lx (major) and ly (minor), f = 1 - sqrt(ly² Px² + lx² Py²) / (lx ly) and g = |P - c| / lx; displacement D = f g when |P - c| > ly, else 0, so the centre does not collapse; the point moves by K D along the direction from P to c, with K a spring constant; lips bulge out of plane in proportion to K (1 - f g) scaled by a constant Z > 0. The paper used K = 0.3 and Z = 10.
- Known limits of the original Waters model listed by the authors: no sheet muscles, an unrealistic jaw rotation function, and an improper sphincter.
- The authors replaced the linear muscles around the mouth with sphincters because they produced unrealistic expressions, and used three sphincters (both eyes and mouth).

Grade: conventional (graphics method).
