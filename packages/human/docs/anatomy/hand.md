# Hand

Each value holds only for its cited population, posture and measurement protocol. Derived ratios are research constraints, not generator defaults or clinical identity.

## Overall dimensions

ANSUR II ([ansur-ii](../sources/ansur-ii.md)), measured; ratios are derived.

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

Digit III from its base crease is about 0.40 of hand length. Hand length correlates only moderately with stature (R2 about 0.45), so it is its own parameter.

Finger lengths in the 1977 child survey ([snyder-1977](../sources/snyder-1977.md)) run from the skin crease at the finger base to the tip, as fractions of hand length (wrist crease to digit III tip). At 16 to 18 years they are thumb 0.356 (M) / 0.359 (F), index 0.392 / 0.399, middle 0.435 / 0.439. At 2 to 4 years the thumb is 0.34 and the middle finger 0.42, so fingers lengthen relative to the palm during childhood. The hand also narrows: breadth / length 0.48 at 2 to 4, 0.47 (M) and 0.44 (F) at 16 to 18.

## Joint centres and creases

From Gray 1918 and Bridgman ([gray-1918](../sources/gray-1918.md), [bridgman-1920](../sources/bridgman-1920.md)), conventional.

- Of the three wrist creases the middle marks the wrist joint, the most distal the midcarpal joint.
- Metacarpophalangeal joints lie just distal to the knuckle prominences. The palmar crease at a finger base lies over the proximal phalanx, not the joint, because the palmar web reaches the middle of the proximal phalanges, so fingers look shorter from the palm than from the back.
- Index finger creases (Bridgman): short of the distal joint; opposite the middle joint; halfway between middle and basal joints; and opposite the basal knuckle. Middle finger: opposite the distal joint, beyond the middle joint, midway between middle and basal joints, and opposite the basal joint. The palmar pads of each finger are of equal length, so the creases meet in a diamond when the finger closes.
- Knuckles form an arch concentric around the base of the thumb; the third knuckle is the largest and highest. Spread fingertips lie on a curve centred at the thumb base, and flexed fingers converge toward the thumb.
- The thumb's basal (carpometacarpal) joint is a saddle; its metacarpal sits at an angle to the palm, never flat with it; the thumb pad reaches the middle joint of the index finger.
- Third metacarpal styloid process: a dorsal prominence about 4 cm distal to the dorsal radial tubercle (Gray).

## Phalanges and web heights

Radiographs of 66 adults ([buryanov-2010-hand-segments](../sources/buryanov-2010-hand-segments.md)), measured; shares derived.

- Interarticular lengths, distal phalanx with the tip's soft tissue: index 39.8, 22.4, 19.7 mm; middle 44.6, 26.3, 21.4; ring 41.4, 25.7, 21.3; little 32.7, 18.1, 19.7; thumb proximal 31.6, distal with tip 27.3. The middle and distal phalanges are not equal: the middle phalanx is 1.1 (little) to 1.5 (middle, ring) times the distal one.
- Joints from the web, as shares of the web-to-tip length: PIP at 0.41 (index), 0.41 (middle), 0.38 (ring), 0.34 (little); DIP at 0.72, 0.74, 0.72, 0.66. The web stands 15 to 25 % of that length above the MCP joint space, highest at the little finger.
- A finger's external length from its web to its tip over the middle finger's (Buryanov and Kotiuk, the tip and distal phalanx of Table I over their Table III share): index 0.872, ring 0.927, little 0.716. Greiner 1991 measures from the centre of the proximal palmar flexion crease and gives 0.900, 0.940, 0.764; the two datums differ, and the construction measures from the web, so it takes Buryanov's.

## Bind posture

The hand's longitudinal axis follows the person's forearm in the bind. Anatomical anterior projected perpendicular to that axis points toward the radial side. The palm normal is radial crossed with longitudinal for the left hand. Bilateral reflection carries the right hand's centres and material axes together.

The digit directions come from the public CC0 MakeHuman HM08 rig at revision `650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a`. Each joint is the mean of the distinct vertices in its OBJ `joint-l-*` cube. The measurement frame points from the wrist to MCP III, across from MCP V toward MCP II, and into the palm. The four fingers use the rig's MCP, PIP, DIP and tip markers. Spread and proximal flexion are spherical angles in that frame. PIP and DIP turns use the signed angle in the plane through the incoming bone and the palm normal. These are pose values for one authored rig. [Asset](https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/src/mpfb/data/3dobjs/base.obj) · [Rig](https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/src/mpfb/data/rigs/standard/rig.default.json) · [Asset license](https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/LICENSE.ASSETS.md)

