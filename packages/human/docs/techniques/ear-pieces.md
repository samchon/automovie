# Ear pieces

The auricle is a folded fin standing on the side of the head, not a tube: a cut through it at any one height meets the helix's rolled rim, the antihelix's ridge and the concha's cup as separate rings. One chain of one closed section per layer cannot carry it. The ear is therefore a small tree of chains in its own frame, rooted on the head through the appendage strip, branched by ordinary events, and attached to a base envelope that has no ear in it.

## Frame and landmarks

The ear frame stands at the tragion: `n` the head's outward normal there (the T guide's normal), `a` the ear's long axis leaning back 17.5 degrees from vertical in the plane normal to `n` (Banks and Cheney's 15 to 20), `b = n x a` forward. Superaurale lies the ear length up the long axis from subaurale; subaurale at the subnasale's height under the tragion; the auricle's breadth (pra-pa) across `b`; its protrusion the rim's height over the head along `n`. The left ear is the construction; the right is its declared reflection `z -> -z` with phases run backward, rebuilt from the right ear's own inputs.

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
| piece | each ear chain alone in its frame | every section a simple closed or declared open curve; rim height over the head along `n` equal to the protrusion input within the head tolerance (ISO 20685-1, 1 mm); ear length sa-sba and breadth pra-pa at their Farkas definitions |
| seam | the strip on `head.middle` and the root chain (SEAM-12) | G2 across both edges: gap under 1 mm, normal angle under 0.1 degree, normal curvature jump under the visible limit |
| seam | the root's event into the four branches | G0 within 1 mm at every arc; G1 across each split |
| region | the head with both ears | no skin crossings at the attachments (`test_human_skin_integrity`); the root loop inside the T guide's band; XF-HD-6 order of superaurale, subaurale and the long axis's lean; mirror rebuilt from each side's own inputs (SYM-1, SYM-3) |
