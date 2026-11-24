# src/nature/createRock.ts#createRock

## @evidence contracts/development/implementation.md#principled-implementation

The kinds are the Udden-Wentworth cobble class, 64 to 256 mm, and the small to medium boulder classes, 256 to 1024 mm, so the drawn diameter is a grain size as a geologist states it. The irregular form is one convex cell from `irregularRockForm` whose X extent is that diameter; its mass is the cell's volume times the drawn specific gravity, from granite's measured 2.66 g/cm³ plus or minus one standard deviation, times water's 1000 kg/m³. The ball form keeps the sphere's volume, `pi d³ / 6`. The form's noise reads the stream `deriveAutoMovieSeed(deriveAutoMovieSeed(seed, "archetype", "rock"), "form")`, the scheme the draw session keys each dimension by, under a name no dimension uses, so it moves no dimension's draw; an absent seed draws seed 0's form. A cobble's grip closes on the centroid from -X with the whole X extent as its aperture; a boulder's top is the hull's highest corner and its side the half-height +Z exit point, both from the hull the cell admits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admits the kind, draws the dimensions, admits the form, builds one part of it, then lays the kind's contacts read from that part and builds with its mass. The form's geometry belongs to `irregularRockForm`, the draws to `AutoMovieArchetypeDrawSession` and the frames to `AutoMovieArchetypeFrame`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every band carries its cited reading. The irregular hull loses concavities; no facet a hand or a foot uses is lost by it. The ball form stays for a caller that asks for it by name; nothing is keyed on a seed or a test.

## @evidence contracts/development/common.md#meaningful-documentation

States both forms, how the stone rests, how its mass follows its size, each kind's contacts and where they lie, the seed's role and the refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

One part; the irregular form's 64 corners cost a 2,016-pair plan search and one hull, and the ball form costs one primitive.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the returned model, and acquires no handle or task.
