# Centres and courses

Joint centres place articulated segments. A course carries the frames of a loft, and a section's scaling centre is the point that a tissue change holds. Each serves a different operation.

## The three centres of a part

| Centre | Definition |
| --- | --- |
| Joint centre | The origin of an articulated segment of the bind skeleton. A segment length places its far joint. |
| Loft centre line | The line about which the sections are charted and star-shaped. |
| Scaling centre | The point held by section scaling, commonly the skeleton's crossing of the section plane. |

`IFamily.centres` and `AutoMovieViewAxis.jointed` place the course. `IFamily.origin` shifts the section chart within its plane. Measure the offset in that chart. For an authored centre between joints, record its landmark and source segment frame.

A section's phase is its polar angle about the loft centre. Moving the centre changes that phase and the corresponding addresses of guides, reliefs, seeds and ports. `AutoMovieHumanConicRecentre` and `AutoMovieHumanConicReliefRecentre` carry the wall and reliefs into the changed chart. Re-read dependent loop and rail addresses in that chart.

## Material stations

A family's knots, tips, relief windows, rails and sites are stations of one material coordinate. `AutoMovieHumanCourseRuns.smooth` derives a map from the source run ends to the person's run ends. Each run has a length ratio. Across an interior centre the two ratios blend over the turn's half length. The map has continuous first and second derivatives and places every run end exactly. Exact placement can slightly change an adjacent run's ratio when another run changes length.

`AutoMovieHumanMaterialCourse.create` reads the person's course through this map, `G(s) = F(m(s))`. Its first derivative is `F'(m(s)) m'(s)`. Its second derivative is `F''(m(s)) m'(s)^2 + F'(m(s)) m''(s)`. An operator reading these derivatives must use the material station's speed when it needs an arclength derivative.

### The root a host owns

A limb's first centre can lie inside its host while its visible skin starts at the host's rail. Give the host-owned stretch a run with the same handoff on both courses. `AutoMovieHumanMaterialCourse.IHold` carries that handoff separately from the following bone run. The parent publishes the shared curve and its boundary derivatives. [Armscye as a shared-loop join](armscye-join.md)

## Trunk, neck and head

Level sections through the torso let horizontal bust, under-bust, waist and hip tapes read the same cut planes. Read neck girth on the plane its measurement definition specifies. The neck's own course separates changes to its reach from changes to the face and thorax. Where the jaw's floor grazes a candidate section, inspect the section's radial winding and the angle between the skin and the cut before accepting the course. [ISO 8559-1](../sources/iso-8559-1-2017.md)

Use the person's landmark heights to locate trunk spans and read segment lengths through the chain. Published population tables supply measurement definitions and distributions. [ANSUR II course measures](../sources/ansur-ii-course-measures.md) · [ANSUR II trunk ratios](../sources/ansur-ii-trunk-ratios.md) · [Joint logic](joint-logic.md)
