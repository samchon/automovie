# Hand

The hand is a separate part joined at the wrist (#2797). Its skeleton uses the VRM finger bones of `AutoMovieHumanoidBone`: thumb metacarpal, proximal and distal; index to little proximal, intermediate and distal. The metacarpals of fingers two to five have no bones and live inside the `leftHand`/`rightHand` mass.

## Overall dimensions

ANSUR II (`../sources/ansur-ii.md`), measured; ratios ours.

| Quantity | Women | Men |
| --- | --- | --- |
| Hand length, stylion to tip of digit III (mm) | 181.1 (0.111 S) | 193.3 (0.110 S) |
| Palm length, digit III base crease to ventral stylion (mm) | 108.7 | 116.5 |
| Palm / hand length | 0.601 (SD 0.019) | 0.603 (SD 0.020) |
| Hand breadth, metacarpale II to V (mm) | 78.2 | 88.3 |
| Breadth / length | 0.432 (SD 0.021) | 0.457 (SD 0.021) |
| Hand circumference / breadth | 2.388 | 2.406 |
| Wrist circumference / hand breadth | 1.98 | 1.99 |
| Hand length / foot length | 0.735 | 0.713 |
| Hand length fit | 30.8 + 0.0847 S + 0.181 m (R2 0.45) | 30.0 + 0.0883 S + 0.097 m (R2 0.47) |

Digit III from its base crease is therefore about 0.40 of hand length. Hand length correlates only moderately with stature (R2 about 0.45), so it is its own parameter.

Finger lengths from the 1977 child survey (`../sources/snyder-1977.md`), from the skin crease at the finger base to the tip, as fractions of hand length (wrist crease to digit III tip), 16 to 18 years: thumb 0.356 (M) / 0.359 (F), index 0.392 / 0.399, middle 0.435 / 0.439. In 2- to 4-year-olds the thumb is 0.34 and the middle finger 0.42: fingers lengthen relative to the palm during childhood, and the hand narrows (breadth / length 0.48 at 2 to 4, 0.47 M and 0.44 F at 16 to 18).

## Joint centres and creases

From Gray 1918 and Bridgman (`../sources/gray-1918.md`, `../sources/bridgman-1920.md`), conventional.

- Of the three wrist creases the middle marks the wrist joint, the most distal the midcarpal joint.
- Metacarpophalangeal joints lie just distal to the knuckle prominences; the palmar crease at a finger base lies over the proximal phalanx, not the joint, because the palmar web reaches the middle of the proximal phalanges. Fingers therefore look shorter from the palm than from the back.
- Index finger creases (Bridgman): short of the distal joint; opposite the middle joint; halfway between middle and basal joints; and opposite the basal knuckle. Middle finger: opposite the distal joint, beyond the middle joint, midway between middle and basal joints, and opposite the basal joint. The palmar pads of each finger are of equal length, so the creases meet in a diamond when the finger closes.
- Knuckles form an arch concentric around the base of the thumb; the third knuckle is the largest and highest. Spread fingertips lie on a curve centred at the thumb base, and flexed fingers converge toward the thumb.
- The thumb's basal (carpometacarpal) joint is a saddle; its metacarpal sits at an angle to the palm, never flat with it; the thumb pad reaches the middle joint of the index finger.
- Third metacarpal styloid process: a dorsal prominence about 4 cm distal to the dorsal radial tubercle (Gray).

## Form

- Two masses: the hand proper and the thumb's pyramidal base (thenar), which is larger and rounder than the long narrow hypothenar eminence.
- The palm pad overlaps the wrist below and the knuckles above.
- The back of the hand is nearly flat, slightly arched; extensor tendons stand out; the first dorsal interosseous bulges between thumb and index when the thumb is adducted.
- Wrist width is twice its thickness, narrower where it joins the forearm, with a step down from the back of the forearm over the wrist to the hand.
- Finger segments step down from one to the next, bridged by wedges; joints are square, shafts narrower, tips triangular; the middle joint of each finger is the largest. The nail sits in a horseshoe of skin that begins behind its root and bevels below its end.
- Palmar skin is thick and tied to the palmar aponeurosis; dorsal skin is loose and wrinkles over the interphalangeal joints in extension.

## Range of motion

AAOS norms as transcribed by Hendriks et al. 2020 (`../sources/hendriks-2020-aaos.md`), conventional: wrist extension 70, flexion 80; thumb MCP flexion 50, IP flexion 80; fingers MCP flexion 80, PIP 90, DIP 65, extensions 0. Bridgman: wrist extension and flexion each almost a right angle, the fingers cannot close fully with the wrist fully flexed (tendon coupling across joints).

## Knuckle arc, palm and thumb (as built in #2793)

The first stick hand set the four finger roots on a near-straight line from conventional factors, the thumb's base by a solve that made the adducted tip reach the index middle joint, and the same finger proportions at every age. Rebuilt from measurements:

- Metacarpal lengths over the third, CT (`../sources/reddy-2024-metacarpal-ct.md`): thumb 0.711, index 1.039, ring 0.883, little 0.797; the third is 0.774 of de Leva's wrist-centre-to-third-metacarpale distance. Bases level across the distal carpal row (conventional), so the heads arc: index about 3 mm beyond the middle knuckle in an adult, ring 9 mm and little 16 mm behind.
- The thumb's carpometacarpal joint at the metacarpal base level, radial and palmar (placement conventional), its metacarpal the measured length, its phalanges the identity's thumb length.
- Palm length and thumb length are identity measurements. Adults: palm 0.601 (women) and 0.603 (men) of hand length (ANSUR II means), thumb 0.359 and 0.356 (1977 survey, 16 to 18 years). Children: the middle finger beyond the palm grows along the 1977 curve (0.428 to 0.439 girls, 0.416 to 0.435 boys of hand length from 2-4 to 16-18 years) and the thumb along its own (0.335 to 0.359, 0.341 to 0.356).
- The middle finger from its joint is 1.347 times the length beyond its crease (de Leva's knuckle fraction 0.459 against ANSUR II palm length), which places the third knuckle.
- Finger lengths relative to the middle finger from the 1987-1988 Army hand survey (`../sources/greiner-1991-hand.md`), sexes averaged: index 0.900, ring 0.940, little 0.764 (the earlier ring 0.95 was conventional and the little 0.745 a child value). The children's surveys give index 0.907 to 0.918 and little 0.74 to 0.75, within two hundredths, so the adult ratios hold at every age. Adult thumb 0.351 (women) and 0.359 (men) of hand length from the same survey, children along the 1977 curve.
- The stick draws each finger and thumb root back to the wrist, the metacarpals fanning from the carpus.

## Open questions

- Phalanx and metacarpal lengths as fractions of hand length for each finger (Buchholz et al. 1992, Buryanov and Kotiuk 2010): not read, both inaccessible. Joint centre positions per digit therefore rest on crease rules only.
- Nail plate dimensions and curvature: no source read.
- The 2D:4D ratio by sex: the Army survey's means give index over ring 0.964 (women) and 0.951 (men), but the skeleton reads no sex and averages them.
- Positions of the metacarpal bases (the carpometacarpal line) and of the thumb's carpometacarpal joint: no measured source; bases are taken level.
- Child metacarpal proportions: none read; adult CT ratios are held.
- Adult finger lengths: only the 1977 adolescents were read.
- Finger abduction ranges and the coupling of DIP to PIP flexion: no source read.
- How the hand maps to `AutoMovieHumanoidBone`: the finger metacarpals two to five have no bones, so palm arching (cupping) cannot be posed; whether `interface` needs metacarpal bones or Human keeps an internal palm arch.


## Campaign 2831: shared finger masses and web boundaries

The unchanged committed source has a numerical self-intersection beyond the index-middle web, not merely a lighting defect. The four finger axes are parallel with equal centre spacing of 0.25 hand breadth, while the two largest PIP breadths already consume 0.249 hand breadth per half-pair. The proximal section then multiplies the joint breadth by 1.04. Those independently declared masses overlap before subdivision. Rows and tolerances cannot repair that input.

The rejected ring-count trials did not repair this cause. A whole 12-to-20 transition creates two valence-six vertices: adjacent reduction blocks coincide at one, and a reduction corner coincides with the thumb opening at the other. Four 3-to-5 quarter bands remove the first but retain the second. Adding a plain collar row separates the latter, but worsens the fixed-ray 95th-percentile dorsal error in some gates. None of these trials is accepted.

The new candidate retains the original 12-to-18-to-26 cage. One joint-breadth definition now feeds both the finger skin and the skeleton. The skeleton packs those unequal MCP skin-breadth proxies within the measured full hand breadth, allocating only the remainder equally to the three spaces; the outer metacarpale landmarks follow the same packing, preserving their full breadth and the middle-finger axis. Equal spacing of the residual is a conventional packing rule, not measured interdigital spacing. The shaft and its adjacent web read one external proximal-section definition. Each web's boundary comes from its two shaft-section intersections with one palmar floor, rather than an independent width in hand lengths. The floor's halfway placement in the shallower palmar half is also conventional.

The independent numerical experiment freezes all Human, engine and interface source at commit `9f135607`, applies only the listed candidate files in a separate scratch snapshot, and evaluates the engine's level-three Catmull-Clark limit with relief disabled. It reads no mutable compiled library. For each adjacent pair, 31 distal levels run from 1 mm beyond the measured web crotch to the nearer PIP and 25 palmar levels span -0.075 to +0.125 hand breadth. Rays run along the hand's radial direction. Only identical physical rays that hit both digit branches in both versions enter the comparison. Positive signed separation means that the two branch envelopes separate at that ray; this finite test is not a proof of global absence of self-intersections.

| Gate | Index-middle minimum, baseline / candidate (mm) | Middle-ring minimum (mm) | Ring-little minimum (mm) |
| --- | --- | --- | --- |
| Slim woman | -1.490 / 1.126 | -0.377 / 1.436 | 1.847 / 2.270 |
| Slim man | -1.654 / 1.266 | -0.409 / 1.619 | 2.092 / 2.574 |
| Muscular woman | -1.467 / 1.115 | -0.369 / 1.421 | 1.823 / 2.244 |
| Muscular man | -1.642 / 1.261 | -0.406 / 1.612 | 2.080 / 2.561 |

There are 9,188 common physical rays across the four gates and three pairs. Baseline has 1,249 negative separations; the candidate has none. Both hands of all four gates retain the exact original cage connectivity and sampler patch UVs, the wrist ring has zero positional change, every cage vertex has valence at most five, Euler characteristic is one, the sole open boundary has eight edges, and no edge is nonmanifold. Level-three normals are finite and unit length, no rendered triangle is degenerate, and each hand still emits five nail attachments. These are numerical and structural checks, not clinical or visual acceptance. The Human atlas charts are unchanged; sampler patch-UV equality does not assert equality of anatomy-dependent semantic corner addresses.

The valid committed baseline's four gate people were inspected in seven corrected external hand cameras, with surface, overlay, cage/sections and raking light. They still show knife-like webs, branch pinches and dorsal ridges. Reconstructed brown network curves are approximate under the construction-inspector audit and are not exact generator evidence. The candidate has not been rendered from a committed actual-consumer snapshot, and its gross form remains unverified. Canonical full build, evidence and joined-view acceptance must finish when the protected checkout can be used again.

The web floor is currently a through-point constraint of each source curve. Two uniform chord-length samples do not generally pin the through point itself on the subdivision cage; baseline source-to-sampled-floor discrepancy reaches about 1.3 mm in the palmar direction. The shared mass candidate does not establish exact preservation of that control landmark. This sampling limitation belongs to the engine curve/topology boundary and remains distinct from the removed branch overlap.
