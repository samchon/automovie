# Hair cards

Human generates cards directly because it has no stored strand groom to cluster. Roots and attachment use the emitted head's semantic coordinates; deterministic guide formulas supply length, direction, sag and curl. Card textures provide strand coverage and colour variation. This approximates bundles rather than individual physical fibres.

[Scheuermann's hair rendering](../sources/scheuermann-2004-hair.md) uses layered polygon patches, opacity, tangent-based highlights and ordered transparency passes. [Unreal's card generator](../sources/unreal-hair-card-generator.md) groups strands into cards, adapts segmentation to curvature and packs texture islands. They support the card representation, not a claim that Human implements their full shading or ordering.

Root-to-tip widths, curl radius, pitch and scalp clearance need physical lengths; segmentation approximates those curves rather than defining their dimensions. Head weights suffice for short attached hair. Long hair reaching the neck or shoulders needs a different deformation premise than a rigid head attachment.

Current cards and procedural strand images exist, but attachment, coverage and appearance remain unresolved. Anisotropy and double-sided material channels alone do not establish convincing hair or correct transparent fringes.