| Finger | Proximal phalanx from the hand's axis | Spread | PIP | DIP |
| --- | --- | --- | --- | --- |
| Index | 5.6 | 9.4 | 11.0 | 1.9 |
| Middle | 2.3 | -6.5 | 11.2 | -0.1 |
| Ring | 1.4 | -15.9 | 12.1 | -0.4 |
| Little | 11.2 | -19.9 | 7.9 | 1.5 |

The same projected readings give the thumb MCP and IP turns of 4.8° and 1.5°. The palm-side ratios for each generated finger section come from the section's own dorsal and palmar depth law.

## Form

- Two masses: the hand proper and the thumb's pyramidal base (thenar), which is larger and rounder than the long narrow hypothenar eminence.
- The palm pad overlaps the wrist below and the knuckles above.
- The back of the hand is nearly flat, slightly arched; extensor tendons stand out; the first dorsal interosseous bulges between thumb and index when the thumb is adducted.
- Wrist width is twice its thickness, narrower where it joins the forearm, with a step down from the back of the forearm over the wrist to the hand.
- Finger segments step down from one to the next, bridged by wedges; joints are square, shafts narrower, tips triangular; the middle joint of each finger is the largest. The nail sits in a horseshoe of skin that begins behind its root and bevels below its end.
- Palmar skin is thick and tied to the palmar aponeurosis; dorsal skin is loose and wrinkles over the interphalangeal joints in extension.

The generated finger sections follow the measured breadth and depth profiles on the phalanges. The palm field and each digit's proximal attachment share the anatomical construction described below.

## Range of motion

AAOS norms as transcribed by Hendriks et al. 2020 ([hendriks-2020-aaos](../sources/hendriks-2020-aaos.md)), conventional: wrist extension 70, flexion 80; thumb MCP flexion 50, IP flexion 80; fingers MCP flexion 80, PIP 90, DIP 65, extensions 0. Bridgman: wrist extension and flexion are each almost a right angle, and the fingers cannot close fully with the wrist fully flexed (tendon coupling across joints).

## Knuckle arc, palm and thumb

- Metacarpal lengths over the third from Reddy Table 4 are 0.711 for the thumb, 1.039 for index, 0.883 for ring and 0.797 for little. Dividing the sex-specific MC3 total lengths by de Leva's WJC-to-MET3 reaches gives the modelling factors 60.4/78 for women and 66.6/86.2 for men. The distal carpal row for digits II to V is taken level as a geometric convention. [Reddy](../sources/reddy-2024-metacarpal-ct.md) · [de Leva](../sources/de-leva-1996.md)

