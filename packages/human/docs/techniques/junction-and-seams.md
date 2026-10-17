# Junctions and seams

Human joins cages before subdivision so a shared ring becomes an interior region of one limit surface. This avoids independently smoothed boundary normals. It does not establish anatomical flow, absence of folds or injectivity.

Both parts consume the same ring count, orientation, named anatomical start direction and skeleton frame. Equal-count rings are welded; count changes belong within the part. Silent resampling would change correspondence. UV cuts remain face-varying texture boundaries rather than physical cuts.

[Stam's limit evaluation](../sources/stam-1998.md) shows that the surface near a cut depends on neighboring cage controls from both parts. A part's isolated boundary appearance therefore cannot establish the joined shape. [OpenSubdiv](../sources/opensubdiv-documentation.md) explains extraordinary-vertex transitions and their curvature effects; placing a transition away from a broad lit field reduces visible waviness without proving anatomical correctness.

The head includes its facial network; the ear uses a separate shared attachment ring, and the neck-top ring lies in the mandibular plane. These choices preserve common boundary ownership. Head/jaw/nape and ear form, joined placeholder skin weights and the preservation of landmark measurement protocols remain unresolved. Actual joined-viewer observation and operating policy belong to the [Human skill](../../../../.agents/skills/human/SKILL.md).
