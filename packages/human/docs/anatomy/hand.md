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

## Open questions

- Phalanx and metacarpal lengths as fractions of hand length for each finger (Buchholz et al. 1992, Buryanov and Kotiuk 2010): not read, both inaccessible. Joint centre positions per digit therefore rest on crease rules only.
- Nail plate dimensions and curvature: no source read.
- Ring and little finger lengths and the 2D:4D ratio by sex: no source read.
- Adult finger lengths: only the 1977 adolescents were read.
- Finger abduction ranges and the coupling of DIP to PIP flexion: no source read.
- How the hand maps to `AutoMovieHumanoidBone`: the finger metacarpals two to five have no bones, so palm arching (cupping) cannot be posed; whether `interface` needs metacarpal bones or Human keeps an internal palm arch.
