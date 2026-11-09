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

## Capture posture

The generated bind is the captured standing posture with relaxed hands, a pose convention and not a shape. Its angles were read on the four reference bodies along each finger's own sections, with PIP and DIP placed by the shares above, one shared value per joint (degrees, toward the palm; spread toward the thumb's side):

| Finger | Proximal phalanx from the hand's axis | Spread | PIP | DIP |
| --- | --- | --- | --- | --- |
| Index | 19.6 | 3.0 | 9.3 | -3.3 |
| Middle | 12.8 | -0.8 | 23.9 | -6.9 |
| Ring | 21.1 | -12.8 | 18.5 | -7.6 |
| Little | 35.4 | -12.9 | 6.0 | -7.6 |

Holding one person out moves a flexion or spread by at most 3.8 degrees, a DIP by up to 7.8. The DIPs rest slightly extended, so the active-flexion coupling of DIP to two thirds of PIP does not describe this posture. The ring and little fingers fan toward the little finger's side.

The thumb rests on the same rule as the fingers, every digit at one share of its joints' ranges: the fingers' mean proximal flexion is 22.2 degrees of the MCP's 80 (AAOS), their mean PIP flexion 14.4 of 90, so the thumb's MCP rests at 0.278 of its 50 degrees (13.9) and its IP at 0.160 of its 80 (12.8), each about its own bone from the metacarpal. The one reference thumb walked alone (f1, proximal phalanx about 22 degrees from the hand's axis, which includes the metacarpal's own tilt) is a check of the rule, not an input.

## Section shape on the reference

Read on f1's bone-normal digit sections (left hand, `limbs/<digit>_l-v3`), depths measured from the bone axis toward the palm and the back of the hand, in the hand's frame. One person in its captured posture, so a shape prior and not a population value.

- Palmar depth over dorsal depth: about 1.2 over the proximal phalanges (index 1.1 to 1.3, middle 1.15 to 1.35, ring 1.1 to 1.3, little 0.8 to 1.2), about 1.1 over the middle phalanges (index 1.3 to 1.45, middle 0.93 to 1.0, ring 1.0, little 1.15), and over the distal phalanx rising toward the nail bed's middle (index to 3 near the tip, middle and ring 1.5, little 2.1) before the tip rounds. The palmar pad is the fuller half; the dorsal skin thins over the nail bed.
- Half width over half depth is near 1 over the proximal phalanx (index 9.1 mm wide against 9.5 and 7.5 mm deep), so a finger's proximal section is nearly round, not flattened.
- Girth falls monotonically from the root to the tip on every finger (index 56 to 43 mm, middle 57 to 44 mm over P1 and P2): this relaxed capture shows no swelling at PIP or DIP above the shafts at the sections' 2 mm spacing (no step above 0.3 mm), so a joint's swelling is held at the upper bound that reading allows, 4 % of the joint's radius.
- Curvature at the side points and apexes read by three points 1.5 mm apart scatters by a factor of two between neighbouring stations; it is not used as a constant. The section takes the half ellipses' apexes and the side speed `sqrt(h_p h_d)` that makes the two halves meet G2 at the side points.

## Form

- Two masses: the hand proper and the thumb's pyramidal base (thenar), which is larger and rounder than the long narrow hypothenar eminence.
- The palm pad overlaps the wrist below and the knuckles above.
- The back of the hand is nearly flat, slightly arched; extensor tendons stand out; the first dorsal interosseous bulges between thumb and index when the thumb is adducted.
- Wrist width is twice its thickness, narrower where it joins the forearm, with a step down from the back of the forearm over the wrist to the hand.
- Finger segments step down from one to the next, bridged by wedges; joints are square, shafts narrower, tips triangular; the middle joint of each finger is the largest. The nail sits in a horseshoe of skin that begins behind its root and bevels below its end.
- Palmar skin is thick and tied to the palmar aponeurosis; dorsal skin is loose and wrinkles over the interphalangeal joints in extension.

