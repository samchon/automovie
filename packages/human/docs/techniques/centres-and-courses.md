# Centres and courses

How a person's measures reach the figure's courses, what each course is centred on today, and what is decided and open for the trunk, the neck and the head. The JSDoc of `src/generation/f1/AutoMovieHumanF1Centres`, `AutoMovieHumanF1CourseLaw`, `AutoMovieHumanF1SegmentLengths`, `AutoMovieHumanF1NativeCourse` and `src/generation/conic/AutoMovieHumanMaterialCourse`, `AutoMovieHumanCourseRuns` holds the formulas.

Statements marked *measured 2026-11-17* were measured that day on f1 by the tools and tests named beside them; statements marked *recorded* come from that day's supervision record and were not re-measured for this note.

## The three centres of a part

| Centre | What it is | Where it lives |
| --- | --- | --- |
| Joint centre | The origin of an articulated segment of the bind skeleton. A segment length moves the joint centre at its far end. | `AutoMovieHumanF1Placing.CHAIN`, edited by `AutoMovieHumanF1SegmentLengths.chain` |
| Loft centre line | The line a family's sections are charted and star-shaped about. Today it is the course through the family's centres; `IFamily.origin` can shift it in the section chart without moving the section planes. | `IFamily.centres`, `IFamily.origin` |
| Scaling centre | The point of a section a tissue ratio holds still, where the skeleton crosses the section plane. | `AutoMovieHumanNativeFamily.ISpec.centre`, not passed by any caller yet |

