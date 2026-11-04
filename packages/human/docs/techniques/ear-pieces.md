# Ear pieces

The auricle is a folded fin standing on the side of the head, not a tube: a cut through it at any one height meets the helix's rolled rim, the antihelix's ridge and the concha's cup as separate rings. One chain of one closed section per layer cannot carry it. The ear is therefore a small tree of chains in its own frame, rooted on the head through the appendage strip, branched by ordinary events, and attached to a base envelope that has no ear in it.

## Frame and landmarks

The orientation site is the selected tragion height on the identical head mass's original side guide. Its analytic derivative defines the retained side-outline normal convention `n`. The measurement chord `a` leans back 17.5 degrees from vertical in that tangent plane (Banks and Cheney's 15 to 20); this is a geometric orientation convention, not an individually measured scalp normal. Placement does not move this site. The selected tragion X/Y and retained t-n norm resolve together. The unused private forward-centre estimate no longer supplies a nominal frame coordinate.

Superaurale and subaurale define the long measurement chord. They need not define the section normal: a regular cap with a tilted tangent plane cannot have its pole at the global Y extremum merely by translating its centre. The source plate therefore uses world-Y horizontal parallel planes, with X/Z drifting. Its endpoints close the selected height and sa-sba length, and every section stays at its own world height. The rolled helix's outermost envelope and the joined skin remain separate observations.

The public `IAutoMovieHumanEar.breadth` is Cho's c-j distance, from otobasion superius c to the posterior helix j, perpendicular to sa-sba. Those two points now occupy their actual distinct height stations; the input is not a horizontal section diameter or maximum pra-pa breadth. The selected c point lies on the actual head-source section. The tragal rim and another actual scalp point close `protrusion` on a declared world-lateral line at the tragion height. Cho's Methods/Figure 1 name scalp distances but do not specify a world-space normal vector; the lateral direction is the model's explicit convention, not a claim that the paper requires it. Left and right use the same construction with their own supplied measurements.

The former pra-pa wording contradicted the actual declaration and Cho's methods/Figure 1. Older numerical sa-sba/c-j checks did not establish top placement, the actual scalp endpoint or nonzero fork sections. The new candidate observes all of those emitted original points, the entire plate's signed guides/planes and declaration replay. Its complete curves and neighbours are not visually accepted yet. The helix, antihelix and two crura are swept source ridges with retained breadth/31 offsets. The fork is a regular nonzero section shared by all three courses; an overlap of the existing section's largest half extent precedes each hidden closing pole. This is a geometric port convention, not a new anatomical radius or proof of a successful join. Concha dimensions/depth have separate Cho/Zhu sites, with oval rim and placement conventions still explicit. The historical event/strip implementation below is debt, not the current engine-tree contract.

The plate now publishes one authoritative metre declaration with its evaluated part before another course reads it. Composer preserves that declaration. Named c/j/sa/sba sites are read at those actual source stations; independently recomputing a world height after mm-to-metre conversion can read an interior cap point rather than its endpoint. The public height and length remain independent expectations. The earlier failing input-height query and its difference from the actual named endpoint are retained in the observer, not clamped or hidden by a larger tolerance.

The outer plate curve is not a circular ridge's centreline. Controlled observation found the previous rolled rim approximately 0.91 mm above the selected top. The candidate offsets its centreline inward by the existing prior radius, projects concha's long direction into its actual rim plane, and bounds ridge supports by their declared radius. For the upper helix, a source-control solve uses the engine's natural coordinate curve and all its critical heights to close the centreline bound T-R. No mesh, reference or extra clearance enters this solve. Original span and whole-guide observations still judge the result; final outer-rim shape, c-j interpretation after joins and visual agreement remain separate.

## Chains

| Chain | Course | Section | Ends |
| --- | --- | --- | --- |
| `ear.root.<side>` | from the root loop on `head.middle` outward along `n` to the fin's base, a short trunk | the root loop's shape, closing toward the fin's footprint | bottom: appendage root on `head.middle`; top: event parent |
| `ear.helix.<side>` | the rolled rim from the helix crus over the top and down the back to the lobule | a rolled section: the rim tube's outer half and the scapha's floor, open toward the antihelix | bottom: the root's event arc; top: pole at the helix's free end above the lobule |
| `ear.antihelix.<side>` | the ridge from the antitragus up, forking into its two crura round the triangular fossa | a ridge section over the scapha and the concha | bottom: the root's event arc; top: a split event into its two crura, each closing at a pole under the helix |
| `ear.concha.<side>` | the cup from its rim (the antihelix's inner wall, the crus, the tragus, the antitragus) down to the meatus | the cup's ring, narrowing inward | top: the root's event arc; bottom: the ear canal aperture |
| `ear.lobe.<side>` | the lobule below the antitragus and the helix's tail | a flat oval thickening to the lobe's own thickness | bottom: pole at subaurale; top: the root's event arc |

Tragus and antitragus are bumps on the concha's rim (`AutoMovieHumanSeamUnion.bump`), the intertragic notch a dent between them (`AutoMovieHumanSeamCarve.dent`), the scapha and the triangular fossa dents on the helix's and the antihelix's sections. Every chain's layers are framed in the ear frame, so their stations run along the chain's own course, not along the body's height.

## Root and patch

- Root loop: on `head.middle`'s chart (station in mm, phase in radians), a periodic cubic B-spline through the otobasion superius, the preauricular line down through the tragion, the otobasion inferius, and the posterior auricular sulcus back up behind the concha. The loop lies on the T guide and is placed from the landmarks alone, so it never reads the ear's sections.
- Base: `head.middle` is cut as plain sagittal rings with no ear in them; the surface leaves the base out inside the loop (`IAppendage`).
- Strip: the appendage strip (`AutoMovieHumanBodyStrip`) runs from the root chain's bottom ring to the loop as the quintic Hermite of the two edges and their first and second cross derivatives, G2 to both. The strip adapts to the ear: its edge rows are the root chain's ring and the base's loop as each owner gives them, and `reach` and `rows` shape only its interior.
- Branches: the root chain's top ring is split by one event into the helix's, the antihelix's, the concha's and the lobe's arcs. `AutoMovieHumanBodySurface` resolves each chain end on its own (`boundary`: a root at one end, an event at the other), so a rooted chain may parent an event.

## What the shared loft must support

`AutoMovieHumanBodySurface` owns the appendage join and the event joins. The tree above needs the root chain to be both an appendage (bottom) and an event parent (top) and to carry framed layers. A framed appendage chain or a rooted event parent needs changes only in `boundary`, `join` and the frame read of the end ring (`context.ends`), because the code accepts each end's kind separately.

## Tests

| Level | Reads | Expectation |
| --- | --- | --- |
| piece | each ear chain alone in its frame | every section a simple closed or declared open curve; helix-to-scalp distance at tragus level equal to the protrusion input within the head tolerance (ISO 20685-1, 1 mm); ear length sa-sba and breadth c-j at their declared Cho landmarks |
| seam | the strip on `head.middle` and the root chain (SEAM-12) | G2 across both edges: gap under 1 mm, normal angle under 0.1 degree, normal curvature jump under the visible limit |
| seam | the root's event into the four branches | G0 within 1 mm at every arc; G1 across each split |
| region | the head with both ears | no skin crossings at the attachments (`test_human_skin_integrity`); the root loop inside the T guide's band; XF-HD-6 order of superaurale, subaurale and the long axis's lean; mirror rebuilt from each side's own inputs (SYM-1, SYM-3) |
