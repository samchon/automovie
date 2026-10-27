# Surface composition

How the skin's parts combine ([#2993](https://github.com/samchon/automovie/issues/2993)). Every part is smooth by its own construction, and every combination is smooth by a formula; nothing is smoothed after the fact.

## Why one section per height fails

A horizontal section through the head at ear height holds the cranium, the face and both auricles in one closed curve. Where a feature protrudes, the curve turns sharply concave and, as the auricle detaches behind the helix, folds onto itself; the phase correspondence between neighbouring heights then slides, and a chain branch is needed where the helices leave. The loops, folds and ripples of the auricle, the sulcus behind it and the shelf beside each lateral canthus all come from this. A feature spread over tens of layers also cannot be transformed on its own: the nose cannot be lengthened or the ears resized without rewriting every layer they cross.

## Parts are modules

The logic is split before any curve is fitted. Each anatomical part (the cranium and face mass, the nose, each auricle, the thorax, each breast, each limb) is a module of its own:

- its own frame: the nasal dorsum's axis for the nose, the helix's arc for the auricle, the breast's axis for the breast, the bone for a limb;
- its own parameters (nasal length, projection and width; breast volume and ptosis; auricle size and angle), the handles any transformation, including a stylised one, acts on;
- its own feature curves and lofting sections, taken in its own frame rather than as world-height slices through the whole head or trunk;
- its own fit to the observations of its region.

A composer then joins the modules by the two rules below. Changing one module (a smaller nose, larger ears) touches nothing else.

## Two kinds of part

The decisive property is whether a feature can be written as a height over the surface under it.

1. **Relief** (nose, lips, brow, cheekbones, chin, breasts, buttocks, muscle masses): every point of the feature lies along the base surface's normal from exactly one base point. It is a displacement field `d(u, v)` over a chart of the base, so the skin is `S(u, v) = B(u, v) + d(u, v) n_B(u, v)`. With a C2 base and a C2 field the skin is C2 with no seam at all. The field is a tensor-product spline over the feature's chart, or a sum of compactly supported C2 bumps, vanishing with its first and second derivatives at the chart's edge. Its amplitude and shape parameters are the handles of a transformation (a smaller nose, fuller breasts, an exaggerated style).
2. **Appendage** (auricle, neck on the head, limbs on the trunk, fingers on the hand, toes on the foot): the feature overhangs the base or changes its topology, so no height field over the base describes it. It is a surface of its own with its own parameterisation: a sweep of sections along its own spine, such as the helix rim along its arc, a limb along its bone. It meets the base along a root curve, and a transition strip joins the two.

A relief that grows into an overhang (a large breast's inframammary fold) tilts its displacement direction before it becomes an appendage.

## Transition strips

Between an appendage's root boundary `A(t)` and the matching curve `C(t)` on the base, the strip is the Hermite blend in its cross parameter `w` from 0 to 1:

`T(t, w) = H0(w) C(t) + H1(w) A(t) + H2(w) D_C(t) + H3(w) D_A(t)`

with `D_C` and `D_A` the cross-boundary derivatives of the two surfaces (scaled to the strip's width) and `H0..H3` the cubic Hermite basis, or the quintic basis with the second cross derivatives as well. Matching the cross derivatives gives tangent-plane continuity (G1) along both edges; the quintic form gives curvature continuity (G2), which is what removes a visible line under raking light. This is the Coons-type construction of CAD fillets. A base that carries appendages is closed (the trunk down to the perineum, the palm and the sole at their distal ends) and every appendage roots in a closed loop on it, so the axilla is the arm's strip over the trunk, the crotch the trunk between the leg roots and a web the palm between two finger roots: no junction joins more than two surfaces.

An alternative for joints is the smooth union of implicit surfaces (convolution surfaces along a skeleton), which blends tubes into one another without explicit strips at the cost of the explicit parameterisation. It is a candidate to compare with strips at the shoulders and hips.

## Pose

Posed joints deform the composed rest shape: linear or dual-quaternion skinning carries the parts, and corrective shapes keyed on joint angles restore volume at the elbow, knee and shoulder. That belongs to the pose work ([#2947](https://github.com/samchon/automovie/issues/2947)) and acts on the composed skin, not on its construction.

## Composition of the head and body

- Head: cranium base (feature chains), face relief over a frontal chart (nose, lips, brow, cheeks, chin), auricles as appendages joined by strips, neck as an appendage below.
- Trunk: a closed thorax, abdomen and pelvis base with relief for breasts, buttocks and muscle masses, arms and legs as appendages rooted in closed loops on it, the neck a regular continuation.

## References

- Coons, S. A. Surfaces for computer-aided design of space forms. MIT Project MAC TR-41, 1967.
- Gordon, W. J. Spline-blended surface interpolation through curve networks. Journal of Mathematics and Mechanics 18, 1969.
- Bloomenthal, J. and Shoemake, K. Convolution surfaces. SIGGRAPH 1991.
- Kavan, L., Collins, S., Žára, J. and O'Sullivan, C. Skinning with dual quaternions. I3D 2007.
- Wang, W., Pottmann, H. and Liu, Y. Fitting B-spline curves to point clouds by curvature-based squared distance minimization. ACM Transactions on Graphics 25, 2006.