The construction follows these parts as pieces on their own axes: a finger's section along its bones is the phalanx span law (shares of the root half width 1.0, 0.9, 0.76 and 0.6 at the web, PIP, DIP and the cap's start; dorsal depth falling faster than palmar, the nail side flattening), with the joint swellings, the pulp and the nail fold as volume-adding bumps, the flexion creases as declared recesses, and the nail plate's transverse arch setting the dorsal midline's curvature over the plate. The palm carries the interosseous valleys (recesses on the back), the hypothenar (a bump on the palmar side) and the aponeurosis pad (the palmar face at least the pad's half ellipse).

## Range of motion

AAOS norms as transcribed by Hendriks et al. 2020 ([hendriks-2020-aaos](../sources/hendriks-2020-aaos.md)), conventional: wrist extension 70, flexion 80; thumb MCP flexion 50, IP flexion 80; fingers MCP flexion 80, PIP 90, DIP 65, extensions 0. Bridgman: wrist extension and flexion are each almost a right angle, and the fingers cannot close fully with the wrist fully flexed (tendon coupling across joints).

## Knuckle arc, palm and thumb

- Metacarpal lengths over the third, CT ([reddy-2024-metacarpal-ct](../sources/reddy-2024-metacarpal-ct.md)): thumb 0.711, index 1.039, ring 0.883, little 0.797. The third-MC/reach factor 0.774 is a retained transfer convention across the Reddy and de Leva datums; its exact aggregation has not been recovered. It is not a direct Reddy measurement or an exactly recomputed pooled ratio. The bases are level across the distal carpal row (conventional), so the heads arc: in an adult the index head is about 3 mm beyond the middle knuckle, the ring 9 mm and the little 16 mm behind it.
- The thumb's carpometacarpal joint sits at the metacarpal base level, radial and palmar (placement conventional), with the measured metacarpal length and the identity's thumb length for its phalanges.

- Palm length and thumb length are identity measurements. Adults: palm 0.601 (women) and 0.603 (men) of hand length (ANSUR II means), thumb 0.359 and 0.356 (1977 survey, 16 to 18 years). Children: the middle finger beyond the palm grows along the 1977 curve (0.428 to 0.439 girls, 0.416 to 0.435 boys of hand length from 2-4 to 16-18 years) and the thumb along its own (0.335 to 0.359, 0.341 to 0.356).
- The middle finger from its joint is 1.347 times its length beyond the crease (de Leva's knuckle fraction 0.459 against ANSUR II palm length), which places the third knuckle.
- Finger lengths relative to the middle finger from the 1987-1988 Army hand survey ([greiner-1991-hand](../sources/greiner-1991-hand.md)), sexes averaged: index 0.900, ring 0.940, little 0.764. The children's surveys give index 0.907 to 0.918 and little 0.74 to 0.75, within two hundredths; holding adult ratios at every age is a modelling inference. The same survey gives adult thumb 0.351 (women) and 0.359 (men) of hand length; children follow the 1977 curve.
- The Army survey's means give index over ring (2D:4D) 0.964 for women and 0.951 for men. Averaging them is a modelling assumption, not an individual anatomical constraint.

The pure generating hand carries the retained form's direction from its nominal axial crease `[crease, 0, 0]` to `[branch, thenar.b, thenar.c]` into the orthonormal hand frame by similarity. The CMC is the ray's intersection with the common metacarpal-base plane, and its measured metacarpal length continues along that ray. This nominal origin is a declared transfer proxy, not the old wrist skin loop's mean, a measured WJC-to-thenar vector or a recovered CMC. No separate depth input is inferred and the old anisotropic skin solve is not replayed. This replaces the planar midpoint-to-public-palm-corner convention, which placed both CMC and MCP in the palm plane. The public thumb identity is crease-to-tip; the internal MCP-to-tip phalanx length retains that explicit transfer proxy. The other fingers, public crease and material frame keep their separate owners.

## Finger widths and webs

Finger widths must fit inside the measured hand breadth. Packing unequal MCP skin-breadth proxies within that breadth and dividing the remaining width equally among the three spaces is a conventional rule, not measured interdigital spacing. A shared proximal shaft section can define the adjacent web; placing the web floor halfway through the shallower palmar half is conventional.

The arm and palm use one continuous original. Hand attachments consume that same final normalized part before lofting: its actual local plane, complete scalar/fullness field, radial location, palmar-depth chord, material map and available physical/axis jets. Palm +u is radial breadth and +v is its palmar/dorsal short direction; a digit instead uses +u for dorsal depth. Actual child-dorsal rays determine the parent depth. Four child-quarter rays read fullness at their actual parent-boundary coordinates, including the attachment's radial offset and changing parent planes; direction angles alone cannot identify those parent quarters. This contact law belongs to a named positive base at the actual attachment, keeping the digit's measured PIP breadth. The next first-shaft and joint laws keep their original measurements, with a C2 source transition between the named sites. The selected contact readings have their explicit constant pullback at the base, separate from the parent's own station derivatives. They are not held until the middle of the first bone. This source handoff does not certify a realized Boolean, complete contact footprint or final skin continuity.

The current child profile still comprises four conic quarters. Retaining the complete parent owner and reading selected boundary rays is distinct from consuming its entire oblique local cut as that child profile. Even a regular single-loop cut of a conic loft need not belong to this four-quarter family. The public ViewPart, ViewSource/Read and SectionNative path does not currently accept an arbitrary cut field with its domain and available derivatives. Exact complete-cut sharing therefore remains unfinished; neither copied quarter values nor a callback without a production consumer closes it. The regional connection already retains the original source, attachment position and material map needed by a future supported consumer, without changing measured digit breadth to conceal the gap.

An MCP/CMC remains a skeletal joint. If it does not provide a qualified interior skin start, a supported base is selected only along that same first-bone line, leaving the skeletal tuple, distal joints and declared skin apex unchanged. The first measured shaft remains the midpoint between the original skeletal joint and the first distal joint, mapped into the longer root-to-first segment by its actual distances. The attachment retains both datums and the original joint's coordinate availability; unavailable does not mean outside. Actual depth rays require a qualified boundary reading or a declared parent zero pole, and an open source end is not turned into a fabricated outside section. The child uses the existing regular-bottom/top-pole contract, so its source test reads a positive canonical base rather than inventing a zero skin pole at the MCP. Changing from the former both-pole angle parameter to the top-root parameter reauthors the interpolation between named sites too; unchanged measured values do not establish unchanged distal curves. Both hands' complete defining curves and actual raw loft need inspection in this new source epoch.

At an interphalangeal turn, the section's measured breadth and both signed depth supports define a geometric bend-radius bound: the farthest corner of their box lies at `hypot(max(dorsalDepth, palmarDepth), breadth/2)`. The quintic angle law converts this radius to its turn half arclength. Using half the depth alone had placed the inner named section at zero longitudinal support when its depth was split equally. The box bound gives room at that named section without changing the skeletal centres, capture angles, bone lengths or measured shaft law. It is a construction bound rather than a measured anatomical bend radius, and it does not prove reach or absence of folds throughout the varying turn; actual source/frame derivatives and neighbouring sections must still be read.

## Open questions

- Phalanx lengths as fractions of hand length: Buchholz et al. 1992 remains unread; Buryanov and Kotiuk 2010 gives absolute lengths and shares of the finger, not of hand length.
- Ring and little fingers: on the reference bodies, measured from their more distal web along their own sections, they are 0.82 to 0.87 and 0.62 to 0.65 of the middle finger. Part of the gap to Greiner's 0.940 and 0.764 is his crease datum; Buryanov's web datum gives 0.927 and 0.716. The rest is open: a finger between two webs is read from the more distal one by the observer, and which web Buryanov's X-ray shadow marks for the ring finger is not stated.
- Nail plate dimensions and curvature.
- Positions of the metacarpal bases (the carpometacarpal line) and of the thumb's carpometacarpal joint: no measured source, so the bases are taken level.
- Child metacarpal proportions: none read, so adult CT ratios are held.
- Finger abduction ranges.
- `AutoMovieHumanoidBone` has no bones for metacarpals two to five, so palm arching (cupping) cannot be posed; either `interface` gains metacarpal bones or Human keeps an internal palm arch.
