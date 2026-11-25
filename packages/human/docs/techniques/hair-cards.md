# Hair cards

Cards can be generated from a semantic scalp. Roots need stable surface attachment. Guide curves supply length, direction, sag and curl, and opacity textures represent bundles of fibres. [Scheuermann's hair rendering](../sources/scheuermann-2004-hair.md)

Specify root-to-tip width, curl radius, pitch and scalp clearance as physical lengths. Segment spacing approximates those curves. Short attached hair can follow head weights. Long hair reaching the shoulders needs body contact and its own deformation.

## Depth order and shading

Arrange card depth along the groom. Clearance can grow along a strand so that it lies over the roots it has passed. Keep neighboring cards at distinct depths.

Shade the cards with the normal of a smooth hair envelope. A positive kernel power mean can smooth the draped radii around the head without oscillating between samples. Where hair reaches the body, let the shading normal turn toward the body's normal. Below the head, a vertical envelope supplies the fall of a hanging cut. Check root clearance against the draped skin when the envelope spans a concavity or approaches an ear.

A fibre highlight follows the strand direction. A tangent discontinuity between cards can make their highlights read as stripes. Keep the guide directions and curl phase continuous across nearby cards. [Scheuermann's hair rendering](../sources/scheuermann-2004-hair.md)

## Ends

Give the texture separate root and tip bands. Scatter strand starts and fade them in across the root band. Narrow the tip bundles and end their strands at different places. Match the bands to physical distances along the card. Vary guide lengths across the groom so adjacent ends do not form a row.

## Body contact

A height field can represent the highest skin intersection along each vertical line. A hanging strand can settle above this height and slide down the surface. An overhang needs a contact representation that admits multiple crossings. Contact between strands also needs its own representation.

## Hairline

Place the frontal line, temples, sideburns, ear margin and nape from head landmarks. Use the trichion, nasion and exocanthion to locate the frontal and temple spans. An interpolated boundary reflected through the median plane needs zero cross-plane slope there for a smooth join. [Hair anatomy](../anatomy/hair.md)

The hairline transitions through shorter guides and finer bundles. The scalp layer can accumulate the optical thickness `tau` of guides close to the skin and use coverage `1 - exp(-tau)`. The coverage belongs to the scalp boundary, partings and whorls. This retains continuous opacity through the transition from a sparse edge to the hair mass.

## Representation and cost

Compare card density, transparency and strand detail with the same guides and camera. Record triangle count and the hair pass's GPU time separately from the rest of the figure. View the hairline, parting and silhouette at the distances where the representation will be used.
