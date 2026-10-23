# Hair cards

Cards can be generated directly from a semantic scalp when no strand groom is available. Roots need stable surface attachment; deterministic guide formulas can supply length, direction, sag and curl. Opacity textures approximate bundles rather than individual physical fibres.

[Scheuermann's hair rendering](../sources/scheuermann-2004-hair.md) uses layered polygon patches, opacity, tangent-based highlights and ordered transparency passes. [Unreal's card generator](../sources/unreal-hair-card-generator.md) groups strands into cards, adapts segmentation to curvature and packs texture islands. They support the card representation, not a claim that Human implements their full shading or ordering.

Root-to-tip widths, curl radius, pitch and scalp clearance need physical lengths; segmentation approximates those curves rather than defining their dimensions. Head weights suffice for short attached hair. Long hair reaching the neck or shoulders needs a different deformation premise than a rigid head attachment.

Cards read as one hair mass only when their depth order follows the groom. Human gives every root nearly the same clearance and grows it with the length already grown, so a strand lies over the strands whose roots it passed; a random clearance per card of several millimetres interleaves neighbours at random and the mass breaks into stepped planks with their own highlights. Side-by-side cards keep a sub-millimetre jitter so they never share a depth.

Shading normals come from the mass, not from each card: the scalp chart's outward direction where hair lies on the head, a capsule about the chart centre (radial above it, horizontal below it) where hair hangs, and halfway to the body normal where it rests on the body. Per-card leans of a few hundredths of a radian still separate locks; leans of tenths give every card its own highlight band. Curl waves share a phase that varies smoothly over the scalp, so neighbouring cards wave together instead of crossing.

Ends need the same physical size on every card. The strand image reserves a root band, where strands start at scattered places and fade in, and a tip band, where strands end at uneven places, narrow and converge into clump points; each card maps them onto its first 8 mm and last 30 mm (at most a tenth and a fifth of its length), and the card's width narrows by half over the tip. Each root's length also varies by up to 4 percent, so ends never align along one cut, including a bob's level cut.

Hair below the head meets a height field of the body: the highest skin crossing of each vertical line, from every chain below the head and from the head chains' triangles below the menton, since those chains also loft the neck and its base over the shoulders. A strand reaching it settles at a clearance above it and slides down the surface under gravity without climbing; at steep places, including the step where the field drops from one surface to a lower one, it moves out horizontally instead of being lifted. A bob lays along the body the drop it still had to its level cut. A height field is single-valued, so an overhang or a surface facing down is not represented, and there is no collision between strands.

A hair-bearing boundary interpolated over azimuth and mirrored at the front and back midlines needs zero slope there, or the mirror folds it into a cusp, a notch at the parting. An opaque undercoat whose margin is a union of whole chart cells shows that grid as a staircase along the hairline; its edge follows the boundary curve instead.

Card geometry and a procedural strand image alone establish neither attachment nor acceptable coverage and appearance. Anisotropy and double-sided material channels alone do not establish convincing hair or correct transparent fringes.
