# Arm

## Active shoulder source transfer

The active GH is a population/frame-transfer proxy, not the lateral acromion
or a joint center fitted from skin width. Campbell et al. 2009's generic
[12,-49,6] physical millimetres is expressed in their acromial triad. Our
authored AP bar and frontal acromion-to-internal-neck chord construct an
explicit substitute frame; authored acromion AP is itself a retained prior,
not measured AcrLR. Canonical-right placement is reflected for the left,
and calibration scale applies once. The current input graph cannot recover
the actual triad or an individual's GH. The complete alternatives and direct
primary-source reading are in [the input audit](../work/body-input-source-audit.md#shoulder-joint-measuring-pose-and-source-family-alternatives).

The same actual downward GH projection d closes the straight measuring
caliper H=AR-d-.0432AR before rigid transport to bind. The biceps station
AR/2-d remains a radiale-for-olecranon proxy. The retained .3H first free
deltoid row and 1.026G multiplier transfer the current biceps support template;
they do not locate the maximum or recover the unobserved proximal heads.
Public bideltoid constrains the original outer support over the explicit
proximal-pole-to-midshaft domain in an arms-down upper-arm frame. Its common
source critical roots and final residual are checked independently of GH,
bony acromial Y/Z, biceps G and the hand's original material/axis records.
Source closure, anatomical validity, reference-overlay agreement and final
skin attachment remain separate. Independent round84782 passes the generic
frame/caliper convention and isolated limb sources. Coupled92580 then passes
actual production GH/AR/acromion delivery, deltoid-domain support-plane B,
changed-box biceps G and the original hand AST/roll connection. It does not
make the authored frame measured AcrCS, the region an independently observed
deltoid border, or the final skin/visual result accepted. ANSUR printed88 does
not establish an additional exact same-Y contact requirement from its finite
caliper blades; same-Y section width is a distinct optional model reading.

Each value holds only for its cited population, posture, coordinate frame and measurement protocol.

The active body source uses `BodyLaw`/`SkeletonLaw`'s pure `ArmBones` and shared `HandBones`, followed by `ArmInterim`/`ArmWalk` and `DigitInterim`/`DigitWalk`. Its original edge curves, material frame and production tree share one declaration. The reference observations and older piece graph below remain retained source material; their presence does not mean the current body emits those pieces or consumes every public measure. The former biceps-first source had no bideltoid owner; the current explicit deltoid-domain solve is described above. The complete current input/measurement boundary is recorded in [the body source audit](../work/body-input-source-audit.md).

## Joint centres from the length inputs

De Leva 1996 Table 2 ([de-leva-1996](../sources/de-leva-1996.md)) places the shoulder centre 33.7 (F) / 34.5 (M) mm distal of the acromion and the elbow centre 13.9 / 14.3 mm proximal of radiale, and the wrist centre 1.5 mm distal of stylion. The retained AR denominators 322.7 / 330.5 mm are reconstructed from Table 4 joint-centre lengths plus Table 2 landmark offsets; they are not Table 4's stated acromion-radiale measurements. The paper's Upper arm text instead states AR 324.1 / 331.8 mm, and Fig.1 has further differing mean offsets. The following ratios are therefore retained approximations, not exact individual regressions:

| Offset | Women | Men | Rule |
| --- | --- | --- | --- |
| shoulder centre below the acromion | 33.7 / 322.7 = 0.10443 | 34.5 / 330.5 = 0.10439 | 0.1044 AR |
| elbow centre above radiale | 13.9 / 322.7 = 0.04307 | 14.3 / 330.5 = 0.04327 | 0.0432 AR |

In the model's declared straight neutral measuring convention, the four longitudinal projections are collinear. The same GH placement and offsets then close the public axis-parallel AR caliper: GH lies `0.1044 AR` below the measured acromion, the humerus is `(1 - 0.1044 - 0.0432) AR = 0.8524 AR`, and radiale is `0.0432 AR` past the elbow centre. The forearm's joint-centre length is `0.0432 AR + RS + 1.5 mm`. These rigid lengths are carried into the bind; this is not a claim that every person's clinical carrying angle is zero. Grade: geometric closure under retained approximations and a placement convention. Scaling the offsets with the segment extends them to children as an inference (see [skeleton](skeleton.md)).

## Reference observations (f1, f2, m1, m2)

Read on each reference skin square to its own bone (the centroid line of its upper arm or forearm sections, the elbow where the two lines pass closest; on f1 that point lies 9.7 mm from the source's own elbow joint, so stations carry about 10 mm of uncertainty), with the section angle from forward across the bone toward lateral. Stylion is taken at each reference's least girth before the hand, since the references record no wrist landmark. Grade: measured on four bodies; medians, spread is max - min.

### Girth along the arm

| Measure | Median | Spread |
| --- | --- | --- |
| girth at 0.3 of the humerus over the biceps-site girth | 1.026 | 0.034 |
| girth at 0.7 of the humerus, share of the way from the supracondylar girth to the biceps girth | 0.58 | 0.21 |
| supracondylar least girth above the elbow centre | 16.6 mm (0.0625 of the humerus) | 8.2 mm |
| supracondylar girth over the elbow girth (elbow in the plane bisecting the corner) | 1.011 | 0.025 |
| forearm belly, share of elbow centre to stylion | 0.215 (45-63 mm below the elbow; f2 flat from the elbow) | 0.16 |
| forearm girth's share of wrist-to-belly at 0.4, 0.6, 0.8 | 0.872, 0.521, 0.201 | 0.11, 0.18, 0.06 |
| belly over elbow girth | 1.017 | 0.045 |
| stylion over belly girth | 0.629 | 0.034 |

The upper arm's girth only falls from the axillary root: the biceps belly is a sector's shape, not a girth maximum, in these relaxed arms. The forearm's fall is steepest between 0.4 and 0.6 and eases past the musculotendinous junction. At the elbow's distal edge (0.1) the girth is the lesser of the elbow's and the belly's (0.999 to 1.02 of it).

### Sections

A four-guide polar sector section (guides forward, lateral, back and medial, each with its radius and two angle derivatives; four sectors each with one fullness, `lofting/AutoMovieHumanPolarSector`) reproduces every reference section at the landmark stations to 0.1 to 0.9 % of its radius RMS. The rows (in units of girth / 2 pi) are in `generation/arm/AutoMovieHumanUpperArmCompartments.ts` and `AutoMovieHumanForearmSectors.ts`. In the bind's thumb-forward forearm the forward guide runs on the radial border, the lateral on the extensors, the back on the ulnar border and the medial on the flexors; the radial side is fuller (1.08 to 1.14) and the ulnar border flatter.

### The elbow

Read in the plane bisecting the corner through the two centroid lines' meeting point, the elbow section's forward radius exceeds the base the neighbouring rows interpolate by 0.095 of the radius and its back falls short by 0.076. Both match the meeting point standing about 3 mm behind the rounded walk's own axis at the corner; with that offset removed the residuals are +0.01 forward, +0.009 back, -0.039 lateral and -0.019 medial. The reference skins carry no olecranon or epicondyle prominence measurable at this sampling, so no relief window has an observed height; one needs a published soft-tissue source.

## Pieces

The arm is divided into spans between named loci, proximal to distal, each in its own file under `packages/human/src/generation/arm/` and built from fixed inputs alone (`IAutoMovieHumanArmPiece.IInputs`: the bones, the walk and the four tapes). A span owns its girth knots and its section rows; where two meet, the proximal span owns the shared row and knot and the distal span copies them.

| Span | From, to | File |
| --- | --- | --- |
| deltoid | first own section to the deltoid insertion (the biceps tape's site, midway acromion to olecranon) | `AutoMovieHumanDeltoidSpan` |
| upper-arm compartments | insertion to the supracondylar ridge | `AutoMovieHumanUpperArmCompartments` |
| elbow | supracondylar ridge, over the elbow centre, to the distal edge (0.1 of elbow centre to stylion) | `AutoMovieHumanElbowSpan` |
| forearm belly | distal edge to the musculotendinous junction (0.6) | `AutoMovieHumanForearmBelly` |
| wrist | junction to the wrist crease at stylion; the heel beyond is the hand's | `AutoMovieHumanWristSpan` |

Before the spans: the glenohumeral centre (`AutoMovieHumanArmShoulder`, the trunk's when it publishes one), the bones (`AutoMovieHumanArmBones`, de Leva 1996 Table 2 above) and the walk (`AutoMovieHumanArmAxis`, the bone polyline with its corner rounded at the elbow centre). Between the trunk's shoulder ring and the first span: the root strip (`AutoMovieHumanArmRootStrip`, a cubic Hermite strip that leaves the ring along the trunk's own tangent and meets the arm's last square section, one scye radius down the walk, in its own tangent plane). The spans' rows and knots are composed by `AutoMovieHumanArmGuides` and `AutoMovieHumanArmGirth`, the section by `AutoMovieHumanPolarSector` and `AutoMovieHumanArmTube`, and the chain by `AutoMovieHumanArmLayers` from the law (`AutoMovieHumanArmLaw`). The flat oval of the wrist and the ulnar border are rows of the belly and wrist spans, not separate pieces.

Rows are the medians of the four references at 0.3, 0.45, 0.6 and 0.75 of the humerus, at the supracondylar ridge, the elbow centre and 0.1, 0.22, 0.4, 0.6, 0.8 and 0.95 of the forearm; the deltoid span's first row is the nearest to the root where all four references' sections stand free of the trunk. The insertion row is read at 0.45, 3 mm from the insertion's 0.4388.

## Open questions

- The reference skins measure acromion-radiale plus radiale-stylion 50 to 60 mm below their own length inputs; built to the inputs the arms stand longer than the references.
- Prominence heights of the olecranon, the medial epicondyle and the radial head's dimple over the skin's base.
