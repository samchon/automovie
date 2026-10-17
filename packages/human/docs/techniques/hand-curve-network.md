# Hand curve network

Hand form shares longitudinal palm courses, skeletal MCP locations, digit-shaft sections and the thumb's thenar-to-web course. This keeps the palm and the free digits tied to the same dimensions rather than independently fitted patches. Reference meshes supply observations only; their vertices, topology and landmark indices are not Human assets.

## Correspondence

The wrist ring supplies the hand frame. A shape-preserving course through all four MCPs carries the palm's longitudinal coordinate, while both palm depth fields approach the same shaft dimensions and free-root levels used by the digit sweeps. An extra plane through one representative MCP cannot represent all four joint heads.

The thumb's thenar guides pass the belly, meet the actual MCP section and continue to the first-web cut on the same sweep. The cut derives from the bone chain and the pooled first-web-height/hand-length ratio in [Greiner's hand anthropometry](../sources/greiner-1991-hand.md). Its photographic wrist-crease baseline is approximated by the radial stylion datum. Holding that adult ratio across ages remains an assumption.

Semantic sections define feature positions independently of sampling rows. More rows improve approximation without defining anatomical dimensions. Physical and texture coordinates share block correspondence but have different meanings; see [UV layout](uv-layout.md).

## Observations and limits

Exact triangle-plane cuts retain every connected component; a millimetre-wide slab is only a flow illustration. Native reference transverse dimensions and rig-marker offsets remain in registered references, so their absolute perimeters are not individual fitting targets. The four lean adult registrations do not establish range coverage or clinical joint-centre accuracy.

The actual joined viewer still showed palm and thenar plates, root lobes, web ends, a wrist ridge and nail-tip defects recorded in [#2840](https://github.com/samchon/automovie/issues/2840). A private source preview's reduced finite-mesh crossings does not establish correction of those rendered defects. Anatomical form, material appearance and motion remain unresolved.

Viewer observation and operating policy belong to the [Human skill](../../../../.agents/skills/human/SKILL.md).
