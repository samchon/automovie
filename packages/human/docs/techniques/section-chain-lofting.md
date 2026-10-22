# Section-chain lofting

This is the current generator design for campaign #2925. The JSDoc of `packages/human/src/lofting/` and `src/generation/` holds the formulas and premises; this note keeps the overall plan and its status.

## Plan

The body surface is a tree of chains, each a family of horizontal sections indexed by world height in the registered frame (forward +X, up +Y, lateral +Z, mm). Horizontal sections match the saved Recovery loft, which slices the neutral A-pose body along Y, so every observed loop belongs to one chain without reslicing.

1. **Universal lofting logic.** A section is a closed harmonic curve: a Fourier series for x(t) and z(t). Its constant terms are the section centroid, so the chain's central axis is part of the same function. A correspondence rule assigns the phase t: polar angle for limb and digit shafts, arclength from the front for contact parents such as palms, and half-arclength between the front and back sagittal crossings for the trunk and head. Between two principal layers, coefficients follow the cubic Hermite polynomial of their values and height slopes. Tessellation bisects each interval recursively and stops when the midpoint section lies within a physical chord tolerance.
2. **Body layers.** Each chain keeps only its principal layers. The observation fitter starts from a chain's two ends and bisects at the middle observation wherever the Hermite interval misses a recovered section by more than the tolerance. Principal layers therefore fall where the shape changes.
3. **Branch events.** Where loops merge (the axillae, the crotch, the finger webs), the parent's bottom section is a contact of its children's sections. The parent ring is split along pinch-phase arcs, and the children inherit those exact vertices. Each child then zips them to its own phase set in its first band, so parent and children share one boundary without seam copies. Chain ends close at recovered critical points: the crown and the fingertips.
4. **Addressable construction.** Every principal section is the curve `<chain>/<k>` and every axis is `<chain>/axis`. The skin is split per chain interval `<chain>/<k>`, so a viewer can select a curve and the skin it shapes (#2966).
5. **Parameter laws.** A body warp maps the calibrated geometry to a person:
   - Vertical landmark heights come from stature and inseam.
   - Limb subtrees stretch along their axes from the arm and leg lengths.
   - Section sizes scale radially from the girth inputs at their measured stations.
   - Region transforms blend smoothly across branch events, so shared boundaries stay shared.
   - The warp is identity for the calibration specimen. Its coefficients are refitted across f1, f2, m1 and m2.
6. **Progressive conquest.** The order is: whole-body outer form, then fingers (done), toes, ears, eyes and the mouth as further branch events, then the parameter laws, then f2, m1 and m2.

## Observation program

The fitter reads `test/.shots/<id>/hermite-curves.json.gz`. It joins open section pieces that cross the source's body and head mesh boundary into closed sections. Chains and merge events come from the loft's own interval correspondences, and pinch phases come from the contact sections. Merges whose children lie within 5 mm of the floor are contact patches and close flat; children spanning under 1 mm are tip bumps. Upward births under 1 mm, such as nail dorsums, are ignored. The fitter writes `src/generation/AutoMovieHumanBodyCalibration.ts`, the shared coefficients the generator reads.

## f1 observations used

The saved f1 loft has closed loops at every height except 1338 to 1404 mm. In that band the loops cross the body and head mesh boundary and are saved as open pieces; the fitter joins them. The striping over the shoulders in the ruled reverse render comes from this band. Topology events are:

- the crotch contact at 804.9 mm;
- the axillary contacts at 1276.6 mm;
- the finger merges between 920 and 958 mm;
- the floor-contact toe pads below 3 mm;
- facial and ear branches between 1490 and 1610 mm.

Horizontal slices do not separate toes lying on the floor. Separate toes need chains whose sections are perpendicular to the foot axis.

## Status

- **Generated:** trunk, legs, arms, thumbs and fingers, and the upper body with neck and head.
- **Provisional:** flat soles without separate toes, and the head as its outer section only (no ear, eye or mouth branches).
- **Parameters:** stature scales the body uniformly; the parameter-law warp is designed but not implemented.
- **Visual inspection:** not yet performed.
