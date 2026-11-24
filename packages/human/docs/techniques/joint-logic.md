# Joint logic

A joint's form is the logic of the parts that meet there. This note records, for every joint of the figure, the surface anatomy that makes the form, the published centres and axes, the topology class, how the readable sources build it, a construction in this package's terms, the measures that drive it and how it behaves under a pose. It closes with the few joint kinds the fourteen joints reduce to.

Every source is marked `read in full`, `read in part` or `summary only` in [Sources](#sources). A statement taken from memory of a standard text is marked `summary only` there and is a lead to verify, not a basis for a constant.

## What the construction offers

The interface's construction types are the vocabulary every proposal below is written in.

| Element | What it expresses | Limit that matters at a joint |
| --- | --- | --- |
| `view` leaf | One section family from four outlines and a fullness owner along an axis | Each section touches its box once per side |
| Conic family (Human's `IFamily` through a `source` leaf) | Sections as conic chains through anchors; layouts `limb`, `lens`, `bilateral`, `inflected` and `featured` add inflection lines; reliefs; closed tips; a chart roll | Every section star-shaped about the course |
| `profile` leaf | A section family composed of oriented pieces in one declared plane, several loops, holes, per-loop poles | The record certifies no topology; each event still needs its admission |
| Axis `straight`, `level`, `parallel`, `curved`, `jointed` | The section plane along the stations; `jointed` turns at each interior centre over a stated half length by the quintic smoothstep of the angle, with an optional C2 roll | A turn is symmetric about its corner's bisector and passes inside the centre by its sagitta; the half length is a stated number |
| `port` | A child on a closed loop of a host's side: an ellipse on the host's chart with a share per column, a band to the child's rail (one station or a periodic `rails` curve), matched by angle or length, ribbons scaled in common or per column, depth `profiles` over clock windows | The loop is star-shaped about its chart centre; the band is G2 to both sides all round; a depth profile has one depth per point |
| `split` | Two or more children from one open end: nested seams between host phases, each a spline in its seam plane (`knots`, `heading`), corner turn, `reach`, `square`, fork `fair`; a child-side `crease` window where the band arrives C0 | The host's end is one ring; a child's rail is one station; seams are authored knots |
| `continue` | Two ends sharing one ring C2, or a band between unequal layouts | Ends are whole sections |
| `join` `merge` / `diff` | A part united with or cut from a host along their traced intersection, with a G2 blend between rails; widths `chord`, `chords`, `curvature`, `fold` (rolling-ball radius), `station`; seeds `point`, `search`; a mesh-space `fair` | The contact must be transversal all round a closed loop; a tangential contact is refused |
| `trim` | A through-cut along a loop through landmark feet | Nothing behind it |
| `fills` | A thin-plate disc of the drawn skin about a datum | It belongs to no surface and has no generating function |
| Known port record | A band pulled back from both neighbours' real fields over one rectangle | Declared in the interface; not a member of the node union |

## How the figure assembles its joints

| Joint | Present construction |
| --- | --- |
| Trunk, neck, head | One `bilateral` family on a straight axis from the floor to the crown, level sections; the jaw, the neck base and the face are reliefs and inflection lines of that family |
| Shoulder | The trunk is clipped at a sagittal armscye plane; the arm's course leaves square to it and turns down at the shoulder; a `port` band spans from a chart loop (ellipse with shares) to a 24-phase rail curve on the arm, ribbons per column; a `diff` cutter family digs the slit under the arm |
| Elbow, knee, ankle, ball of foot, interphalangeal joints | Turns of one family's `jointed` course (arm 65, 30, 10, 16 mm; leg 40, 62, 10 mm; digits 5 mm), with reliefs for the hollows |
| Wrist | The arm family ends before the wrist and a `continue` band joins the hand family, which shares the arm's course centres with a wider knuckle turn |
| Finger and toe rows | The hand's and the foot's open ends are `split` along nested seams whose knots are web depths read every 2 mm on the reference; bands land 3 mm into each digit; fork fairing over half to 0.7 of each seam's chord |
| Thumb | A capsule closed behind its first joint, `merge`d on the hand's side with a 0.5 mm blend and a 14 mm mesh fairing |
| Crotch | A `split` of the trunk's bottom end along the median seam, knots read on the reference midline, fork fairing |
| Nose | A `port` on the face with a 32-phase rail curve and four depth profiles read on the reference; each nostril a `diff` cutter |
| Ear | A lens-layout plate `merge`d on the head, helix and antihelix tubes `merge`d on the plate, a concha `diff` cutter, each merge with a mesh fairing |
| Breast | A `port` on the chest with a 1 mm rail and a fill at the fan point |

The provisional limb law (`test/src/reference-conics/FamilyConicLimbLaw.ts`) already writes the limbs as functions: a knot keeps its normalized station within its run between two course centres, a reach field is a shape prior times a C2 depth profile through tape sites, and conic shoulders and median shares are carried unchanged because they are affine invariants. The armscye rule beside it cuts the trunk's skin by a plane fixed in the thorax's frame, turned toward the scapular plane and placed a share of the arm's radius medial of the shoulder centre. Both are the pattern the joints below extend.

## Two derived rules used below

**Turn half length.** A `jointed` turn of angle `theta` over the half length `h` has the angle `theta S(s / 2h)`, `S` the quintic smoothstep, whose slope is at most 15/8. The course's greatest curvature is therefore `15 theta / (16 h)`. Sections square to a course stay apart on the concave side only while the reach `r` there is under the radius of curvature, the classical condition for a regular sweep or offset. So `h > (15 / 16) theta r`: the half length is a law of the turn angle and the flexor-side reach, not a stored number. At a rest elbow of 0.3 rad and 35 mm reach it asks 10 mm; at 2.6 rad it asks 86 mm, more than the segments hold, which says a deep flexion is a fold with contact and not a smooth sweep.

**Turn weight.** Within a turn the section frame is the proximal frame rotated by `theta S(t)`. The same `S(t)` is the distal bone's share of that station's rotation, so the turn law is the binding law: a point's material coordinate is its run share and phase, and its weight to the distal bone is `S` at its station. No weight has to be painted.

## Shoulder, armscye and axilla

**Form.** Bone ends: the acromion (point of the shoulder), the clavicle's lateral end, the humeral head under the deltoid, whose greater tubercle is the most lateral bony point with the arm hanging. Convex masses: the deltoid cap, fuller in front; the upper arm's biceps and triceps. Sheets: pectoralis major from the clavicle, sternum and cartilages to the crest of the greater tubercle, whose lower free border is the rounded anterior axillary fold; latissimus dorsi with teres major to the intertubercular groove and the lesser tubercle's crest, the posterior fold. Walls: the rib cage under serratus anterior medially, the humerus with coracobrachialis and biceps laterally. Fold: the axilla's skin floor between the two sheets' borders, a cleft when the arm hangs.

**Centres and axes.** ISB: thorax frame on IJ, PX, C7 and T8 with origin IJ; the humerus frame's origin is GH, the glenohumeral rotation centre "estimated by regression or motion recordings", its long axis from the midpoint of EL and EM to GH; "only the glenohumeral joint resembles a ball-and-socket joint". This package places GH under the acromion by de Leva's share. The arm's own course runs from GH to the elbow centre and extends medially of GH under the acromion, so the deltoid cap lies inside the arm's field. The thorax's course runs through the rib cage's section centres and its wall continues upward inside the axilla to the apex. Each sheet has its own centre line from the middle of its origin on the thorax to its insertion on the humerus.

**Topology.** Three things at once: a continuation with a turn over the cap (the shoulder top line runs on into the deltoid), two sheets over a wall with free-edge folds, and a fold between two walls beneath them. In level sections it is a branch event: below the vault the arm and the thorax are separate loops, at the folds' height they are joined by two webs round a hole, and above the apex they are one loop.

**Sources.** Tailoring's armscye is a loop through the shoulder point, both fold points and the underarm; ISO 8559-1 defines the armpit front fold point on the arm scye line. The Skin modifier makes a branch node's surface from its neighbours' frames alone and names concavity round a branch as the case it only partly handles. Implicit skinning replaces one blend by operators chosen per joint, with contact where skin meets skin (abstract and recalled). A tube ported on a cylinder with one band fails because the loop mixes an arc where the two surfaces are tangent (the cap, the folds' rolls) with an arc where they meet at nearly a half turn (the cleft): a strip G2 to both sides must make that half turn within its span, which folds it, and a cutter then digs what two walls should have made.

**Construction.**

1. The armscye loop is the trunk's skin cut by a plane fixed in the thorax's frame, as the armscye rule draws it; the arm's first section lies in the same plane, and the arm's course turns at GH with a half length by the turn rule.
2. The trunk publishes the shoulder top line and the two fold lines as contours shared with the arm, each authored once; the arm reads its intervals through the frame map, so the cap and the folds' rolls need no band to turn.
3. Each fold is an inflection-line pair on both sides of the loop: the roll's crest and the hollow's line under it. The crest runs from the sheet's origin end on the thorax to its insertion on the humerus.
4. Under the arm the thorax's wall and the arm's medial wall both run on past the loop to the vault line, which is their own intersection; the skin there is a rolling-ball fillet of a few millimetres' radius, the `fold` width's law.

Steps 1 to 3 use the `port` as it stands, with its loop sampled into shares and its rail curve. Step 4 needs the mixed join of [Missing kernel capabilities](#missing-kernel-capabilities): one loop with declared smooth arcs and traced fold arcs. Until then the nearest admitted form is a three-way `split` at the vault's level with the vault as the seam, which treats the armpit as the web it is, at the cost of dividing the trunk family there.

**Inputs.** Biacromial and bideltoid breadth, acromial height, axilla height, shoulder circumference, interscye I and II (ANSUR II); arm scye girth, across front and across back width, upper arm girth (ISO 8559-1). Fixed priors: the plane's turn toward the scapular plane, the fold radius, the sheets' insertion shares along the humerus.

**Pose.** Fixed in the thorax's frame: the armscye plane, the sheets' origins, the wall. Fixed in the humerus's frame: the insertions, the arm's wall. Functions of both frames: each fold line (origin end to insertion), the vault line (the two walls' intersection), the turn at GH. Re-evaluated at an abducted arm the fold lines lengthen and rise and the cleft opens, as the sheets do. The reference pose must not store the cleft's shape, the fold lines' coordinates or a cutter. Binding: the arm's wall to the humerus, the thorax's wall to the thorax, a sheet by its share between origin and insertion; the cap by the turn weight. The scapula and clavicle move GH itself (ISB gives their frames), so GH is a function of the girdle's pose, not a constant of the thorax.

## Elbow

**Form.** Bone ends: the olecranon behind, the medial epicondyle (the more prominent) and the lateral epicondyle, the radial head's dimple below the lateral one. Masses: the lateral brachioradialis and extensor mass rising a third of the way up the arm, the medial flexor and pronator mass from the medial epicondyle. Fold: the cubital fossa between them with the biceps tendon, and the flexion crease.

**Centres and axes.** ISB treats the humeroulnar joint as a hinge about the humerus's `Z` axis, which "preferably" approximates the flexion axis; EL and EM are the most caudal points of the epicondyles; the carrying angle is a passive response to flexion. De Leva places the centre 0.0432 of acromion-radiale above radiale. The upper arm's control curves run distally past the centre to the end of the condyles; the forearm's run proximally past it to the olecranon's tip and the two muscle masses' origins above the epicondyles.

**Topology.** A hinge continuation: one family, a turn about the hinge axis.

**Sources.** Sweep-based deformation interpolates key cross-sections with their own frames and binds every vertex to its section by angle, parameter and offset; the 2005 human paper adds bone protrusion, muscle bulge and skin folding (abstract). A tube and a band fail by rounding the corner evenly: the olecranon and the fossa are opposite in sign on the two sides of one section.

**Construction.** One family across the joint, as now. The half length by the turn rule. The olecranon and the two epicondyles are bone-end features: an inflection-line pair or a C2 relief window each, placed in the bone's frame at the ISB landmark and sized by the bone's breadth. The fossa is an inflection line between the two forearm masses, running from above the joint to the forearm's belly. Nothing is missing in the kernel for the rest pose.

**Inputs.** Acromion-radiale and radiale-stylion lengths, forearm circumference flexed (ANSUR II); elbow girth (ISO 8559-1). No public source in this package gives the epicondylar breadth or the prominences' heights, so they stay shape priors.

**Pose.** Fixed in the humerus: the epicondyles. Fixed in the ulna: the olecranon, which leaves the humerus's back as the elbow bends. Functions of the angle: the turn, the half length, the fossa's depth. Weight by the turn law. The reference pose must not store the carrying angle or the rest flexion in the wall's knots.

## Wrist

**Form.** Bone ends: the ulnar head on the back's ulnar side, the radial and ulnar styloids, the pisiform. Tendons: palmaris longus and flexor carpi radialis in front, the extensors behind. The section is twice as wide as deep, narrower where it joins the forearm, with a step down from the forearm's back to the hand (Bridgman). Folds: three palmar creases, the middle over the wrist joint (Gray).

**Centres and axes.** ISB: the forearm frame's origin is US, its long axis toward the midpoint of EL and EM; global wrist motion is the third metacarpal relative to the radius, neutral when its long axis is parallel to the radius's; pronation turns the radius about the ulna. De Leva places the centre 1.5 mm distal of stylion. The forearm's curves run to the styloids' tips; the hand's start at the proximal carpal row.

**Topology.** A continuation with a two-axis turn and a twist proximal to it.

**Construction.** One shared ring at the wrist crease in the plane square to the forearm's long axis, owned by the forearm; the hand's family takes its own course from the wrist centre to the third knuckle. Where the two layouts differ the existing band joins them. The ulnar head and the styloids are bone-end features in the forearm's frame.

**Inputs.** Wrist circumference, radiale-stylion length, hand breadth (ANSUR II); wrist girth (ISO 8559-1). Prior: breadth over depth.

**Pose.** Pronation is the course's `roll` as a function of the angle, growing from the elbow to the wrist, so the radial styloid travels round the ulna while the ulnar head stays. Flexion and deviation are turns at the wrist centre. The reference pose must not store the forearm's twist in the section fields.

## Metacarpophalangeal row and finger webs

**Form.** Bone ends: the four metacarpal heads, arched about the thumb's base, the third the highest. Tendons: the extensors over each head, with valleys between. Fat pads: the distal palmar pad. The web forms an inclined triangular region from the dorsal metacarpophalangeal joint to the distal palm, with a curved dorsal outline in abduction. The person's own sections supply the extent and slope. [Digital web measurements](rule-basis.md#digital-webs).

**Centres and axes.** ISB: each metacarpal's and phalanx's origin lies midway between its base and head at the tube's centre, its long axis from the head's centre to the base's midpoint; flexion is about the proximal segment's `Z`. The joint centre is the head's centre. Each finger's own section family begins at that centre, inside the hand, not at the web; the hand's family ends where its section stops being one star-shaped loop, at the dorsal forks.

**Topology.** A branch node with four children on one open end, each neighbouring pair joined by a web.

**Sources.** The Skin modifier gives a branch node no frame of its own and hulls its neighbours' frames, so the node's surface is made of the children's root sections; it needs intermediate frames between adjacent branch nodes and repairs concave results after the fact. Sweep-based deformation binds a child's first key cross-section to a cross-section of its parent by angle, parameter, offset and orientation. Dust3D sweeps a cut-face template along nodes and unites parts by a mesh Boolean. Bands from a ring cut by chords to rings 3 mm down each finger fail because the loop and the ring are different curves in different planes: the strip takes up the difference as a collar, a pocket in the web or a spike at the fork.

**Construction.**

1. Each finger publishes its root section at the web's level, cut by the plane the hand declares for its end, through the frame map from the finger's bone frame.
2. The hand's end section is the composition of those root sections in that plane: each lobe's extremes are a finger's own, and the valleys between knuckles are inflection lines of the hand's wall that deepen to the forks. The forks are then points of the wall's own lines and need no fill.
3. Each seam is the web by rule: in the plane bisecting the two neighbours' proximal-phalanx axes, from the dorsal fork at the heads' level to the palmar edge at the middle of the shorter proximal phalanx, with a saddle radius of half the gap between the two root sections.
4. Each child's loop is its own tube cut by its two bisector planes and the end plane, so the loop and the rail are offsets of one curve and the band is a short even strip.

Steps 1 and 3 fit the present `split` (seam `heading`, knots generated by the rule and scaled with the chord). Steps 2 and 4 need a composed end and an oblique child rail.

**Inputs.** Hand breadth, hand circumference, hand length, palm length (ANSUR II); hand breadth at metacarpals, index finger breadth proximal (ISO 7250-1); phalanx lengths (Buryanov). Priors: the web's slope and its share of the proximal phalanx, the knuckle arc.

**Pose.** Fixed in each phalanx's frame: its root section. Fixed in the hand's frame: the heads, the end plane. Functions of two fingers' frames: each bisector plane and seam, which open as the fingers spread and roll as one finger flexes past its neighbour. Weights: a finger's root by the turn law about its own flexion axis, a web by its share between its two fingers. The reference pose must not store web depths, fork fairing or the spread.

## Thumb base

**Form.** Bone: the first metacarpal lies inside the thenar mass, at an angle to the palm, never flat with it; the carpometacarpal joint is a saddle (Gray, Bridgman). Masses: the thenar eminence, larger and rounder than the hypothenar; the first dorsal interosseous between thumb and index. Sheet: the first web, from the thumb's metacarpophalangeal joint to the index's radial side.

**Centres and axes.** ISB adopts Cooney's trapezium frame for the first carpometacarpal joint: `Y` from the midpoint of the trapezial saddle's central ridge to the junction of trapezium, scaphoid and trapezoid, `X` dorsal to volar. The thumb's family starts at that joint, so the thenar is the thumb's own wall.

**Topology.** A branch node at the carpus with two children, the thumb ray and the palm block, and one long web.

**Construction.** The carpus, a short parent from the wrist ring, is `split` into the thumb ray and the palm; the seam is the first web by the web rule, in the plane bisecting the first and second metacarpals. The palm block's far end is the finger row above. A capsule merged on the hand's side cannot make the thenar continuous: the merge needs a transversal contact all round, while the thenar runs on into the palm.

**Inputs.** Hand breadth and circumference; the first metacarpal's share of the third (Reddy). Priors: the saddle's resting abduction, the web's edge share.

**Pose.** Fixed in the trapezium's frame: the joint; in the first metacarpal's: the thenar wall. Function of both: the web's seam, which spans up to a right angle between the metacarpals in abduction and folds in adduction. The reference pose must not store the web as a blend or a faired disc.

## Interphalangeal joints

**Form.** Bone ends: the phalangeal heads, square where the shafts are narrower (Bridgman). Folds: dorsal wrinkles in extension, palmar creases, which do not all lie opposite the joints. Fat pads: the palmar pads, of equal length.

**Centres and axes.** ISB: a hinge about the proximal phalanx's `Z`, the centre at the head's centre.

**Topology.** A hinge continuation.

**Construction.** As the elbow: one family per digit, the half length by the turn rule with the palmar reach, the heads as bone-end features, each crease an inflection line across the palmar side at its published place.

**Inputs.** Phalanx lengths; finger breadths. Prior: the joints' breadth over the shaft's.

**Pose.** A finger bends past a right angle, where the turn rule fails by its own arithmetic: the palmar pads meet, and the two walls keep distinct sheets in contact. Weight by the turn law.

## Hip, groin, gluteal fold and crotch

**Form.** The iliac crest, anterior superior iliac spine and greater trochanter locate the pelvis and thigh. The gluteus maximus, adductors and tensor fasciae latae shape the surrounding masses. The inguinal ligament gives the anterior direction between the iliac spine and pubic tubercle. The visible inguinal crease follows its own skin course, which can sit distal to the ligament. The infragluteal fold has discrete anchors near the pubis and ischial tuberosity. The perineal web connects the medial thighs. [Trunk crease histology](https://pmc.ncbi.nlm.nih.gov/articles/PMC4815355/), [Takaya et al., infragluteal dissection and radiography](https://doi.org/10.1002/ca.70198).

**Centres and axes.** ISB: the hip's centre of rotation is the pelvic frame's origin, found functionally or by prediction; the pelvic frame on both anterior spines and the posterior spines' midpoint; the femur's long axis from the epicondyles' midpoint to the centre. This package predicts the centre by Hara's regression. The thigh's course starts at the centre, about 65 mm above the crotch, inside the trunk.

**Topology.** A branch node with two children and one web, a mound with a fold behind (the buttock on the thigh) and a hinge fold in front (the groin).

**Construction.** The `split` as it stands, with the seam by rule: the median plane, its depth profile a law of the crotch lengths, front and back. The gluteal fold is the child-side `crease` window the split already declares, placed in the pelvis's frame. The buttock is a mound whose upper arc runs on into the back and whose lower arc is that fold.

**Inputs.** Crotch height, crotch length (omphalion) and crotch length posterior (omphalion), buttock circumference, depth and height, thigh circumference, trochanterion height, hip breadth (ANSUR II); inside leg length, thigh girth (ISO 8559-1).

**Pose.** Fixed in the pelvis: the centre, the seam's plane, the inguinal line, the buttock's origin. Fixed in the femur: the thigh's wall. Functions of both: the gluteal fold, which flattens out in flexion, and the groin crease, which deepens. The reference pose must not store either fold's depth.

## Knee

**Form.** Bone ends: the patella with a hollow on each side, the tibial tuberosity, the femoral condyles, the fibular head a little above the tuberosity's level and behind. Masses: vastus medialis, which overhangs the knee on the inside. Tendons: the hamstrings bounding the popliteal fossa, the patellar ligament. The joint line lies above the patella's apex in extension (Gray).

**Centres and axes.** The femoral frame's long axis ends at the midpoint of the epicondyles (ISB), which this package takes as the knee centre; de Leva's offset places it above tibiale. The thigh's curves run to the condyles' ends; the shank's start at the tibial plateau and carry the tuberosity.

**Topology.** A hinge continuation.

**Construction.** One family, as now; the half length by the turn rule. The patella is a bone-end feature tied to the tibia by the ligament's constant length, the tuberosity and the fibular head features of the shank, the two hamstring tendons an inflection-line pair behind.

**Inputs.** Knee height midpatella, lateral femoral epicondyle height, tibial height, lower thigh circumference, calf circumference (ANSUR II); knee girth (ISO 8559-1).

**Pose.** The patella rides the femur's groove at a fixed distance from the tuberosity, so its place is a function of the angle. The fossa is a function of the angle. Weight by the turn law.

## Ankle

**Form.** Bone ends: the medial malleolus, higher and further forward; the lateral, lower and further back; the calcaneus. Tendons: the calcaneal tendon with a furrow on each side, tibialis anterior and the extensors in front.

**Centres and axes.** ISB: the ankle complex's origin is IM, midway between the malleoli's tips MM and LM, the flexion axis the line MM to LM. The shank's curves run down to the malleoli's tips; the foot's course runs from the heel's rearmost point to the ball, behind the centre as well as before it.

**Topology.** A hinge continuation through nearly a right angle; seen from the foot, a part (the shank) coming out of the foot's back.

**Construction.** One family through the turn, as now, with the half length checked by the turn rule against the instep's reach; the malleoli as bone-end features in the shank's frame on the oblique axis; the two furrows beside the tendon as inflection lines carried through the turn; the heel as the foot's own wall behind the centre.

**Inputs.** Lateral malleolus height, bimalleolar breadth, ankle circumference, heel-ankle circumference, heel breadth (ANSUR II); ankle girth, minimum leg girth (ISO 8559-1).

**Pose.** Fixed in the shank: the malleoli. Fixed in the foot: the heel. Function of the angle: the turn, the tendon's line from the calf to the heel, the instep's fold in dorsiflexion.

## Metatarsophalangeal row and toe webs

**Form.** Bone ends: the metatarsal heads on an oblique line, the first at about 0.74 of the foot's length and the fifth nearer 0.64. Fat pads: the ball, the toes' pulps, which nearly touch. Webs: deep on top, shallow beneath; the toes separate lateral first.

**Centres and axes.** Each toe's family starts at its metatarsal head's centre, by the metacarpal definition carried over.

**Topology.** A branch node with five children.

**Construction.** The finger row's construction, with each seam's dorsal fork at the heads' line and its plantar edge under the proximal phalanx, and the turn at the ball about the oblique line of the heads.

**Inputs.** Foot length, ball of foot length, foot breadth horizontal, ball of foot circumference (ANSUR II). Priors: toe lengths and breadths as shares of the foot's.

**Pose.** As the finger row; the ball's turn is the push-off hinge.

## Neck base and jaw-neck

**Form.** Sheets: trapezius from the occiput to the acromion, whose anterior border meets the neck base line at the side neck point (ISO 8559-1); platysma. Ridges: both sternocleidomastoids from the mastoid to the manubrium and the clavicle. Hollows: the suprasternal notch, the supraclavicular fossae. Bone: the seventh cervical spine, the mandible's border and angle. Fold: the angle between the floor under the jaw and the neck.

**Centres and axes.** ISB's spine frames put each vertebra's origin between adjacent endplates on the line through the endplates' centres. The neck's course follows the cervical column from C7 to the skull's base and continues inside the head; the head's course is its own.

**Topology.** The neck base is a continuation with a sheet on each side; the jaw-neck is a part (the neck) coming out through the head's underside, with a fold.

**Construction.** A level section cannot hold the floor under the jaw, so the neck is its own family on a curved course with sections square to it, the head its own on its own axis. The neck base line is the trunk's skin cut by a surface through the back, side and front neck points, fixed in the thorax's frame; the trapezius's border is an inflection line shared by neck and shoulder. Under the jaw the mandible's border is the head's own edge and the floor a sheet from it to the neck.

**Inputs.** Neck circumference, neck circumference base, bitragion chin arc, bitragion submandibular arc, menton-sellion length (ANSUR II); neck girth, neck base girth (ISO 8559-1).

**Pose.** Fixed in the thorax: the base line. Fixed in the skull: the mastoid, the occiput. Fixed in the mandible: its border. Functions of two frames: each sternocleidomastoid ridge, the floor under the jaw (mandible to neck), the trapezius's border.

## Nose-face

**Form.** Bone and cartilage: the nasal bones, the dorsum, the tip. Shells: each ala, which curls under round its nostril. Folds: the alar-facial groove, the sill. Openings: the nostrils.

**Centres and axes.** No joint. Farkas's landmarks give the frame: nasion, subnasale, pronasale, both alaria. The nose's course runs from a root inside the face to the tip.

**Topology.** A mound with a fold: the dorsum and sidewalls run on into the forehead and cheeks, while the alae and the sill meet the face in a fold. Each ala is its own family; each nostril a cut.

**Construction.** The root loop is the face's skin cut by a surface through nasion, both alar bases and subnasale, fixed in the skull's frame. Above the alae the two sides share their lines; round each ala the groove is the fillet of the ala's shell against the cheek, radius a prior. A band's depth profile read on a reference is a shape, and the fold law replaces it.

**Inputs.** Nasal height n-sn, protrusion sn-prn, breadth al-al (Farkas).

**Pose.** Rigid with the skull. Nothing is a function of a joint; flaring is an expression.

## Ear-head

**Form.** One cartilage plate under thin skin. Ridges: helix, antihelix and its crura; the helix's crus rises out of the concha's floor. Bowl: the concha. Fold: the sulcus behind the ear, shallowest above and deepest behind the concha. The auricle is attached along its front from the upper to the lower otobasion.

**Centres and axes.** No joint. The long axis leans 15 to 20 degrees back; the auricle stands 25 to 35 degrees off the head.

**Topology.** A mound with a fold: continuous with the cheek along the front attachment, a fold behind. The helix's curl is its own family.

**Construction.** The plate's root loop is the head's skin cut by a surface fixed in the skull's frame through the otobasia; the front arc shares its lines with the cheek, the back arc is the sulcus as a fillet whose radius grows downward.

**Inputs.** Ear length, breadth and protrusion (ANSUR II; Cho for the Korean ear).

**Pose.** Rigid with the skull.

## Breast-chest wall

**Form.** Fat and gland form the mound on the pectoral fascia. The lower skin fold follows the breast's peripheral fascial attachment. The attachment involves several layers and extends to the wall through the surrounding tissue. The axillary tail continues toward the anterior axillary fold. [Takaya et al., breast fascia microdissection](https://pubmed.ncbi.nlm.nih.gov/34998682/), [Trunk crease histology](https://pmc.ncbi.nlm.nih.gov/articles/PMC4815355/).

**Centres and axes.** No joint. The root's centre on the chest wall and the bust point give the course.

**Topology.** A mound with a fold: the upper pole runs on into the chest, the lower pole meets it in the fold.

**Construction.** The footprint is the wall's skin cut by a cone about the breast's course, fixed in the thorax's frame. The upper arc shares its lines with the chest; the lower arc is a fillet. The tail is an inflection-line pair shared with the pectoral sheet.

**Inputs.** Bust girth, underbust girth, bust point width, side neck point to bust point (ISO 8559-1).

**Pose.** Bound to the thorax, with the tail's share to the pectoral sheet, so a raised arm lifts it.

## Joint kinds

| Kind | Rule | Joints |
| --- | --- | --- |
| Hinge continuation | One family across the joint. The course turns at the centre about the hinge axis, with the half length from the angle and the flexor reach. Each bone end is a feature fixed in its bone's frame. The flexor side carries an inflection line that becomes a contact fold at depth. | Elbow, knee, ankle, interphalangeal joints, wrist, ball of the foot |
| Branch node | The parent's end section is composed from the children's root sections in one declared plane. Each web is a saddle in the plane bisecting two children's axes, from the dorsal fork at the joint centres' level to its published palmar or plantar edge. | Finger row, toe row, thumb base, crotch |
| Sheet over a wall | The wall runs on beneath. The sheet's origin is fixed in the wall's frame and its insertion in the limb's; its free edge is a fold line between them. | Axillary folds, trapezius, sternocleidomastoid, floor under the jaw |
| Mound with a fold | The part's course extends inside the host and its root loop is the host's skin cut by a surface fixed in the host's frame. Where part and host are tangent they share their lines; elsewhere they meet in a fillet of stated radius. | Nose, ear, breast, buttock, shoulder cap with the cleft under the arm |

### Order of work

| Order | Step | Kernel change | Defects removed | Risk |
| --- | --- | --- | --- | --- |
| 1 | Replace stored numbers by the rules above within the present operators: seam knots, loops cut by frame-fixed surfaces and sampled into shares, turn half lengths, bone-end features | None | The roots' marks that follow a stale table when a person changes | Bands still span unshared curves, so collars remain |
| 2 | Oblique rails on split children and a composed parent end | Small to moderate | Collars, pockets and spikes at finger and toe roots | The composed end needs each child's section admitted in the parent's plane |
| 3 | The mixed join | Large | The armpit's fins and cutter, the alar groove, the folds under the breast, behind the ear and under the buttock, the thumb's web | Run-out where a fold arc meets a smooth arc is the classical hard case of blending |
| 4 | Contact between distinct sheets | Large | Deep flexion | Needed only for poses, not for the rest figure |

### Rig-readiness

1. **Mound with a fold on a rigid host** (nose, ear): no joint; every quantity is fixed in one frame.
2. **Hinge continuation**: one axis; the turn law gives the posed course and the weights in closed form.
3. **Branch node**: each child is a hinge of its own, and each web is a function of two children's frames.
4. **Sheet over a wall and the mound at a ball joint** (shoulder, hip, thumb base, neck): three rotations, a centre that itself moves with the girdle, and fold lines that are functions of two frames.

How the readable sources tie the surface to the skeleton: sweep-based deformation stores, for each vertex, its section's parameter, its angle and its offset from a star-shaped section, and re-evaluates the sweep; SMPL regresses each joint from the rest vertices and adds correctives linear in the pose's rotation matrices, zero at rest; MakeHuman places a joint at the mean of named vertices of the mesh. The last two derive the skeleton from a surface. This construction runs the other way: the centres come first and the surface is their function, so a posed joint is a re-evaluation and needs no corrective for what the logic already carries.

## Missing kernel capabilities

Each is a general capability, stated without a part.

1. **A mixed join.** A join along one closed loop that is declared on the arcs where the two surfaces are tangent or continuous, and traced on the arcs where they cross, with a width law per arc that includes the rolling-ball fold.
2. **A loop by a cutting surface.** A port loop or a rail declared as a face's skin cut by a plane, a cone or a bisector fixed in a named frame, with its exact jets, in place of an ellipse with shares or a list of distances; and a rail curve for a split's child as a port's part has.
3. **A composed end.** A section family's end declared as the composition of other families' sections in one plane, so a split's forks and seams follow from it.
4. **A hinge axis apart from the course.** A turn about a declared axis offset from the course's centres, its half length a law, since the course is not the bone.
5. **Contact between sheets.** Two faces that touch without being sewn, each keeping its own binding.
6. **Generating functions for what is now mesh-space fairing.** A fork fill, a join's fairing and a fill disc have no chart and no frame, so they cannot follow a pose or publish a binding.

Whether the realized atlas already publishes material coordinates across a band or a blend was not verified in the engine by this study.

## Sources

| Source | Read | Used for |
| --- | --- | --- |
| Wu G. et al., ISB recommendation on definitions of joint coordinate systems, Part II: shoulder, elbow, wrist and hand. J. Biomech. 38 (2005) 981-992 | read in part: pages 982 to 991, all definitions | Thorax, clavicle, scapula, humerus, forearm, radius, ulna, metacarpal, phalanx and trapezium frames |
| Wu G. et al., ISB recommendation, Part I: ankle, hip and spine. J. Biomech. 35 (2002) 543-548 | read in part: pages 544 to 547 | Ankle complex, pelvis, femur and vertebral frames |
| Yoon S.-H., Kim M.-S., Sweep-based freeform deformations. Computer Graphics Forum 25(3), 2006 | read in full | Star-shaped sweep sections, vertex binding, binding a child's key section to its parent's |
| Hyun D.-E. et al., Sweep-based human deformation. The Visual Computer 21 (2005) 542-550 | summary only (abstract) | Bone protrusion, muscle bulge, skin folding on sweeps |
| Loper M. et al., SMPL. ACM TOG 34(6), 2015 | read in part: the model's definition | Joint regressor, pose correctives |
| Blender, `source/blender/modifiers/intern/MOD_skin.cc` | read in part: header, hull, frames, smoothing | Branch nodes after Ji, Liu and Wang's B-Mesh |
| Ji Z., Liu L., Wang Y., B-Mesh. Computer Graphics Forum 29(7), 2010 | summary only | The method the Skin modifier implements |
| MakeHuman, `makehuman/shared/skeleton.py` | read in part: joint positions | Joints as means of named vertices |
| Dust3D, `dust3d/mesh/tube_mesh_builder.cc`, `mesh_generator.cc` | read in part | Tubes from nodes, parts united by Boolean |
| Anny (NAVER), README | read in full (README only) | Its derivation from MakeHuman's assets |
| Vaillant R. et al., Implicit skinning. ACM TOG 32(4), 2013 | summary only (abstract; the text could not be fetched) | Per-joint operators, contact |
| Angles B. et al., Sketch-based implicit blending. ACM TOG 36(6), 2017 | summary only (abstract) | Blend operators from sketches |
| Gabrielides N. et al., G1-smooth branching surface construction from cross sections. CAD 39(8), 2007 | summary only (abstract) | Branching between parallel sections |
| Gray H., Anatomy of the Human Body, 1918 | read in part: this package's [note](../sources/gray-1918.md); the online text refused the fetch | Attachments, surface form |
| Bridgman G., Constructive Anatomy, 1920 | read in part: this package's [note](../sources/bridgman-1920.md) | Form rules |
| Wikipedia, Axilla | summary only (queried extract) | The axilla's walls and folds |
| ISO 8559-1, ISO 7250-1, ANSUR II | read in part: this package's notes; measure names not in those notes are from the standards' lists as recalled | Inputs |
| Hand-surgery accounts of the web's slope; patellar tracking; the inframammary fold's fixation | summary only (recalled) | Leads for priors |
| Liming R., conic lofting; Shen and Thalmann's layered model; Bloomenthal's skeletal blends; SQM; MPFB2 targets; MB-Lab; SMPL-X and STAR; aircraft fillet and ship bossing texts | not obtained or not read | None |