- Palm length and thumb length are identity measurements. Adults: palm 0.601 (women) and 0.603 (men) of hand length (ANSUR II means), thumb 0.359 and 0.356 (1977 survey, 16 to 18 years). Children: the middle finger beyond the palm grows along the 1977 curve (0.428 to 0.439 girls, 0.416 to 0.435 boys of hand length from 2-4 to 16-18 years) and the thumb along its own (0.335 to 0.359, 0.341 to 0.356).
- The middle finger from its joint is 1.347 times its length beyond the crease (de Leva's knuckle fraction 0.459 against ANSUR II palm length), which places the third knuckle.
- Finger lengths relative to the middle finger from the 1987-1988 Army hand survey ([greiner-1991-hand](../sources/greiner-1991-hand.md)), sexes averaged: index 0.900, ring 0.940, little 0.764. The children's surveys give index 0.907 to 0.918 and little 0.74 to 0.75, within two hundredths; holding adult ratios at every age is a modelling inference. The same survey gives adult thumb 0.351 (women) and 0.359 (men) of hand length; children follow the 1977 curve.
- The Army survey's means give index over ring (2D:4D) 0.964 for women and 0.951 for men. Averaging them is a modelling assumption, not an individual anatomical constraint.

In the same open rig, the thumb CMC lies 0.345 of the wrist-to-MCP III reach from the wrist along the hand axis. The radial and palmar offsets are 0.355 and 0.224 of the projected MCP II-to-V chord. The metacarpal unit direction is approximately `[0.673, 0.665, 0.323]` in the longitudinal, radial and palmar axes. These landmark ratios rescale on each person's actual knuckles. The segment uses Reddy's MC1 length ratio. Buryanov's measured thumb segment shares use the public crease-to-tip length as the MCP-to-tip proxy.

## Finger widths and webs

Finger widths must fit inside the measured hand breadth. Packing unequal MCP skin-breadth proxies within that breadth and dividing the remaining width equally among the three spaces is a conventional rule, not measured interdigital spacing. A shared proximal shaft section can define the adjacent web; placing the web floor halfway through the shallower palmar half is conventional.

The arm and palm use one continuous original. Hand attachments consume that same final normalized part before lofting: its actual local plane, complete scalar/fullness field, radial location, palmar-depth chord, material map and available physical/axis jets. Palm +u is radial breadth and +v is its palmar/dorsal short direction; a digit instead uses +u for dorsal depth. Actual child-dorsal rays determine the parent depth. Four child-quarter rays read fullness at their actual parent-boundary coordinates, including the attachment's radial offset and changing parent planes; direction angles alone cannot identify those parent quarters. This contact law belongs to a named positive base at the actual attachment, keeping the digit's measured PIP breadth. The next first-shaft and joint laws keep their original measurements, with a C2 source transition between the named sites. The selected contact readings have their explicit constant pullback at the base, separate from the parent's own station derivatives. They are not held until the middle of the first bone. This source handoff does not certify a realized Boolean, complete contact footprint or final skin continuity.

The current child profile still comprises four conic quarters. Retaining the complete parent owner and reading selected boundary rays is distinct from consuming its entire oblique local cut as that child profile. Even a regular single-loop cut of a conic loft need not belong to this four-quarter family. The public ViewPart, ViewSource/Read and SectionNative path does not currently accept an arbitrary cut field with its domain and available derivatives. Exact complete-cut sharing therefore remains unfinished; neither copied quarter values nor a callback without a production consumer closes it. The regional connection already retains the original source, attachment position and material map needed by a future supported consumer, without changing measured digit breadth to conceal the gap.

An MCP/CMC remains a skeletal joint. If it does not provide a qualified interior skin start, a supported base is selected only along that same first-bone line, leaving the skeletal tuple, distal joints and declared skin apex unchanged. The first measured shaft remains the midpoint between the original skeletal joint and the first distal joint, mapped into the longer root-to-first segment by its actual distances. The attachment retains both datums and the original joint's coordinate availability; unavailable does not mean outside. Actual depth rays require a qualified boundary reading or a declared parent zero pole, and an open source end is not turned into a fabricated outside section. The child uses the existing regular-bottom/top-pole contract, so its source test reads a positive canonical base rather than inventing a zero skin pole at the MCP. Changing from the former both-pole angle parameter to the top-root parameter reauthors the interpolation between named sites too; unchanged measured values do not establish unchanged distal curves. Both hands' complete defining curves and actual raw loft need inspection in this new source epoch.

For root selection, the parent must supply qualified boundary crossings in both dorsal directions and all four quarter directions. Keep the anatomical joint when it has positive margin and all six crossings. Otherwise take the greatest positive margin among the existing first-bone extension samples that satisfy all six. At an oblique thumb, the deepest sampled point can lose its chart coordinate at the wrist with positive margin, even though a shallower point on the same bone line has all six crossings. The parent field and its chart supply the test without an added anatomical coefficient. The thumb's proximal articulation is between the first metacarpal and the trapezium. [Functional anatomy of the carpometacarpal joint of the thumb](https://pubmed.ncbi.nlm.nih.gov/3595013/)

At an interphalangeal turn, the section's measured breadth and both signed depth supports define a geometric bend-radius bound: the farthest corner of their box lies at `hypot(max(dorsalDepth, palmarDepth), breadth/2)`. The quintic angle law converts this radius to its turn half arclength. Using half the depth alone had placed the inner named section at zero longitudinal support when its depth was split equally. The box bound gives room at that named section without changing the skeletal centres, capture angles, bone lengths or measured shaft law. It is a construction bound rather than a measured anatomical bend radius, and it does not prove reach or absence of folds throughout the varying turn; actual source/frame derivatives and neighbouring sections must still be read.

## Open questions

- Phalanx lengths as fractions of hand length: Buchholz et al. 1992 remains unread; Buryanov and Kotiuk 2010 gives absolute lengths and shares of the finger, not of hand length.
- Buryanov's radiographic web definition does not distinguish the two adjacent web datums of the ring finger.
- Nail plate dimensions and curvature.
- Population positions of the carpometacarpal line and thumb carpometacarpal joint.
- Child metacarpal proportions: none read, so adult CT ratios are held.
- Finger abduction ranges.
- `AutoMovieHumanoidBone` has no bones for metacarpals two to five, so palm arching (cupping) cannot be posed; either `interface` gains metacarpal bones or Human keeps an internal palm arch.
