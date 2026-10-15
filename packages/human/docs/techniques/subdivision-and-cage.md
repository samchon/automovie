# Catmull-Clark subdivision and quad cage design

## Refinement rules

From the Wikipedia article on Catmull-Clark (`../sources/wikipedia-catmull-clark.md`), for one refinement step:

| New point | Rule |
| --- | --- |
| Face point | Average of the face's original points |
| Edge point | (A + F + M + E) / 4: the two adjacent face points A, F and the edge endpoints M, E |
| Vertex point | (F + 2R + (n - 3)P) / n: n the valence of P, F the average of the n adjacent face points, R the average of the n incident edge midpoints |

After one step every face is a quad, and the number of extraordinary vertices stays constant afterwards.

## Smoothness and extraordinary vertices

- The limit surface is C2 at regular vertices (valence 4) and only tangent-plane (G1) continuous at extraordinary vertices (`../sources/wikipedia-catmull-clark.md`). On the regular part the surface is a uniform bicubic B-spline (`../sources/stam-1998.md`).
- Stam shows that Gaussian curvature takes arbitrarily large values near an extraordinary vertex and is infinite at it, so Catmull-Clark surfaces are in general not C2 there (`../sources/stam-1998.md`).
- OpenSubdiv recommends "mostly regular faces" and "few extraordinary vertices", warns that high-valence vertices (more than four edges) give wavy surfaces, and that a "revolution vertex surrounded by triangles" is wavy; cap a cylinder with quads only, keeping cap vertices at valence 4 (`../sources/opensubdiv-documentation.md`).
- OpenSubdiv's placement advice: a valence 5 vertex expands three edge loops into five, as around fingers; a pentagon gathers three or more diverging edge loops at high-deformation saddle points such as the arm-torso joint (`../sources/opensubdiv-documentation.md`).
- Bommes et al. (2013): placement of irregular vertices is crucial to quad mesh quality, is "especially stereotyped" for human heads and bodies, and depends on the intended use; edges in cylinder-like regions should follow principal curvature directions (`../sources/bommes-2013-quad-mesh-survey.md`).

For Human: every extraordinary vertex is a designed position in a part generator or in the junction's transition patch, placed where curvature is high anyway (around the eye, the mouth corner, the armpit saddle, the finger roots), never on a broad flat or gently curved field (the cheek, the abdomen, the thigh) where the curvature artifact shows in specular light.

## Edge loops

- Blender manual: edge loops "follow the natural contours and deformation lines of the skin and the underlying muscles" and "are denser in areas that deform more when the character moves, for example at the shoulders or knees"; loops stop at poles, the vertices with three, five or more edges (`../sources/blender-manual.md`).
- Bommes et al. cite Langer's lines (skin tension lines) as the feature lines for animatable human models (`../sources/bommes-2013-quad-mesh-survey.md`).
- OpenSubdiv: "In most situations, 6 spans are enough to create accurate circular shapes", so a limb tube needs far fewer cage spans than a polygon model (`../sources/opensubdiv-documentation.md`).

For Human, the cage layout rules that follow:

| Region | Cage rule |
| --- | --- |
| Limb tubes | Rings perpendicular to the bone; a fixed span count per ring shared across the junction; more rings near joints than mid-segment |
| Elbow, knee | Extra rings at the flexion crease so the cage has edges to fold on; crease side denser than extensor side |
| Shoulder, hip | Inside the trunk part; loops follow the deltoid and gluteal masses; the pentagon or valence 5 vertices that gather diverging loops sit in the armpit and groin saddles |
| Mouth, eyes | Concentric loops around the opening, following orbicularis oris and orbicularis oculi, ending in poles outside the loops |
| Fingers | Valence 5 vertices at the knuckle line expand the palm loops into finger tubes |

## Semi-sharp creases

- OpenSubdiv: sharpness 0 has no effect, 10 or more is infinitely sharp, values below 10 give "semi-sharp" creases and fillet-like blends "without adding extra rows of vertices"; prefer creases over extra edge loops, and values above 5 should rarely be needed; infinitely sharp creases are tangent discontinuities where displacement along normals can tear (`../sources/opensubdiv-documentation.md`).
- The hybrid subdivision patent behind Geri's Game: sharpness N applies sharp (Hoppe) rules for the first N steps and smooth rules after; fractional sharpness interpolates between neighbouring integer results; vertex sharpness along a crease is smoothed with weights 1/6, 2/3, 1/6; Geri's hand used values between 0 and 5 because "skin surfaces do not have infinitely sharp edges" (`../sources/us6222553-hybrid-subdivision.md`).

For Human: semi-sharp edges suit the lip vermilion border, the eyelid margin, the nail fold and the nasal alar groove, where skin has a tight but not infinitely sharp turn. Sharpness is a typed per-edge value in the cage, constant for the profile's topology, and may depend on identity (age softens the vermilion border).

## Limit surface and its evaluation

- Subdivided cage points are not on the limit surface, so normals from refined cages are approximations; points can be evaluated on the limit directly or "pushed" onto it (`../sources/opensubdiv-documentation.md`, `../sources/blender-manual.md`).
- Stam (1998) evaluates the surface and all its derivatives at any parameter value with eigenbasis functions, at a cost comparable to a bicubic spline, after subdividing until each face contains at most one extraordinary vertex (`../sources/stam-1998.md`).

For Human: subdivide the joined cage to the requested level, then push every vertex to its limit position and write the limit normal (cross product of the two limit tangents) as the vertex normal. Landmarks and measurements evaluate at semantic (face, u, v) coordinates on the same limit surface, so what is measured is what is rendered. Exact evaluation near extraordinary vertices (Stam) is needed only for landmarks placed there; elsewhere the regular bicubic patch formula is exact.

## Boundaries

OpenSubdiv offers boundary interpolation `EDGE_ONLY` and `EDGE_AND_CORNER` (`../sources/opensubdiv-documentation.md`). The joined skin is closed except at openings that stay open by design (mouth interior handled by a separate inner surface, eye openings meeting the eyeball). Such openings use edge-only boundaries so the lid margin curve stays smooth.
