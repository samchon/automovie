# src/sport/createVaultingPole.ts#createVaultingPole

## @evidence contracts/development/implementation.md#principled-implementation

One UCS Spirit series' length, the drawn diameter and the maker's stiffness rating (55 to 220 lb; the 305 series 90 lb). The pole bends as a chain of equal straight links on hinges about `+X`, the topmost link fixed and each hinge riding the one above, so a held top keeps its hand and the plant end rides the lowest hinge. The links are Godot's even-length tessellation of the arc (`Curve3D.tessellate_even_length`, godotengine/godot `scene/resources/curve.cpp` `_bake_segment3d_even_length` at eabb9a63d4bc70cd87e50d6af152f841ea549972, MIT): a segment is halved while longer than `tolerance_length` 0.2 m and at most `max_stages` 5 times. Each hinge travels the turn of the greatest curvature of the pinned elastica (`pinnedElastica`, Timoshenko and Gere 1961, §2.7) whose chord has shortened to `BREAK`, 60 % of its arc, the bend a fibreglass pole breaks past (Linthorne 2000), over one link: the integrated curvature of a link's dual domain (Bergou et al. 2008, §4.1). The grip bands are measured down from the top by the drawn hold and spacing, each riding the hinge of the link it lies on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the series, draw the dimensions, size the chain from the elastica, lay the links and their hinges, then the plant end, the two grips and the shaft on the links that carry them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No hinge carries a travel beyond the bend the pole breaks past. The grip bands' places are a vaulter's habit, marked provisional.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most five halvings, one bracketed root for the elastica's parameter, then `n` links and `n - 1` hinges.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the pole stands, its chain and how it is sized, each contact and the rating.