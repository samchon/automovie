# MakeHuman

MakeHuman is the comparison reference for "one fixed template plus offsets". Its code is never read (see `../decisions/makehuman-code-never-read.md`); this survey comes from its documentation, its FAQ, its licence statement and the file listing of its target folder, as recorded in the research notes on #2788.

## Base mesh

- One base mesh, hm08: body vertices 0 to 13379, with helper geometry (tongue, joints, eyes, teeth) appended. It has been unchanged for more than a decade and is shared by MakeHuman and MPFB (the MakeHuman Plugin for Blender).

## Shape

- Shape knowledge lives in artist-sculpted targets: per-vertex offsets from hm08, blended linearly.
- Macro targets in `makehuman/data/targets/macrodetails` on GitHub, counted from the folder listing:

| Group | Factors | Count |
| --- | --- | --- |
| Universal | sex 2 x age 4 x muscle 3 x weight 3 | 72 |
| Ethnic | 3 x sex 2 x age 4 | 24 |
| Height | sex 2 x age 4 x muscle 3 x weight 3 x min/max | 144 |
| Proportions | sex 2 x age 3 x muscle 3 x weight 3 x ideal/uncommon | 108 |
| All | | 348 |

- Each macro target is a whole-body alternate sculpt of hm08. Over 1,000 local modifier targets come on top.

## Proxies

- Eyes, teeth, brows, lashes and clothes are separate meshes whose vertices are bound by barycentric coordinates and offsets to hm08 triangles (the MHCLO format).

## Licences

- Code: AGPL-3.0 (MakeHuman) and GPL-3.0 (MPFB2).
- Assets, including the base mesh, targets and proxies, are CC0 since 2020, and exports are CC0.

## Use in the rebuild

- MakeHuman CC0 data may serve as an offline comparison reference only, never shipped or loaded.
- The proxy binding (barycentric coordinates plus offset on a body triangle) is the same family of technique as the garment binding in `../techniques/garment-binding.md`; Human takes it from the published cage-coordinate literature, not from MakeHuman.

## Sources

- https://static.makehumancommunity.org/mpfb/docs/assets/basemesh_and_helpers.html
- https://static.makehumancommunity.org/oldsite/faq/what_is_a_target.html
- https://static.makehumancommunity.org/oldsite/faq/what_changed_regarding_the_license_in_2020.html
- https://github.com/makehumancommunity/makehuman/tree/master/makehuman/data/targets/macrodetails
- https://en.wikipedia.org/wiki/MakeHuman