A course centre that is no joint centre is either a landmark origin (the hip centres' midpoint, suprasternale, the bitragion midpoint, tragion, subnasale) or an authored datum stored in a segment's frame. `AutoMovieHumanF1Centres.inventory()` lists every centre of every family with its kind and its rule, and `AutoMovieHumanF1Centres.local` gives a datum's coordinates at a person: spread with its hand or foot, scaled with its digit's last bone, moved with the joint centre it is anchored to.

## Material stations

A family's knots, tips, relief windows, rails, sites and scale profiles are stations of one coordinate, the arclength of the reference's course. A segment length does not move any of those numbers. It stretches the stretch of course they are laid along:

- the person's chain moves the joint centres, and the assembly places each course's centres on it;
- the run between two consecutive centres keeps every station at its place within the run, and the next run translates (`AutoMovieHumanCourseRuns.smooth`): each run has one ratio, and across each interior centre the two neighbouring ratios blend over the turn's own half length, so the map and its first two derivatives are continuous and every run end goes to its run end exactly;
- the family is lofted on the person's course read through that map, `G(s) = F(m(s))`, with the frame's 2-jet by the chain rule (`AutoMovieHumanMaterialCourse.create`).

The course's speed is then the run's ratio and no longer one. The same pattern places the breast's projection (`AutoMovieHumanNativeProjectionCourse`).

Rejected, with the reason read in the code:

| Approach | Why it is not used |
| --- | --- |
| Map every knot, tip and window into the person's arclength (`ISpec.station`) | `AutoMovieHumanNativeFamily.create` falls back to knot-sampled controls for a non-identity map, and each protected junction, rail interval, root range and profile anchor then compares a function of the reference's stations with one of the person's. |
| The pose map (`AutoMovieHumanConicPose.map`) | It keeps slope one on every run, as a rigid bone under a pose needs, and puts a bone's whole change of length into the span of the turn before it; a bone shortened by more than that span is refused. `repose` takes `"material"` for a person and maps no station. |
| Piecewise-linear run map (`AutoMovieHumanCourseRuns.map`) | Its slope jumps at every run end, so a function composed with it loses its first derivative there. |

A consequence of exact run ends: a run beside a changed run takes a ratio slightly off one. With the knee's 40 mm half length and a shank 1.1 times as long, the thigh's ratio is `(L - 1.1 * 5 h / 32) / (L - 5 h / 32)`, 0.9986 on f1's 438 mm thigh, 0.6 mm over the whole run. The joint centres are exact; the stations between them are carried to within that.

### The root a host owns

A limb's first centre is its joint centre, inside its host, while its skin begins at a rail on the host's skin: the leg's first knot stands at station 104, on the trunk's end. The host places that rail, so the stretch up to it is a run of its own with the same end on both courses (`AutoMovieHumanMaterialCourse.IHold`), and the bone's run starts past it. The leg holds up to the middle of its root handoff and keeps the original course on its skin datum as its skin root.

*Measured 2026-11-17*: carried from the hip centre instead, a thigh 0.9 times as long lifted the leg's first ring 10.4 mm into the trunk's end, and the split's band folded along the rail, a level light line across each upper thigh (`family-conic-figure/2026-11-17T10-00-43.666Z/case-length-thigh-0.9/hip.front.clay.png`). `test_human_f1_native_course` holds both readings: 10.4 mm unheld, under 1 mm held with the held end exact. The arm has no hold yet: its root zone lies inside the shoulder turn's window, which is the armscye's redesign ([the armscye as a shared-loop join](armscye-join.md)).

A course whose speed is not one hands its children's bands a station jet that is not an arclength jet. Whether the split's, the continuation's and the port's band readers convert it was not checked; with the root held the leg's speed at its rail is 1.007.

### What is generated

| Length | State |
| --- | --- |
| Upper arm, forearm, thigh, shank, hand length and breadth, foot length and breadth, the fingers' and the thumb's bones | Generated through the arm's, the hand's, the leg's and the digits' courses. The limb's skin root follows the person's own course, carried by the root law (arm) or translated onto the same skin datum (leg), so the handoff from the root to the bone course keeps one set of section planes. |
| The same lengths on the arm's side, at the armscye | Refused by the shared-root law, *measured 2026-11-17* on the case with every limb length at 0.9: `arm: no sign bracket on the original root-facing source ray at column 95`. The armscye's loop is a recorded table (centre, semi-axes and one share per clock in the trunk's chart) that `AutoMovieHumanF1NativeRootLevel` re-levels per clock in the arm's caliper frame at station 42. f1's frame is bit-identical to the recorded basis, so f1 never runs the solve. With the elbow moved along the humerus the shoulder turn's angle changes, the frame at 42 tilts by about 0.07 degrees, and under the arm (trunk address [551.46, 1.642]) the level rises from 0.25538 to 0.25671 while it stands at 0.26078 at the loop's centre: the level is not monotone along the ray there, because the trunk's skin under the arm runs nearly along the arm's axis. Any moved arm is refused on that fold arc. The loop is to be the trunk's skin cut by a plane fixed in the thorax's frame (`test/src/reference-conics/FamilyConicArmscyeRule.ts`), generated for the person, with the shoulder's join; the levelling law is not repaired. |
| `pelvisToThorax`, `thoraxToHead` | Refused by name (`AutoMovieHumanF1NativeCourse.admit`). See the trunk below. |
| The root's height | Not generated. The pelvis is the chain's root and keeps its height, so a person's legs move the ankles off the floor by their change of length. The skin datums of the trunk's children are read in the reference's world (`skinPoint`), so a root-height law goes with the trunk's own course. |
| A person's lengths under a pose | Refused: the pose map and the material map are not composed yet. |

Toes have no bone lengths of their own: no source in this package gives them, so they follow the foot's length.

## Where today's courses stand

*Recorded*: every stored course is reproduced bit for bit from its centres; the courses stand off their sections' own centres by up to 41.5 mm on the trunk (20.9 mean), 29.4 on the arm, 31.0 on the leg, 23.8 on the hand and under 1.8 on the fingers; no turn of f1 folds, the least margin of the turn rule `h > (15 / 16) theta r` being 1.11 at the thumb's second joint.

The limbs' courses are bone lines with corners: the arm's leaves the thorax through two thorax datums (`armRoot`, `armTurn`) and reaches the bone line only at the elbow. By arithmetic on the stored chain's offsets (not a tool reading), `armTurn` stands about 22 mm lateral of the line from the glenohumeral centre to the elbow at its own height, so a longer upper arm turns the second run by about 0.4 degrees at +10 % and changes the shoulder turn's angle by as much. The half length follows it by keeping the turn's set-back (`AutoMovieHumanConicPose.halves`).

A section's chart phase is the polar angle about the course point, so the loft centre fixes the star-shape margin, the sampling round the section, every relief window, every port loop and seed. Moving a family onto its centre line is therefore a batch of its own with every dependent laid again: the wall converts exactly (`AutoMovieHumanConicRecentre.shift`), the nets need `AutoMovieHumanConicReliefRecentre`, and the loops, seeds and rails are read again.

## Trunk, neck and head

Today they are one family: 31 knots of a `bilateral(1)` tape hull on a straight two-centre course up the figure's vertical through its origin, level sections from 28 mm above the course's foot to the crown, and 21 height nets for everything inside the hull.

### Decided

- **Torso sections stay level.** ISO 8559-1 takes the bust, under bust, waist and hip girths horizontally, so a girth checks a lofted section only on level planes.
- **The sections are to be centred on the origin line**: the area centroids smoothed along the course at half the mean guide reach (`AutoMovieHumanF1TrunkCentre`; *recorded*: least back to front reach ratio 0.343 to 0.671, least star-shape margin 0.456 to 0.483, origin line slope at most 0.32 mm a millimetre).
- **The forms a level section cannot hold leave the trunk family**: lips, lids, the alae and the ear's folds become families of their own in the head's frame, and the breast one mound.

### Why a trunk length is refused

Three findings by landmark arithmetic on f1's trunk stations (the pelvis's origin at 124.8 mm, suprasternale at 635.5, the bitragion midpoint at 783.0, the course's end at 925.0), *measured 2026-11-17*:

1. The course has no joint station, and the datums stored in the thorax's and the head's frames are stations of it. With the run from the hip centres' midpoint to suprasternale stretched by one ratio, the arm's root datum (station 520) follows its thorax frame rigidly while the wall beneath it follows the run: 11.5 mm apart at +10 %.
2. Rigid blocks do not fit inter-person variation. Taking ANSUR II women's iliocristale and tenth rib heights as shares of trochanterion to suprasternale (0.310 and 0.436, from 995.7, 1056.3, 845.4 and 1329.7 mm in `docs/sources/ansur-ii.md`) puts f1's free waist between stations 283 and 347, 64 mm; a tenth more `pelvisToThorax` (51 mm) taken there alone is a local ratio of 1.8.
3. The neck is oblique. In front it runs from suprasternale (635.5) to the jaw (about 703, the station where the hull's front extreme rises from 58.8 to 97.2 mm between the knots at 696 and 716); behind it runs from cervicale (about 705, by ANSUR II women's cervicale and suprasternale shares of stature, 0.857 and 0.816) to the occiput (about 783). A level-section stretch between 636 and 703 stretches the neck's front and the upper back; one between 705 and 783 stretches the nape and the whole lower face.

Finding 3 is the measured need for the neck's own course. Finding 1 says what the torso needs within the one family: its segment origins as run ends (`AutoMovieHumanF1NativeSites.runs` already reads them), and the thorax's datums carried along the course by the same map.

### Open

- Which way the neck's and the head's sections face. Planes square to the neck's lean (f1's centre line leans up to 0.61 mm a millimetre between 646 and 740) are near parallel to the mandibular plane, which would lay the floor under the jaw along the sections. The choice needs the star-shape margin and the grazing angle of the jaw's floor over the candidate courses (`test/src/reference-conics/FamilyConicStar.ts`) before any refit.
- The head's height above the bitragion midpoint and the pelvis's below the hip centres have no field yet.

## Sources

| Source | Read | Used for |
| --- | --- | --- |
| ANSUR II, this package's notes `docs/sources/ansur-ii.md`, `ansur-ii-trunk-ratios.md`, `ansur-ii-course-measures.md` | read in part: the rows named above | Landmark heights as shares, segment length variation |
| ISO 8559-1:2017, this package's note | read in part: the girth definitions quoted in `AutoMovieHumanF1NativeSites` | Level girth planes, the neck girth's plane |
| `docs/techniques/joint-logic.md` | read in full | The turn rule, the neck's kind |
