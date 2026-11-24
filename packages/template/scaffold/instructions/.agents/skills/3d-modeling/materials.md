# Materials

Give a commissioned detail option its surfaces. A coarse form keeps its [entity colors](../development/entities.md#coarse-first).

Use record and canon materials in the installed format, and get other textures from [Sources](sources.md). Tag each color texture as color and each normal or roughness map as data.

Give a detailed surface without a sourced image a seeded `procedural` surface on its material, which generates wood, stone, plaster, clay, fabric or brushed metal. Set its `axis` along any grain, warp or brushing, and on a laid surface pattern set its `piece` from the occurrence's sheet.

Give a used object's material `wear` for paint chipped off convex edges and grime in concave creases. Darkening where separate objects touch comes from the film's [occlusion](../video/direct-film.md#indirect-light) instead.

The material types' JSDoc defines their fields. Judge materials in the beauty render and form in clay under [form inspection](inspection.md#light-and-material).
