# Shewchuk 1997, robust geometric predicates

Shewchuk JR. "Adaptive Precision Floating-Point Arithmetic and Fast Robust Geometric Predicates." *Discrete & Computational Geometry* 18(3):305-363, 1997, doi:10.1007/PL00009321; first issued as Technical Report CMU-CS-96-140, Carnegie Mellon University, May 1996. Read from the author's public-domain reference code, `predicates.c`, at https://www.cs.cmu.edu/afs/cs/project/quake/public/code/predicates.c: its header, `exactinit`, `orient2d` and `orient3d` up to the adaptive stage. The journal text was not read.

## Licence

The code is placed in the public domain by its author; the formulas are facts.

## What it says

- `epsilon` is the largest power of two with 1 + epsilon = 1 in floating point, found by halving; for IEEE double it is 2^-53.
- `orient3d(pa, pb, pc, pd)` is positive when pd lies below the plane through pa, pb and pc, below meaning pa, pb, pc appear counter-clockwise seen from above. It forms the differences to pd, the six products `bdxcdy`, `cdxbdy`, `cdxady`, `adxcdy`, `adxbdy`, `bdxady`, the determinant `adz (bdxcdy - cdxbdy) + bdz (cdxady - adxcdy) + cdz (adxbdy - bdxady)` and the permanent, the same sum with every product and coordinate taken absolute.
- The determinant's sign is certain when its magnitude exceeds `o3derrboundA * permanent`, with `o3derrboundA = (7 + 56 epsilon) epsilon`; otherwise the code continues in adaptive exact arithmetic.
- `orient2d` does the same in the plane with `ccwerrboundA = (3 + 16 epsilon) epsilon` against the sum of the magnitudes of its two products.

## Used for

`test/src/features/internal/HumanSkinIntegrity.ts` decides every orientation of its skin crossing test with these bounds and stops at the filter: a determinant within the bound is read as zero, so contact within rounding is never reported as a crossing, and a reported crossing has certain signs. It does not run the adaptive exact stage, so a configuration within rounding of touching is read as contact.
