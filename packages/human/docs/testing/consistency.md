# Anatomical consistency

A consistency rule finds a logical contradiction in a generated person: a relation between parts that anatomy, geometry or the person's own inputs make impossible. Every rule holds for any supported person and takes its expectation from that person's inputs or from a cited published value. This catalog lists those rules, ranked by how many contradictions each finds, with where each is read and who implements it.

The comparison with the MetaHuman reference bodies is a separate gross-defect layer, listed with its files in section 7.

## 1. How to test

### 1.1 Levels

Every rule names one level and the thing it reads at that level, so a failure names its piece, seam, chain and layer.

| Level | Reads | Example |
| --- | --- | --- |
| piece | one construction piece built alone from fixed inputs through its standalone entry | the leg's calf span rows: one girth maximum |
| seam | the two pieces or chains either side of a declared seam, read across it | the neck chain's bottom ring against the `upper` chain's top ring |
| composed curve | the delivered chains of a whole person (`IAutoMovieHumanBodyCalibration.chains`), evaluated by `AutoMovieHumanLoftChain.ring` at any station, at layers or between them | the leg chain's taut girth every 2 mm from the crotch ring to the ankle ring |
| region | the emitted skin of a whole person (`HumanAnatomy.ISkin`), cut by any plane, or its rig and pose | horizontal girths of the standing skin between the input sites; the foot's sagittal height profile |

### 1.2 Cuts

A rule need not follow a chain's own layers. A composed chain can be evaluated at any station, and the emitted skin cut by any plane, so the strongest readings are profiles through mid-sections: the girth every 2 mm along a limb, the foot's height every 1 percent of its length, the median face profile every millimetre of arc. A profile is judged by anatomy's description of its shape: which spans rise and which fall, how many interior extrema and inflections each span has, where each extremum lies as a share of the segment, and which way the profile bends.

Profile shape readings use one definition each, so every rule reads them alike:

- Excess variation of a span: its total variation less the absolute difference of its ends. A monotone span reads zero; a wobble of amplitude a reads 2a.
- Interior extremum: a local maximum or minimum that stands above both neighbouring opposite extrema by more than the noise floor (`HumanAnatomyShared.extraTurns`).
- Inflection: a sign change of the second difference over a window w, counted only where both sides exceed `8 e / w^2`, the curvature of a parabola that rises e over a chord w; e is the noise floor.
- Noise floor: the measure's ISO 20685-1:2018 Table 4 allowable error (girths 4 or 9 mm, head and hand 1 mm, foot 2 mm), the least change an anthropometrist resolves at that site.
- Share: a station as a fraction of its segment between two landmarks (bone joint centres or skin landmarks), so the expectation scales with the person.

### 1.3 Expectations

- An input measured at its site by its definition: the identity rows of the anatomy tests; this catalog reads the relations between sites.
- The person's intrinsic profile (section 3): between two sites the expected shape comes from anatomy and the expected end values from the person's own inputs.
- A population band only where no input fixes the relation, and then the published per-sex mean plus and minus 2.326 SD (1st to 99th percentile) from ANSUR II, ANSUR 1988 or the cited source, the union of both sexes unless the person's sex selects one.
- A definition: the natural waist is the least girth between the lowest rib and the iliac crest, so no section between those levels may be narrower than the waist reading.
- Geometry that holds for any closed skin: a taut tape is at least the section's perimeter of its hull; the section's area is at most girth squared over 4 pi.

A rule that cannot be checked independently of the construction is recorded with its reason instead of being given a site.

### 1.4 Proof

Each rule is made red on a made defect of known size and green on a correct shape before it binds, the reading moving by the known change (testing.md). A made defect edits an in-memory copy of the generated chains or skin.

### 1.5 People and caches

- Every rule runs on the core set of `HumanPeople` (four references and six population ends) and, nightly, on the extended set; a rule that holds for one sex or build says so and reads the person's sex from `HumanPeople.sex`. `AUTOMOVIE_HUMAN_PEOPLE=extended` selects the extended set; a comma list of names (`f1`, `f1,m2`) selects those people only, for a diagnostic run that must not wait for the whole set.
- A person, a rigged person, a bind skin, a posed skin and a composed curve profile are generated inside the test that reads them and dropped with it (`HumanPeople.person`, `HumanAnatomyAudit.subject`); a reading that is a pure function of one skin is kept on that skin object alone (`HumanSkinMemo`), so nothing outlives its test. `test_human_levels_structure` lists any module state a test helper keeps.
- Tests generate their people from the public inputs, so they hold on the working tree as it stands.

### 1.6 Files

Tests of this catalog live under `test/src/features/human/curves/`, by level and family: `profile/` (composed-curve profiles by region), `seam/`, `region/`, `input/` (input response and courses), `population/`, `layer/`, `skin/`, `integrity/` (curve soundness) and `reference/` (the removable layer). Piece tests live under `test/src/features/human/<region>/<piece>/`. Observers live under `test/src/features/internal/`, in sub-folders by area (`curves/` for the composed-curve readers). A test file is `test_human_<family>_<region>.ts` with one export named after it; every file stays under 500 lines and is documented to the contracts checklists. The runner discovers `test_*` functions in nested folders and filters by file name, so `pnpm test --include <name>` reaches every one. Run tests with `pnpm test --include <names...>`, which type-checks the project first.

## 2. Common statements, verified

Each statement below was checked against the sources and the inputs before it became a rule.

| Example | Verdict | Rule it becomes |
| --- | --- | --- |
| An ankle cannot be thicker than the waist. | True but coarse: ANSUR II least ankle over omphalion waist is about 0.25 (215.7 / 860.9 women, 229.3 / 940.6 men), so it catches only a gross error. | Kept at low rank as ORD-LG-9; the neighbour order (ankle below calf) catches the same defect earlier. |
| The ankle must be thinner than the calf, and the line from ankle to calf runs smooth. | True at the right site: the least girth above the malleoli is always below the calf maximum (ANSUR II ratio 0.578 women, 0.585 men; 2.326 SD band 0.439 to 0.719). At the malleoli themselves the girth rises again over the bones, so "ankle" must name the least supramalleolar girth. | PRO-LG-5 to PRO-LG-8: monotone fall from the calf belly to the least ankle, at most one inflection (the gastrocnemius' musculotendinous junction), excess variation within 4 mm. |
| Bust girth exceeds waist girth. | A hard rule derived from the person's inputs: whenever the person's chest input exceeds the waist input (f1: chest 856.8 over waist 673.6), the generated skin keeps that order at the ISO sites, and so for every pair of tape inputs. The inputs themselves are bounded by the population (ANSUR 1988 chest over natural waist 1.253, SD 0.055 women; 1.183, SD 0.050 men) in `test_human_people`; the natural waist is by definition the least girth between the lowest rib and the iliac crest. | ORD-0 (every pair of tape inputs keeps its order on the skin), ORD-TR-1, PRO-TR-3 (no section between underbust and high hip narrower than the waist reading). |
| A knee cannot bend inward. | True as a statement about flexion: the knee flexes about the transepicondylar axis, so flexion carries the ankle backward in the thigh's sagittal plane (AAOS clinical definition). At neutral a small valgus of the anatomical tibiofemoral angle is normal; the mechanical axis (hip-knee-ankle) of healthy young adults is 2.2 degrees varus on average with an SD of 2.5 to 2.7 degrees (Tang 2000), so a band from about 4 degrees of valgus to 8.5 of varus holds. | KIN-LG-1 (flexion moves the ankle posterior), KIN-LG-2 (no frontal-plane swing under flexion), KIN-LG-4 (knee centre within a hip-knee-ankle band at neutral). |
| A lean person shows no flesh folds. | Too coarse: even a lean face carries the supratarsal eyelid crease, the nasolabial and mentolabial sulci, the philtrum, the alar crease, and a lean body the gluteal sulcus, the inguinal crease, the natal cleft, the umbilicus, the inframammary fold of a breast, the wrist and palmar creases. | FLD-1: no crease outside the named anatomical sites; FLD-2 to FLD-6: at each site a depth bounded by the person's own overhang and adiposity, and the adiposity folds (submental, abdominal, back, lateral waist) absent when the person's waist-to-stature ratio is under 0.5. |
| The ear lies between brow and nose-base level. | A drawing convention, not a limit: Farkas 1994 found the neoclassical canons valid in a minority of faces. | XF-HD-6: order and a band only: superaurale above the exocanthion's level less a band, subaurale above menton and below superaurale, the ear's long axis inclined backward. |
| Lofting curves unroll across a part with no crack. | True for any closed skin. | SEAM rows (G0, G1, G2 as declared) and CUR rows (no step in girth, centroid or area between neighbouring stations beyond the station spacing's own change). |

## 3. Intrinsic profile

Each person has an expected profile per region: an ordered list of sites along the region's axis, the person's input at each site where one exists, and between consecutive sites a shape from anatomy. The expectation function is `E(person) = [(site_i, value_i or none, share window_i)], [(span_i, shape_i)]`; a test reads the generated profile and checks every site's value and every span's shape against it, so a person at a population end is read against their own inputs.

Shapes: `down` (monotone falling, excess variation within the floor), `up`, `V` (one interior minimum), `A` (one interior maximum), `flat` (excess variation and net change within the floor). An inflection budget follows each span in brackets.

### 3.1 Leg, horizontal girths of the standing skin, crotch to floor

| # | Site | Input | Locus (share of the segment) |
| --- | --- | --- | --- |
| L0 | crotch (lowest midline skin between the legs) | `inseam` + `ankleHeight` (ISO 8559-1 5.7.6) | height |
| L1 | thigh | `thigh` (ISO 8559-1 5.3.20, widest below the gluteal fold) | 10 mm under the crotch to 0.1 S below it |
| L2 | lower thigh (suprapatella) | none (ANSUR II lower thigh 400.7 / 409.3) | patella's top: 0.03 to 0.06 S above mid-patella |
| L3 | knee | `knee` (ISO 8559-1 5.3.22, mid-patella) | ANSUR II mid-patella 16.9 / 3.3 mm below the lateral epicondyle |
| L4 | infrapatellar least girth | none | tibial tuberosity level, 0.05 to 0.2 of the shank below the knee centre |
| L5 | calf | `calf` (ISO 8559-1 5.3.24, widest) | 0.15 to 0.6 of the shank below the knee centre |
| L6 | least ankle | none (ANSUR II ankle 215.7 / 229.3, least horizontal) | 0.75 to 0.97 of the shank |
| L7 | malleoli | `ankleHeight` (lateral malleolus) | the ankle joint |

| Span | Shape | Basis |
| --- | --- | --- |
| L0 to L1 | `up` [0]: the thigh widens from the crotch's split to its widest | ISO 5.3.20 places the thigh's widest just below the fold |
| L1 to L2 | `down` [1] | the quadriceps and adductor mass tapers to the suprapatellar tendon region (Gray 1918); ANSUR II lower thigh / thigh 0.650 women, 0.655 men |
| L2 to L4 | `V` or `down` [2]: the patella and condyles may stand proud | knee girth ANSUR 1988 between lower thigh and calf |
| L4 to L5 | `up` [1] | gastrocnemius bellies |
| L5 to L6 | `down` [1]: one inflection at the musculotendinous junction | Gray 1918: the gastrocnemius ends in its tendon about mid-calf, the soleus lower |
| L6 to L7 | `up` [0] | the malleoli stand out |
| Values | L1 = thigh, L3 = knee, L5 = calf within their tolerances; L6 / L5 within 0.439 to 0.719; L1 > L3 always (ANSUR 1988 knee / thigh 0.631, SD 0.029); L3 against L5 follows the inputs, since calf over knee is 0.966 (SD 0.041) and can pass 1 | ANSUR 1988 relations (`HumanPopulationAudit.RELATIONS`) |

### 3.2 Arm, girths normal to the bone, shoulder centre to the wrist crease

| # | Site | Input | Locus |
| --- | --- | --- | --- |
| A0 | arm root (first own section) | none | the root strip's end |
| A1 | upper arm | `bicep` (relaxed, midway acromion to olecranon) | 0.5 of acromion-radiale |
| A2 | supracondylar least girth | none | 0.75 to 0.95 of the humerus |
| A3 | elbow | `elbow` (over the olecranon, extended) | elbow centre |
| A4 | forearm belly | `forearm` (relaxed maximum below the elbow) | 0.1 to 0.6 of radiale-stylion |
| A5 | wrist | `wrist` (over stylion) | stylion, 1.5 mm proximal of the wrist centre (de Leva 1996) |

| Span | Shape | Basis |
| --- | --- | --- |
| A0 to A1 | `down` [1] | the deltoid's insertion at mid-humerus (Gray 1918) |
| A1 to A2 | `down` [1] | biceps and triceps taper to their tendons |
| A2 to A3 | `up` or `flat` [0]: the epicondyles and olecranon | Gray 1918 |
| A3 to A4 | `up` or `flat` [0] | brachioradialis and the flexor-extensor mass |
| A4 to A5 | `down` [1], least girth within 30 mm proximal to 10 mm distal of stylion | Gray 1918; existing arm rows |
| Values | A1, A3, A4, A5 their inputs; A5 < A3 always (ANSUR 1988 wrist / elbow 0.635, SD 0.023); A5 < A4 always; A1 against A3 and A3 against A4 follow the inputs | |

### 3.3 Trunk, horizontal girths with the arms left out, neck base to crotch

| # | Site | Input | Locus |
| --- | --- | --- | --- |
| T0 | neck base | `neckBase` (ISO 5.3.3) | cervicale to suprasternale line |
| T1 | axilla level | none | axilla height, ANSUR II 0.761 / 0.757 S |
| T2 | chest | `chest` (ISO 5.3.4, at the bust point) | ANSUR II chest height 0.720 / 0.735 S |
| T3 | underbust | `underbust` (ISO 5.3.8, inframammary fold) | the fold |
| T4 | natural waist | `waist` (least between rib and iliac crest) | 0.56 to 0.70 S |
| T5 | high hip | `highHip` (ISO 5.3.12, midway T4 to T6) | midway |
| T6 | hip | `hip` (ISO 5.3.13, buttocks' greatest projection) | ANSUR II buttock height 0.512 / 0.506 S |
| T7 | crotch | `inseam` + `ankleHeight` | height |

| Span | Shape | Basis |
| --- | --- | --- |
| T2 to T3 | `down` [1] (feminine: the breast's underside); men `flat` within the floor | underbust / chest 0.849 (SD 0.029) women, 0.934 (SD 0.017) men, ANSUR 1988 |
| T3 to T4 | `down` [1] | the waist is the least girth above the iliac crest (definition) |
| T4 to T6 | `up` [1], or `A` then `up` [2] when the inputs place high hip above the line from waist to hip (central adiposity) | definition of the natural waist; WHO 2008 on central adiposity |
| T6 to T7 | `down` [1] | the gluteal fold |
| Values | T2, T3, T4, T5, T6 their inputs; every section from T3 to T5 at least T4 less 9 mm (definition); T3 < T2 for a feminine person | |

### 3.4 Neck, girths normal to the neck axis

N0 neck base (`neckBase`), N1 least girth (`neck`, ISO 5.3.2 below the thyroid cartilage), N2 the jaw. N0 to N1 `down` [1], N1 to N2 `up` [1]; N0 > N1 (ANSUR 1988 neck base / neck 1.097, SD 0.024 women; 1.076, SD 0.023 men).

### 3.5 Hand and digits, girths normal to each digit's bone, web to tip

Per finger: F0 web, F1 P1 shaft, F2 PIP, F3 P2 shaft, F4 DIP, F5 P3 shaft, F6 pulp, F7 apex. F0 to F1 `down` [1], F1 to F2 `up` [0], F2 to F3 `down` [0], F3 to F4 `up` [0], F4 to F5 `down` [0], F5 to F7 `A` (the pulp) then the cap. Values: F2 > F4 (Bridgman 1920: "the joints are square, the shafts narrower", the PIP joint the larger), every girth below the hand circumference over the number of fingers. Thumb: CMC, MCP, IP, tip, one interior maximum at the IP joint. Expected finger lengths follow `handLength` and `palmLength`: the middle finger reaches dactylion III at hand length.

### 3.6 Foot, along the foot axis from the heel (0) to the longest toe (1), foot length `footLength`

| Profile | Shape along the length | Basis |
| --- | --- | --- |
| Dorsal height (highest skin at each share) | `up` from the heel's back to the ankle, then `down` [1] from the summit to the toe tip, the summit in the rear half | Gray 1918: the dorsum is highest over the talus and navicular and falls toward the toes; the arch height index (Butler et al., `sources/butler-arch-height-index.md`) reads the dorsal height at 0.5 of the foot |
| Medial plantar height (lowest skin of the medial third) | on the floor under the heel (0.02 to 0.25), one `A` rise for the medial longitudinal arch with its apex at 0.3 to 0.6 (navicular), back on the floor under the first metatarsal head (0.7 to 0.8) | ANSUR II first head at 0.739 / 0.741; arch apex window [source note needed] |
| Lateral plantar height | at or under the medial plantar height at every share; on the floor under the heel and the fifth head | the lateral arch is lower than the medial (Gray 1918) |
| Breadth (extent across the axis) | `up` from the heel to its maximum in 0.6 to 0.8 (the metatarsal heads), `down` to the toes | ANSUR II breadth across the heads; heel breadth below foot breadth |
| Values | length and breadth their inputs; the malleolus at `ankleHeight`; the medial malleolus higher and further forward than the lateral (Gray 1918) | |

### 3.7 Head, median profile from vertex to the cervical point, curvature signs by arc

Sign runs, top to bottom: convex vault and forehead; convex glabella; concave nasion; convex dorsum and pronasale; concave subnasale; convex labrale superius; concave stomion; convex labrale inferius; concave sublabiale; convex pogonion and menton; concave cervicomental angle. Each Farkas landmark is defined as one of these extrema, so the profile has exactly that sequence of sign runs, beyond a 1 mm floor (ISO head dimensions), and its landmarks stand in that vertical order. Values: n-gn `faceHeight`, n-sn `nose.height`, sn-prn `nose.protrusion`, ls-sto and sto-li the vermilion inputs, v-me `height`.

## 4. Rule tables

Columns: Id; level (P piece, S seam, C composed curve, R region); read (chain and layer, piece, seam or skin site); statement; expectation and its basis; contradiction caught; red proof; state (now: existing observers read it; new: needs a new observer; exists: an existing test already reads it); rank (1 finds the most, 3 the least).

Tolerance shorthand: G4 and G9 ISO 20685-1 small and large girth errors; H1 head and hand 1 mm; F2 foot 2 mm; CR the 1 mm crease sagitta over a 10 mm chord (`HumanAnatomyShared.CREASE`).

### 4.1 Input response (IR): each input moves its own measure at its own site and nothing else

Read by `HumanInputResponse` on f1: each control moved alone by three times its reading's allowable error. Every held reading moves by less than its own error, since the controls are independent (`IAutoMovieHumanBodyControls`: "no control is inferred from another"). The last column gives the latest reading on f1 by input and site, for the modeler of the region it names.

| Id | L | Read | Statement | Expectation | Finding on f1 (own reading; leaks) | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IR-1 | R | trunk tapes | `underbust` moves the underbust tape only | +27 mm at the fold, others under their error | 8 of 27; chest -9 | exists | 1 |
| IR-2 | R | trunk tapes | `waist` moves the waist tape only | | underbust +29 | exists | 1 |
| IR-3 | R | neck tapes | `neck` moves the neck girth only | | neck base +25, shoulder-to-apex +19 | exists | 1 |
| IR-4 | R | neck tapes | `neckBase` moves the neck base girth only | +12 | -8 | exists | 1 |
| IR-5 | R | courses | `acrossShoulder` moves ISO 5.4.3 only | +30 | 7.9 of 30; both biceps +5 | exists | 1 |
| IR-6 | R | courses | `neckToWaist` moves ISO 5.4.5 only | | underbust, waist, high hip 10 to 14 | exists | 1 |
| IR-7 | R | courses | `shoulderToApex` moves ISO 5.4.10 only | +21 | 12 of 21; neck base -4 | exists | 1 |
| IR-8 | R | crotch | `inseam` moves the crotch height only | +30 | neckToWaist -13 | exists | 1 |
| IR-9 | R | arm tapes | `elbow` moves the elbow girth by its change | +12 | 7.4 of 12 | exists | 1 |
| IR-10 | R | arm tapes | `forearm` moves the forearm girth only | | elbow +4.8 | exists | 1 |
| IR-11 | R | arm lengths | `lowerArmLength` moves radiale-stylion only | | acrossShoulder -41, upperArmLength +20, bicep +6.5 (old joint-based radiale; rerun) | exists | 1 |
| IR-12 | R | stature | `height` moves stature and no other length input's reading | | neckToWaist +6.4 for +18 | exists | 1 |
| IR-13 | R | head | `head.length`, `cephalicIndex` move g-op and eu-eu only | | zy-zy +2.4, +2.9 | exists | 1 |
| IR-14 | R | head | `head.height`, `faceHeight` move v-me and n-gn only | | al-al +1.7, +2.0 | exists | 1 |
| IR-15 | R | face | fissure height and nose height move their own measure only | | al-al +1.3, +1.4 | exists | 1 |
| IR-16 | R | face | `nose.width` moves al-al by its change | +3 | 1.8 of 3 | exists | 1 |
| IR-17 | R | face | `nose.protrusion` moves sn-prn only | | al-al +13 | exists | 1 |
| IR-18 | R | ears | ear length, breadth and protrusion move their own measure | +3 | length 0.7 of 3; breadth and protrusion misrouted | exists | 1 |
| IR-19 | R | hands | `handLength`, `palmLength` move their own length only | | hand breadth -1.1, +1.3 | exists | 1 |
| IR-20 | R | ignored inputs | `bustSpan`, `upperArmLength`, `thigh`, `faceWidth`, `mandibularWidth`, `lowerVermilionHeight` move their measure | the change | 5.9 of 21; 1.6 of 12; 2.8 of 27; 0.0 of 3; 0.0 of 3; 0.06 of 3 | exists | 1 |
| IR-21 | R | honoured inputs | a negative change of the same size reads the same amount the other way | `-delta` within the error | not run | new | 2 |
| IR-22 | R | ORD and PRO rows | the order and profile rows stay green on every perturbed person of IR-1 to IR-20 | the rows below | not run | new | 2 |
| IR-23 | R | inputs without a site | `minimumFrontalWidth`, `ankleHeight`, `bodyFatPercentage` move the figure monotonically over their domain; `ankleHeight` at the lateral malleolus prominence once it is found | a monotone response | change seen, no site | cut: no site to read | 3 |
| IR-24 | R | pose-only inputs | `mouthOpening` and `mandibularLaterotrusion` limit poses only, so the rest figure is identical vertex for vertex | zero change at rest | the rest figure changes | exists | 2 |

Course and site rules that go with the input response:

| Id | L | Read | Statement | Expectation | State | Rk |
| --- | --- | --- | --- | --- | --- | --- |
| IR-25 | R | bust point width | not read on the skin: ISO's bust point is set in a bra (3.1.11) and the modelled skin carries no nipple, so `bustSpan` has no site | the row is absent; IR-20 reads the input's response | exists (row to remove from the course test) | 1 |
| IR-26 | R | side neck point and bust point, each side | each side's landmarks are located on that side's own skin, so a left-right difference of a course reads the skin's own asymmetry | f2's `shoulderToApex` reads 253.7 (left) and 271.5 (right) against 268.7: both sides' landmarks are re-read before the difference counts as an input offset | new | 2 |
| IR-27 | R | acromion and radiale on the skin | the arm-length rows read acromion (the shoulder point, ISO 3.1.1) and radiale (the radial head's hollow) on the skin, independent of the rig's joints | acromion-radiale and radiale-stylion within their ANSUR II errors | radiale exists; acromion new | 1 |
| IR-28 | R | thigh tape at the gluteal fold | ISO 8559-1 5.3.20 reads the thigh's widest just below the gluteal fold, located on the skin (FLD-3) | the thigh input within G9 | new | 1 |

### 4.2 Every public parameter changes the figure (PAR)

The human skill's Done When: every public parameter changes the figure through the construction, answered at its published site.

| Id | L | Read | Statement | Expectation | Finding | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PAR-1 | R | whole bind skin | `IAutoMovieHumanComposition` (body fat percentage, appendicular lean mass index, ten subcutaneous fat thicknesses) changes the figure | a vertex moves when a field moves | read by no generation code (`IAutoMovieHumanIdentity` only) | recorded: `IAutoMovieHumanComposition` lives only in `IAutoMovieHumanIdentity`, which `IAutoMovieHumanParameters` does not carry, so the generator has no such input to perturb; the row binds once the parameters carry it | 1 |
| PAR-2 | R | whole bind skin | `supplement` changes the figure | | identical vertex for vertex | exists | 1 |
| PAR-3 | R | whole bind skin | `body.measurements` changes the figure or is declared diagnostic-only | | identical | exists | 1 |
| PAR-4 | R | whole bind skin | `body.diagnostics` changes the figure or is declared diagnostic-only | | identical | exists | 1 |
| PAR-5 | R | every body control | the reading at a control's site rises with the control between its domain ends | rank correlation +1 over five values across the domain | not run | new | 2 |

Fat, muscle and organ layers do not exist as shapes: fat and muscle enter only through the unitless `fat` and `muscularity` controls, which grow the outer skin. Layer nesting, thickness and layer volume rules therefore have no object; they are listed under PAR-1 and wait for that input to be consumed.

### 4.3 Order of girths, breadths and lengths (ORD)

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORD-0 | C, R | every pair of girth tapes at their ISO and ANSUR sites: underbust, chest, waist, high hip, hip, neck, neck base, thigh, knee, calf, bicep, elbow, forearm, wrist, hand circumference | the generated girths stand in the order of the person's own inputs | for every pair whose inputs differ by more than the sum of their two ISO 20685-1 errors, sign(generated a - generated b) = sign(input a - input b); the least ankle has no input and is read by ORD-LG-2 | a construction that swaps, flattens or crosses any two tapes | on f1, narrow a copy's chest rings below the waist girth: the chest-over-waist pair turns red | new | 1 |
| ORD-TR-1 | C, R | trunk sections at T2, T4, T6 | the skin keeps the order of its own chest, waist and hip inputs | sign of (generated a - generated b) equals sign of (input a - input b) wherever the inputs differ by more than G9 + G9 | a construction that swaps or flattens the trunk's tapes | on f1, narrow a copy's chest rings below the waist girth | now | 1 |
| ORD-TR-2 | C, R | T3 against T2 | a feminine person's underbust is narrower than her chest | underbust < chest - G9 when the declared sex is female | a breast with no projection | flatten the breast relief | now | 1 |
| ORD-TR-3 | C, R | T5 between T4 and T6 | the high hip lies between the waist and hip girths when its input does | input order | a high hip bulging out of its neighbours | swell the high-hip rows 10 percent | now | 2 |
| ORD-TR-4 | R | breadths at T2, T4, T6 | breadth order follows girth order at the same levels | sign agreement | a section shaped against its girth | stretch a waist ring sideways at constant girth | new | 2 |
| ORD-NK-1 | C, R | N0, N1 | the neck base is wider round than the neck | N0 > N1 (ANSUR 1988 1.097 and 1.076, SD 0.024 and 0.023; 3 SD floor 1.008) | a neck as wide at its least as at its base | widen the least ring 15 percent | exists (ratio row) | 1 |
| ORD-NK-2 | R | neck girth against head circumference | the neck is narrower than the head | neck / head circumference 0.5 to 0.8 (ANSUR II neck 329.8 and 397.6; head circumference source note to read the means) | a head no wider than its neck | shrink the head chains 30 percent | cut: no source note for the band | 3 |
| ORD-NK-3 | S | neck chain `head` top ring against `head.lower` bottom ring | the neck's top ring is no wider than the head ring it meets under the jaw | perimeter(neck top) <= perimeter(head.lower bottom) + G4 | a collar where the neck meets the jaw | widen the neck's top layer | new | 2 |
| ORD-AR-1 | C, R | A5 against A3, A4 | the wrist is the narrowest of the arm's tapes | A5 < A3 and A5 < A4 (ANSUR 1988 wrist / elbow 0.635, SD 0.023) | a mitten wrist | swell the wrist rows 50 percent | exists (`HumanAnatomyOrdering`, unrun) | 1 |
| ORD-AR-2 | C, R | A1, A3, A4 | the arm keeps the order of its own bicep, elbow and forearm inputs | sign agreement where inputs differ by more than G4 | an elbow wider than its upper arm against the inputs | swap two rows | now | 1 |
| ORD-AR-3 | C | A0 against A1 | the arm root is at least as wide round as the mid upper arm | A0 >= A1 - G4 | an arm that narrows into the shoulder | shrink the root strip's end | new | 2 |
| ORD-AR-4 | S | `arm.*` root perimeter against the trunk's girth at the axilla | the arm root is narrower than half the trunk at its level | perimeter(arm root) < trunk girth at axilla height / 2 | an arm root that swallows the torso (trunk plan R6) | widen the arm-root oval two times | new | 1 |
| ORD-AR-5 | R | A1, A3, A4, A5 on the skin | the upper arm outgirths the forearm and the elbow, and each outgirths the wrist; the elbow is not ordered against the forearm | A1 > A3 > A5 and A1 > A4 > A5; A4 against A3 within about 7 percent either way (inputs: f1 forearm 227.9 over elbow 219.8, f2 240.5 over 234.4; ANSUR II flexed biceps 305.6 and 358.1, forearm 264.1 and 310.1, wrist 154.8 and 175.9 for women and men) | a forearm wider than the upper arm, an elbow pinched below the wrist | swell the forearm 40 percent | new | 1 |
| ORD-HN-1 | R | digit girths at P1 mid-shaft | thumb > middle; little < index, middle and ring | strict beyond H1 (Greiner 1991 digit breadths) | a little finger thicker than its neighbours | swell the little finger | new | 2 |
| ORD-HN-2 | R | hand circumference against wrist girth | the hand over the knuckles is wider round than the wrist | `handCircumference` > `wrist` on the skin | a hand narrower than its wrist | shrink the palm | new | 2 |
| ORD-HN-3 | R | finger lengths | the middle finger is the longest, the little the shortest | existing rows | | | exists | 1 |
| ORD-HN-4 | R | MCP2 to MCP5 along the hand axis | the knuckles arc: the index head is the most distal, the little the most proximal | distal order 2, 3, 4, 5, the index 3 mm beyond the middle knuckle, the ring 9 mm and the little 16 mm behind it, within H1 (`anatomy/hand.md`, from Reddy 2024: the second metacarpal is the longest, 1.039 of the third, and the bases are level across the carpal row). Bridgman 1920's "third knuckle largest and highest" is a statement of size and height, not of distal reach | a straight or reversed knuckle line | move MCP5 distal of MCP3 | new | 2 |
| ORD-LG-1 | C, R | L1 against L3 | the thigh is wider round than the knee | L1 > L3 (ANSUR 1988 knee / thigh 0.631, SD 0.029; 3 SD top 0.718) | a thigh with no mass above the knee | shrink the thigh rows to the knee girth | new | 1 |
| ORD-LG-2 | C, R | L6 against L5 | the least ankle is narrower than the calf | L6 / L5 within 0.439 to 0.719 | a swollen ankle | existing red proofs | exists | 1 |
| ORD-LG-3 | C, R | L3, L5 | knee and calf keep the order of their inputs | sign agreement where inputs differ by more than G4; calf / knee is 0.966 (SD 0.041), so either order is human | | swap the knee and calf rows | now | 2 |
| ORD-LG-4 | R | L1 against T6 | a thigh is narrower than the hip | thigh / hip 0.540 to 0.666 (ANSUR 1988 0.600 and 0.606, SD 0.020, 3 SD) | a thigh wider than the pelvis | widen the thigh 40 percent | new | 2 |
| ORD-LG-5 | S | leg top layer (half the crotch ring) against L1 | the thigh's root is at least the thigh tape | half crotch ring >= thigh - G9 (leg plan: 606 against 556 on f1) | a root narrower than the thigh it feeds | shrink the crotch arcs | new | 2 |
| ORD-LG-9 | R | L6 against T4 | the least ankle is narrower than the waist | L6 < T4 | a gross scale error only | scale the ankle four times | cut: a gross order the neighbour order ORD-LG-2 already catches | 3 |
| ORD-LG-6 | C, R | hip joint, crotch, knee joint and ankle joint heights | the heights stand in the body's order: hip joint over crotch over knee over ankle over the floor | every gap >= 0 | a crotch above the hip joint, a knee below the ankle | lower the crotch under the knee centre | implemented (`HumanAnatomyLegProfile`) | 1 |
| ORD-LG-7 | C, R | L1, L3, L5, L6 | the thigh outgirths the knee and the calf, and each outgirths the least ankle; knee against calf is not ordered | the four margins >= 0 | any of those orders inverted | widen the knee past the thigh on a copy of the sites | implemented (`HumanAnatomyLegProfile`) | 1 |
| ORD-LG-8 | R | the least horizontal girth from the knee down to the lateral malleolus' height | the least ankle girth lies above the malleoli, the identity's own definition of the ankle circumference | its height over the input `ankleHeight` is at least 4 mm (two sections) | a pinch at the malleoli, an ankle least at the bone | pinch the shank to 0.6 across the malleoli | implemented (`HumanAnatomyLegProfile`) | 1 |
| ORD-FT-1 | R | breadth at the heel against the ball | the heel is narrower than the ball | heel breadth < foot breadth (bimalleolar 67.0 and 74.8 against foot breadth 92.7 and 101.9, ANSUR II; heel breadth itself needs a source note) | a heel as wide as the forefoot | widen the heel | new | 2 |
| ORD-FT-2 | R | toe tips along the foot axis | the longest toe is the first or the second; toes 3, 4, 5 end successively nearer the heel | tip(1 or 2) is the farthest; tip(3) > tip(4) > tip(5) beyond F2 | a fifth toe reaching past the third | lengthen toe 5 | new | 1 |
| ORD-FT-3 | R | toe girths | the hallux is the thickest toe, toe 5 the thinnest | hallux > toe 2 > toe 5 | a fat little toe | swell toe 5 | new | 2 |
| ORD-FT-4 | R | heel, ankle joint, first metatarsal head and toe tips along the foot axis | the ankle stands over the foot behind its ball | heel < ankle joint < first head (0.739 and 0.741 of the length, ANSUR II) < the toe tips | an ankle over the forefoot or behind the heel | move the ankle joint half a foot length forward | new | 2 |
| ORD-HD-1 | R | head breadths | eu-eu > zy-zy > go-go, and ft-ft < zy-zy | strict beyond H1 (Farkas 1994 adult means; source note needed) | a jaw wider than the cheeks or the cranium | widen the jaw piece | now | 1 |
| ORD-HD-2 | R | ch-ch against al-al | the mouth is wider than the nose when the inputs agree | input order, else ch-ch > al-al | a mouth narrower than the nose | swap their inputs on a copy | now | 2 |

### 4.4 Profile shape between sites (PRO)

Each row reads its region's intrinsic profile (section 3) as a mid-section profile every 2 mm, on the composed chain (C) and the standing skin (R). A failure names the span, the share where the extra extremum or inflection lies, and its size.

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRO-LG-1 | C, R | `leg.*`, L0 to the knee | the thigh's widest horizontal section is its top: the girth falls from the crotch ring to the knee, with no rise below its maximum beyond G4 | `down` [1] from the maximum: the largest rise below the maximum <= G4. The standing skin's section falls at every 6 mm step: the f1 reference from 639 mm at 803 mm height to 425 mm at 569 mm, the generated f1 from 635 to 427 mm | a lump, groove or second belly on the thigh | swell a 100 mm band of the thigh 15 percent | implemented (`HumanAnatomyLegProfile`, region level) | 1 |
| PRO-LG-2 | C, R | L1 to L2 | the thigh tapers to the knee without a wobble | `down` [1], excess variation <= G4 | a ring bulging mid-thigh, a ridge across the thigh | add a 6 percent ring at 0.5 of the femur | new | 1 |
| PRO-LG-3 | C, R | L2 to L4 | the knee has at most one waist and one patellar rise | `V` or `down` [2] | a knee built of steps | add a ring at the joint line | new | 2 |
| PRO-LG-4 | C, R | L4 to L5 | the shank rises to one calf belly | `up` [1], the maximum within 0.15 to 0.6 of the shank | a second calf belly | existing proofs | exists (one belly) | 1 |
| PRO-LG-5 | C, R | L5 to L6 | the calf falls to the least ankle with one inflection | `down` [1], excess variation <= G4 | a wobble from calf to ankle | add a 5 mm ripple of 40 mm wavelength | new (exemplar) | 1 |
| PRO-LG-6 | C, R | L6's position | the least ankle lies just above the malleoli | 0.75 to 0.97 of the shank below the knee centre | an ankle narrowest at mid-shank | shrink the mid-shank ring | new | 2 |
| PRO-LG-7 | C | leg guides PM and PL (radius from the bone), L4 to L6 | the medial gastrocnemius head reaches lower than the lateral | the PM radius maximum lies below the PL maximum (Gray 1918) | a calf bulging on the wrong side | swap the PM and PL rows | new | 2 |
| PRO-LG-8 | C | leg guide A, L4 to L6 | the tibial crest runs without a bump | `down` [1] on the A radius | a shin with a bump | bump guide A | new | 2 |
| PRO-LG-9 | C | ring centroid track of `leg.*` | the leg's axis bends only at the declared knee rounding | the turn between successive centroid steps at most the station step over the rounding radius (`BEND`) | a kinked leg axis | offset one layer 5 mm | written (`test_human_curves_rings_centre`) | 1 |
| PRO-AR-1 | C, R | `arm.*`, A0 to A1 | the upper arm tapers from its root | `down` [1] | a pinched shoulder root | dent the root | new | 1 |
| PRO-AR-2 | C, R | A1 to A2 | the upper arm tapers to the supracondylar waist without a wobble | `down` [1], excess variation <= G4 | a bulge above the elbow | swell the supracondylar rows | new | 1 |
| PRO-AR-3 | C, R | A2 to A4 | the elbow and the forearm's root rise or hold | `up` or `flat` [0] | a waist at the elbow | pinch the elbow ring | new | 2 |
| PRO-AR-4 | C, R | A4 to A5 | one belly, least girth near stylion | existing rows | | | exists | 1 |
| PRO-AR-5 | C | arm centroid track | the arm's axis bends only at the elbow's declared corner | as PRO-LG-9 | a kinked forearm | offset one layer | written (`test_human_curves_rings_centre`) | 1 |
| PRO-AR-6 | R | upper arm girth cut square to the humerus, 0.15 to 0.85 from the shoulder centre | the upper arm runs down from its belly to the elbow in one run | the largest rise below the maximum <= G4 | a second belly on the upper arm | swell 0.5 to 0.75 of the humerus 12 percent | implemented (`HumanAnatomyArmProfile`) | 1 |
| PRO-AR-7 | R | forearm girth cut from the elbow | the forearm's belly lies in its proximal half | the maximum within 0.1 to 0.6 of the forearm stands at 0.5 or less (Gray 1918: the muscles are fleshy above mid-forearm and tendinous below) | a belly near the wrist | swell 0.45 to 0.65 of the forearm 20 percent | implemented (`HumanAnatomyArmProfile`) | 1 |
| PRO-TR-1 | C, R | `upper`, `trunk`, T1 to T2 | the chest rises to the bust (feminine) or holds (masculine) | `up` [1] or `flat` | a chest dented under the axilla | dent one row | new | 2 |
| PRO-TR-2 | C, R | T2 to T3 to T4 | the trunk falls from the bust to the waist | `down` [1] per span | a roll between the bust and the waist | add a 10 mm roll at mid-span | written (`test_human_curves_profile_trunk_girth`) | 1 |
| PRO-TR-3 | C, R | every section from T3 to T5 | no section there is narrower than the waist reading | min >= T4 - G9 (definition of the natural waist) | a waist off its site | pinch a ring under the waist | new | 1 |
| PRO-TR-4 | C, R | T4 to T6 | the trunk widens from the waist to the hip, with one abdominal maximum only where the inputs place the high hip above the waist-hip line | `up` [1], or `A` then `up` [2] | a belly roll on a lean person | add a 15 mm roll on f1 | written (`test_human_curves_profile_trunk_girth`) | 1 |
| PRO-TR-5 | C, R | T6 to T7 | the buttocks fall into the gluteal fold | `down` [1] | a shelf above the crotch | lift the crotch rows | new | 2 |
| PRO-TR-6 | C | front apex track (most anterior trunk point per height) | the front's sagittal outline runs: bust maximum (feminine), epigastric minimum, abdominal maximum, pubic minimum | those sign runs of x(y), none extra beyond 2 mm | a breast below the abdomen, a double bust | swap two rows | new | 1 |
| PRO-TR-7 | C | back apex track (most posterior per height) | thoracic maximum, lumbar minimum, buttock maximum | the full sign sequence (the existing rows read two sagittae) | a flat or reversed back | existing proofs | exists in part | 1 |
| PRO-TR-8 | C | lateral outline (widest half breadth per height) | shoulder maximum, waist minimum, hip maximum, top to bottom | three runs | a waist above the chest | swap two rows | new | 1 |
| PRO-NK-1 | C, R | neck chain `head` | base, least girth, jaw | existing one-turn row | | | exists | 1 |
| PRO-NK-2 | C | neck centroid track | the neck's axis leans forward from the trunk to the head without a kink | lean within a cited cervical band (source note needed), turn per mm bounded as PRO-LG-9 | a neck kinked at its base | offset the top layer | new | 2 |
| PRO-SH-1 | C | `upper` lateral outline, side neck point to shoulder point | the trapezius line falls monotonically from the neck seat, then the deltoid's outline turns down with no flat apex | `down` [1], then a convex cap; slope at the neck seat equal to the neck's (trunk plan R2, R3) | a shelf or a dome on the shoulder | flatten the cap apex | new | 1 |
| PRO-SH-2 | R | line from the skin's side neck point to its shoulder point (course observer, ISO 8559-1 3.1.1) | the shoulder slopes down from the neck | 10.9 to 34.1 degrees below horizontal: FAA 1965, 22.5 degrees (SD 5.0) in men, Japanese women 20 to 24 (`faa-1965-shoulder-slope.md`) | a square or bottle shoulder | raise the shoulder point to the neck's height | written (`test_human_curves_region_shoulder`) | 2 |
| PRO-HN-1 | C | each `finger.*` girth profile | web, P1, PIP, P2, DIP, P3, pulp, apex as section 3.5 | two interior maxima (PIP, DIP) beyond H1, none else | a sausage finger or a finger of beads | swell mid-P2 | new | 1 |
| PRO-HN-2 | C | each finger's centroid track at the straightened neutral | the finger bends only at its joints | turn within one joint radius of PIP and DIP | a bent shaft | bend a phalanx | new | 2 |
| PRO-HN-3 | C | `thumb.*` girth profile | one interior maximum at the IP joint | | a ringed thumb | swell mid-P1 | new | 2 |
| PRO-FT-1 | R | foot dorsal height along the axis | up to the instep, down to the toe tip, never rising past 0.5 | section 3.6 | a hump on the forefoot, a dip at the instep | raise the dorsum at 0.7 | new | 1 |
| PRO-FT-2 | R | medial plantar height | heel on the floor, one arch, ball on the floor | one interior maximum within 0.26 to 0.56, the middle of the vault between the calcaneus (0.08) and the first head (0.74), 0.41, within 0.15 (the apex reads 0.42 on the four references' medial third in the first survey); under F2 at 0.02 to 0.25 and 0.7 to 0.8 | a double arch, a floating heel, a sunk midfoot | lift the medial sole 8 mm over 0.15 to 0.30 | implemented (`HumanAnatomyFootProfile`, region level) | 1 |
| PRO-FT-3 | R | lateral against medial plantar height | the lateral border is never higher than the medial | lateral <= medial + F2 at every share | an inverted foot | raise the lateral border | new | 2 |
| PRO-FT-4 | R | foot breadth along the axis | one maximum within 0.6 to 0.8 | | a foot widest at the heel | widen the heel | written (`test_human_curves_region_foot_breadth`) | 1 |
| PRO-FT-5 | R | arch height index | dorsal height at 0.5 of the foot over the truncated length (heel to first head, 0.74 of the length by ANSUR II's ball-of-foot length) lies in the published band | Butler et al., `sources/butler-arch-height-index.md`: mean 0.340, SD 0.030 in 100 recreational runners, so 0.270 to 0.410 at 2.326 SD. Williams and McClay 2000 (`williams-mcclay-2000-arch-height.md`) define this same index, dorsum height at 50 percent of foot length over truncated foot length, and measured 0.292 (SD 0.027) at 90 percent weight bearing and 0.316 (SD 0.027) at 10 percent over 102 feet, so the standing band is 0.229 to 0.355; navicular height over foot length 0.142 (SD 0.026) standing bounds the medial arch's apex, 0.082 to 0.202. The union of the two sources' bands, 0.229 to 0.410, spans the loads and samples | a flat slab or a cavus block | scale the foot's heights 0.7 | implemented (`HumanAnatomyFootProfile`, region level) | 2 |
| PRO-FT-6 | C | each `toe.*` girth profile | the toe tapers to its tip with one pulp rise | one interior joint maximum for toes 2 to 5 | a club toe | swell a toe tip | new | 2 |
| PRO-HD-1 | R | median profile, vertex to the cervical point | the curvature sign runs are section 3.7's, beyond H1 | | a missing nasion, a flat philtrum, no mentolabial sulcus, an extra forehead bump | flatten the nasion relief | new | 1 |
| PRO-HD-2 | R | transverse face sections at eye, nose and mouth levels | the face's front arc is convex across, concave only at the nasofacial and nasolabial sulci and the orbits | listed sign runs | a cheek dented across | dent the cheek | new | 1 |
| PRO-HD-3 | C | `head.upper` vault rings | the vault's girth rises from the vertex cap to the circumference level and falls to the ear level | `up` then `down`, the maximum within H1 of the g-op plane | a vault with a ridge or a flat top | add a ring | new | 2 |

### 4.5 Landmarks: order along the axes and position (LMK)

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LMK-1 | R | standing skin, vertical | vertex > glabella > nasion > pronasale > subnasale > stomion > gnathion > menton > suprasternale > axilla > chest point > natural waist > buttock point > crotch > mid-patella > calf belly > lateral malleolus > floor | strict order, each gap at least H1 | any landmark out of its vertical order | swap two layers' heights on a copy | exists in part (`HumanAnatomyOrdering`, the trunk's and leg's) | 1 |
| LMK-2 | R | trunk landmarks against ANSUR II heights over stature | chest point, buttock, cervicale, crotch heights | existing ratio rows | | | exists | 1 |
| LMK-3 | R | suprasternale, axilla, tenth rib, iliocristale, trochanterion levels | each landmark height over stature within ANSUR II mean plus and minus 2.326 SD | ANSUR II fractions 0.817, 0.761, 0.649, 0.611, 0.519 (women) | a trunk landmark at a height no adult has | scale the trunk's heights 0.9 | new | 2 |
| LMK-4 | R | joint centres against skin landmarks | each joint centre lies between its flanking skin landmarks along the limb: the shoulder centre 30 to 40 mm below the acromion skin point, the elbow centre 10 to 20 mm above radiale, the wrist centre 1 to 3 mm distal of stylion, the knee centre between mid-patella and the lateral epicondyle's level, the ankle centre within the malleoli's span | de Leva 1996 Table 2 offsets: shoulder -33.7 / -34.5, elbow 13.9 / 14.3, wrist -1.5, knee 29.4 / 33.5 above tibiale, ankle -12.6 from sphyrion | a joint that has left its bony landmarks | move the knee centre 30 mm | new | 1 |
| LMK-5 | R | every joint centre against its own skin section | each joint centre lies inside the section of skin through it, with clearance | inside, clearance at least a published minimum soft-tissue depth over the bone at that site (source note needed); the arm and leg already read inside | a joint outside its limb; a bone through the skin | existing proofs | exists for arm and leg; new for spine, neck, hand, foot | 1 |
| LMK-6 | R | spine joints against the back skin | the spine's joint line lies behind the trunk's centroid line and inside the trunk, closer to the back than to the front | depth share of the spine from the back within 0.2 to 0.45 of the trunk's depth (vertebral body position; source note needed) | a spine in front of the belly | move the spine joints forward | new | 2 |
| LMK-7 | R | foot landmarks along the foot axis | heel < ankle centre < first metatarsal head < toe tips | strict order beyond F2; the ankle centre over the rear third of the foot length (the share's band from a foot-geometry source; source note needed) | a foot hung by its toes | move the ankle centre forward | new | 1 |
| LMK-8 | R | hand landmarks along the hand axis | stylion < wrist centre < MCP line < PIP < DIP < fingertip for every finger | strict order beyond H1 | a finger folded back into the palm | swap two joints | new | 1 |
| LMK-9 | R | sole and crown | crown at stature, lowest skin a foot's, highest the head's | existing placement rows | | | exists | 1 |
| LMK-10 | R | lateral landmarks | acromion lateral of the side neck point; elbow lateral of the trunk at its level; hip centres about 170 mm apart for a 900 mm leg length (Hara 2016: Y = 8 + 0.086 LL each side) | order, and the hip centres' half spread within Hara's 4.4 mm error band | a shoulder inside the neck, an elbow inside the waist | move the hip centres 30 mm inward | new | 2 |
| LMK-11 | R | umbilicus | the umbilicus lies above the iliac crest level and below the natural waist, near omphalion height | omphalion height over stature within ANSUR II 0.602 plus and minus 2.326 SD (Gray 1918: 2 to 2.5 cm above the iliac tubercles) | a navel at the chest | lift the umbilicus relief | new | 2 |
| LMK-12 | R | crotch height share | crotch height over stature 0.445 to 0.515 | existing | | | exists | 1 |

### 4.6 Segment lengths and proportions (SEG)

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEG-1 | R | bind skeleton joint centres | upper arm (shoulder to elbow centre) and forearm (elbow to wrist centre) follow their inputs through de Leva's offsets | acromion-radiale less 33.7 / 34.5 and 13.9 / 14.3, radiale-stylion less 16.6 / 16.8 and 1.5 | a skeleton built off its inputs | move the elbow 20 mm | new | 1 |
| SEG-2 | R | forearm over upper arm | radiale-stylion over acromion-radiale 0.6907 to 0.8765 | `HumanAnatomyOrdering` | | | exists (unrun) | 1 |
| SEG-3 | R | shank over thigh | knee-to-ankle centre over hip-to-knee centre within ANSUR II joint-centre ratios 1.06 to 1.07 mean (skeleton.md), band from their SDs (source data) | a shank shorter than its thigh by more than people have | swap the knee height | new | 1 |
| SEG-4 | R | hand length over forearm | hand length over radiale-stylion within ANSUR II ratio band (hand 181.1 / 193.3, forearm 241.3 / 267.9; band from per-subject data) | a giant or tiny hand for its forearm | scale the hand inputs | new | 2 |
| SEG-5 | R | foot length over shank | foot length over knee-to-ankle within the ANSUR II band | a foot out of scale with its leg | scale the foot | new | 2 |
| SEG-6 | R | head height over stature | v-me over stature within the ANSUR II and Farkas band; 1/7.5 to 1/8 classical proportion as illustration only | a head too large or small for its body | scale the head | new | 2 |
| SEG-7 | R | span over stature | fingertip span with the arms abducted 90 degrees over stature within 1.019 (SD 0.029) women and 1.033 (SD 0.027) men, plus and minus 2.326 SD | arms too long or short for the body | lengthen the arms | new | 1 |
| SEG-8 | R | sitting height over stature | vertex above the buttocks' lowest point, seated, approximated as vertex height less crotch height plus a seat depth; ANSUR II 0.526 (SD 0.014) and 0.523 (SD 0.014) | a trunk too long for its legs | move the crotch | new | 2 |
| SEG-9 | R | finger phalanx shares | P1 : P2 : P3 of each finger within Buryanov 2010 shares | phalanges out of proportion | move a PIP | new | 2 |
| SEG-10 | R | thumb metacarpal and phalanges | thumb segment shares within Buryanov and Reddy 2024 | a thumb with a long tip | move the IP | new | 2 |
| SEG-11 | R | toe lengths over foot length | each toe's free length within published shares (source note needed) | a sixth-finger toe | lengthen a toe | cut: no source note for toe shares | 3 |
| SEG-12 | R | neck length | cervicale to the head's base over stature within the ANSUR II band of cervicale height less tragion height (source note needed) | a giraffe or a missing neck | lift the head | new | 2 |

### 4.7 Section shape (SEC)

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-1 | C | every ring of every chain | a section winds counter-clockwise about its chain's station direction, so its area is positive | signed area about the station direction above zero; the area's upper bound, girth squared over 4 pi, holds for every closed curve and checks nothing | an inverted ring | reverse a ring's winding | exists (`winding`) | 1 |
| SEC-2 | C | every limb ring | a limb section is close to round: isoperimetric quotient above that of an ellipse at the least published depth over breadth | `4 pi A / G^2 >= q(r_min)`, r_min the ANSUR II site ratio's 2.326 SD low end (for r = 0.7, q = 0.954) | a flattened, dented or pinched limb section | flatten a ring to half its depth | new | 1 |
| SEC-3 | C | trunk rings at T2, T4, T6 | depth over breadth within ANSUR II bands | existing rows on the skin; the same on the chain | | | exists on the skin | 1 |
| SEC-4 | C | every ring | the section is star-shaped about its centre: every ray from the centre meets the ring once | one crossing per ray at 192 phases | a ring folded back on itself without crossing | push one control point past the centre | new | 1 |
| SEC-5 | C | trunk rings | the trunk's section is convex except at the declared concavities: the spinal furrow, the intergluteal cleft, the intermammary cleft, the inguinal folds | concave runs only within those windows, each concavity's sagitta within its window's band | a dented flank | dent a flank control | new | 1 |
| SEC-6 | C | limb rings | a limb's section is convex except where anatomy hollows it (the popliteal fossa in flexion, the cubital fossa, the radial head's dimple) | concave runs only in those windows | a groove along a limb | dent a sector | new | 2 |
| SEC-7 | C | foot sections at the arch | the medial plantar side is concave under the arch, the sole flat under the heel and ball | sign runs | a convex arch | | new | 2 |
| SEC-8 | C | ring sampling | the chain's phases are evenly spread round each ring (no phase bunching) | arc length between consecutive phases within a factor 3 of its mean | slide, sheared skin | rotate one layer's phases | exists as `slide` | 2 |

### 4.8 Composed curve integrity, by chain and layer (CUR)

Read for every chain of every person, at every layer `chain/k` and at mid-sections between layers; findings name `chain/k` and the phase interval.

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CUR-1 | C | layer stations | strictly increasing, at least two | the type's contract | a reversed layer | swap two layers | exists (`stations`) | 1 |
| CUR-2 | C | layer spacing | spacing changes by at most a factor 2 between neighbours (trunk plan R4) | ratio <= 2 | a row of steps at landmark rows | insert a layer 1 mm from another | new | 1 |
| CUR-3 | C | girth between neighbouring stations | the girth changes by no more than the profile's own slope allows: no step at a layer | the jump across a layer at most the larger one-sided change over one station step times 2 | a crack across a part | scale one layer 10 percent | new | 1 |
| CUR-4 | C | centroid track | the centroid track is C1 across every layer (no kink) except declared joints | turn per step bounded as PRO-LG-9 | an offset layer | offset one layer | written (`test_human_curves_rings_centre`) | 1 |
| CUR-5 | C | area profile | the area profile follows the girth profile: no area step where the girth is smooth | `A` jump over a layer at most what the girth's own change implies, `dA = G dG / 2 pi` for a round section | a ring whose area jumps at constant girth | squash one ring | new | 2 |
| CUR-6 | C | winding | every ring winds counter-clockwise from outside (holes as declared) | existing | | | exists | 1 |
| CUR-7 | C | self-crossing | no ring crosses itself | existing | | | exists | 1 |
| CUR-8 | C | tangent across layers | G1 across every layer (and G2 where C2 is declared) | `test_human_layer_composition` continuity | | | exists | 1 |
| CUR-9 | C | extrema order | along each chain, the per-phase radius extrema of each guide stand in the anatomical order of section 3 | as PRO rows by guide | | | new | 2 |
| CUR-10 | C | ring at the chain's ends | the end ring of a child equals the parent's contact arcs it inherits (shared events) | G0 within 1 mm at every phase | an open join | offset the child's end | exists (`gap`) | 1 |
| CUR-11 | C | caps and poles | a cap closes to its pole with monotone falling girth and no flat apex | girth falls monotonically over the cap's last layers to the pole; the apex's curvature within the cap's own radius | a flat head top, a nipple-like pole | flatten the cap | new | 2 |
| CUR-12 | C | relief windows | every relief's height, slope and curvature vanish at its window's edge (J7) | edge values below 1e-9 relative | a relief that leaves a seam at its edge | cut a relief's window short | new (piece level for the relief itself) | 2 |
| CUR-13 | C | chain fingerprints | the same inputs give the same chains, bit for bit | equal | nondeterminism | | cut: no visible defect or published value; determinism is the lofting contract's | 3 |

### 4.8a Composed-curve rules by chain

Every delivered chain is read by the rules of its row, at every layer `chain/k` and every 2 mm between layers. Layer counts are f1's.

| Chain | Layers (station runs) | Girth profile | Per-phase radius (guides) | Centroid and apex tracks | Section | Neighbours read across |
| --- | --- | --- | --- | --- | --- | --- |
| `trunk` | 46 (horizontal, crotch ring up to the axilla) | PRO-TR-2 to PRO-TR-5, ORD-TR-1 to ORD-TR-3 | front, back and lateral guides' extrema order (CUR-9) | PRO-TR-6 to PRO-TR-8; centroid C1 (CUR-4) | SEC-1, SEC-3, SEC-4, SEC-5 | `upper` (SEAM-2), `leg.*` (SEAM-4, ORD-LG-5) |
| `upper` | 13 (horizontal, axilla to the neck's bottom ring) | PRO-TR-1 | trapezius and deltoid outline (PRO-SH-1, PRO-SH-2) | lateral outline | SEC-1, SEC-4 | `head` (SEAM-1), `trunk` (SEAM-2), `arm.*` (SEAM-3, ORD-AR-4) |
| `head` (neck) | 4 (horizontal, neck base to the jaw's seat) | PRO-NK-1, ORD-NK-1 | | PRO-NK-2 | SEC-1, SEC-2 | `upper` (SEAM-1), `head.lower` (SEAM-9, ORD-NK-3) |
| `head.lower` | 98 (horizontal, jaw's seat to the ear lobes' bottom) | | median and paramedian profiles (PRO-HD-1, HD-1, HD-2) | the median profile's sign runs | SEC-1, PRO-HD-2 | `head` (SEAM-9), `head.middle` (SEAM-10) |
| `head.middle` | 48 (horizontal, lobes to the helix roots) | | eye, nose and cheek guides (PRO-HD-2, XF-HD-1 to XF-HD-3) | | SEC-1 | `head.lower`, `head.upper`, the ears (SEAM-10, SEAM-12) |
| `head.upper` | 40 (horizontal, helix roots to the vertex) | PRO-HD-3 | vault convexity (HD-9) | | SEC-1, SEC-4 | `head.middle` (SEAM-10), the cap (CUR-11) |
| `ear.lobe.*`, `ear.helix.*`, `ear.rim.*`, `ear.pocket.*` | 10 to 38 (open shells and a hole) | | rim phase (existing `rim-slide`) | | existing `ear-crossing`, `ear-fold` | `head.middle` (SEAM-12), XF-HD-6, XF-HD-7 |
| `arm.*` | 26 (framed on the bone, shoulder root to the wrist) | PRO-AR-1 to PRO-AR-4, ORD-AR-1 to ORD-AR-3 | guide extrema order (CUR-9) | PRO-AR-5 | SEC-1, SEC-2, SEC-4, SEC-6 | `upper` (SEAM-3), `hand.*` (SEAM-6) |
| `hand.*.1` | 9 (framed, wrist crease to the knuckles) | ORD-HN-2 | | | SEC-1 | `arm.*` (SEAM-6), digits (SEAM-7) |
| `finger.*.index` to `little` | 11 to 15 (framed, root to the tip) | PRO-HN-1 | dorsal and palmar sectors | PRO-HN-2 | SEC-1, SEC-2 | the webs (SEAM-7), CUR-11 at the tip |
| `thumb.*` | 14 (framed) | PRO-HN-3 | | PRO-HN-2 | SEC-1, SEC-2 | SEAM-7 |
| `leg.*` | 33 (framed, ankle ring up to the crotch ring) | PRO-LG-1 to PRO-LG-6, ORD-LG-1 to ORD-LG-5 | PRO-LG-7, PRO-LG-8 | PRO-LG-9 | SEC-1, SEC-2, SEC-4, SEC-6 | `trunk` (SEAM-4), `foot.*` (SEAM-5) |
| `foot.*` | 38 (framed on the foot's fan, heel to the web ring) | breadth and height profiles on the skin (PRO-FT-1 to PRO-FT-5) | crest, borders and contact edges | | SEC-1, SEC-7 | `leg.*` (SEAM-5), toes (SEAM-8) |
| `toe.*.1` to `5` | 4 to 14 (framed) | PRO-FT-6 | | | SEC-1 | SEAM-8, ORD-FT-2, ORD-FT-3 |

### 4.9 Seams between chains and pieces (SEAM)

The composed body declares its seams as events (a parent's ring split into its children's arcs; `shared`, `web`, `fillet`), appendage strips and poles. Each row reads both sides across the seam in the plane normal to its tangent (`HumanSeamObserver`), against the continuity the seam declares.

| Id | L | Seam (owner, neighbour) | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEAM-1 | S | neck chain `head` bottom ring, `upper` top ring (neck owns) | the shoulders take the neck's ring with its width, slope and curvature | G2: gap under 1 mm, normal angle under 0.1 degree, normal curvature jump under the visible limit (`HumanSeamObserver` generated-skin limits) | the stepped collar at the neck's base (trunk plan R3) | offset the `upper` top layer 2 mm | new | 1 |
| SEAM-2 | S | `upper` bottom arcs, `trunk` top (upper owns) | the trunk continues the shoulders' ring | G1 at least, G2 where declared | a ridge round the torso at the axilla | offset a layer | exists in part (`gap`, `seam`) | 1 |
| SEAM-3 | S | `upper` arm arcs, `arm.*` root (upper owns) | each arm root continues its arc of the shoulder ring | G1 now (the trunk publishes no curvature yet), G2 when it does | a shoulder seam, an open armpit | offset the arm's first layer | exists in part | 1 |
| SEAM-4 | S | `trunk` bottom ring, `leg.*` top layer (trunk owns; `shared`) | each leg's top layer is its arc of the crotch ring | G0 at every phase within 1 mm, G1 across, G2 when the trunk's layer keeps its curvatures after the event join | a crack at the groin | offset the leg's top layer | exists in part | 1 |
| SEAM-5 | S | `foot.*` ankle ring, `leg.*` bottom layer (foot owns) | the leg takes the foot's ankle ring | G2 (leg plan) | a step at the ankle | offset the leg's bottom | written (`test_human_curves_seam_limbs`, every limb and digit event seam) | 1 |
| SEAM-6 | S | `arm.*` wrist layer, `hand.*` heel (hand owns the crease) | the hand takes the forearm's wrist | G2 (hand plan) | a cuff at the wrist | offset the hand's first layer | written (`test_human_curves_seam_limbs`, every limb and digit event seam) | 1 |
| SEAM-7 | S | `hand.*` knuckle line, `finger.*` and `thumb.*` roots through the webs (web owns) | each digit continues its web | G2 (hand plan) | a torn digit root | offset a finger root | exists in part (`join`, `tear`) | 1 |
| SEAM-8 | S | `foot.*` web ring, `toe.*` roots | each toe continues its web | G2 | a torn toe root | | exists in part | 1 |
| SEAM-9 | S | `head` top ring, `head.lower` bottom (head owns; neck seat) | the head's underside takes the neck's top ring | G1 now (no station curvature published), C2 above | a ring where the neck meets the jaw | offset the head.lower bottom | new | 1 |
| SEAM-10 | S | `head.lower` and `head.middle`, `head.middle` and `head.upper`, with the ear lobe and helix arcs | the three head chains and the ears join along their declared arcs | G0 within 1 mm | the open seams of the face | | exists (`test_human_layer_composition`) | 1 |
| SEAM-11 | S | relief windows on their base chains | every relief vanishes with its slope and curvature at its edge | C2 at the window's edge | a ring printed round a breast, a patella or a nose | cut a window short | new | 2 |
| SEAM-12 | S | appendage strips (the ears' roots) | the strip meets its appendage and its base G2 | `test_human_seam_ribbon` on the analytic strip; the same reading on the generated ears | an ear glued on with a crease | | new on generated skin | 2 |
| SEAM-13 | S | left and right chains | every right chain is the declared reflection of the left, rebuilt to its own inputs | existing `mirror` and the anatomy mirror rows | | | exists | 1 |
| SEAM-14 | S, C | size across every seam | the two sides' girths at the seam agree within the seam's gap tolerance times 2 pi | equal girths | a child narrower than its parent's arc at the join | shrink the child's end | written through the G0 rows of `test_human_trunk_seam`, `test_human_head_seam` and `test_human_curves_seam_limbs`: a gap within 1 mm at every phase bounds the girth difference by 2 pi mm, and a shrunk child end fails the gap | 1 |
| SEAM-15 | P | each region's declared piece seams (guides to sectors, span to span, piece to relief) | as declared in `seam-registry.md` | the declared continuity | a piece that invents its own join | | new | 1 |

### 4.10 Volumes and mass shares (VOL)

The person's mass is not an input, so a volume rule reads shares of the whole body's volume. A segment's volume share is its mass share times the body's density over the segment's density; Dempster 1955 measured segment densities from about 1.03 (trunk) to 1.16 g/cm^3 (hand), so shares of volume and of mass differ by up to 12 percent.

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VOL-1 | R | closed skin, segments cut at the joint planes | each segment's share of the body's volume lies in the band of the cited mass shares corrected by density | de Leva 1996 mass shares (head 6.68 / 6.94 percent, trunk 42.57 / 43.46, upper arm 2.55 / 2.71, forearm 1.38 / 1.62, hand 0.56 / 0.61, thigh 14.78 / 14.16, shank 4.81 / 4.33, foot 1.29 / 1.37), united with Dempster 1955 and Clauser 1969 (source notes needed), density factors from Dempster | a thigh with a shank's volume, a giant head | scale a segment 20 percent | new | 1 |
| VOL-2 | R | left and right segments | the two sides' volumes agree within what their own inputs explain | difference at most the rebuilt reflection's | a one-sided swelling | swell one forearm | cut: no source for the bound | 2 |
| VOL-3 | C | every limb segment | the segment's volume integrated from its sections is at least `q_min` times the girth profile's isoperimetric volume `integral G^2 / (4 pi) ds` (SEC-2's quotient; the upper bound holds for any closed sections and checks nothing) | `V >= q_min integral G^2 / (4 pi) ds` | a hollow, folded or flattened segment | flatten a segment | new | 2 |
| VOL-4 | R | volume under flexion | a flexed limb keeps its volume within 5 percent | existing pose rows | | | exists | 1 |
| VOL-5 | R | trunk subsegments | upper, middle and lower trunk shares (de Leva: 15.45, 14.65, 12.47 percent women; 15.96, 16.33, 11.17 men) at suprasternale, xiphion, omphalion and mid-hip planes | bands from the cited shares corrected by density | a trunk whose mass sits at the wrong level | swell the lower trunk | cut: density correction without a source note | 2 |

### 4.11 Symmetry and handedness (SYM)

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SYM-1 | C, R | every paired chain and region | the right side is the left's reflection rebuilt to the right side's own inputs | existing mirror rows (0.5 mm) | | | exists | 1 |
| SYM-2 | R | median chains (trunk, neck, head) | a median chain is symmetric about the median plane where its inputs are shared | the mirror image of each vertex within 0.5 mm of the skin | a twisted trunk or face | rotate a layer 2 degrees | exists (trunk, head mirror rows) | 1 |
| SYM-3 | R | paired inputs given unequal | a person whose left and right inputs differ shows the difference at the measured sites, by the input's amount, and nowhere else | each side's identity rows; the other side unchanged | inputs averaged across sides | give the left foot 5 mm more length | exists in part (foot, arm) | 1 |
| SYM-4 | R | posed mirror | a pose and its mirror place mirror bodies | existing `test_human_pose_mirror` | | | exists | 1 |
| SYM-5 | R | midline crossing | no limb crosses the median plane at rest | existing `midline` | | | exists | 1 |

### 4.12 Folds and creases (FLD)

A crease is a sagitta of more than CR across the feature, read in the plane normal to the feature. A person's adiposity is read from their own tapes: the waist-to-stature ratio, whose 0.5 boundary marks central adiposity in adults of both sexes (Ashwell 2012; Browning 2010; source notes needed), with the `fat` control's sign.

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FLD-1 | R | every meridian and transverse section of the skin | creases stand only at the named anatomical sites | no crease outside: the supratarsal eyelid crease, the nasolabial and mentolabial sulci, the philtrum, the alar crease, the ear's folds; the inframammary fold of a breast, the umbilicus, the gluteal sulcus, the inguinal crease, the natal cleft, the intergluteal and intermammary clefts; the distal wrist crease and the palmar and digital flexion creases; the axillary hollow | a stray crease anywhere: a ring printed across a limb, a fold on a lean belly | add a 2 mm groove across the thigh | new | 1 |
| FLD-2 | R | abdominal, back (bra line), lateral waist, submental sections | the adiposity folds are absent on a lean person | no crease at these sites when waist / stature < 0.5 and `fat` <= 0 | folds on a thin person (f1: waist / stature 0.397, `fat` -0.65) | add a 3 mm abdominal fold on f1 | new | 1 |
| FLD-3 | R | the gluteal sulcus | the buttock meets the thigh at a fold that every adult has, standing | a concave turn under the buttock, its sagitta within a band that grows with the hip girth's excess over the thigh (source needed for the band) | a buttock with no fold, or a fold carried round the thigh | erase the infragluteal relief | new | 2 |
| FLD-4 | R | the inframammary fold | a feminine breast meets the chest wall at a fold at the underbust level | the fold at the underbust site, depth bounded by the breast's projection (chest minus underbust over 2 pi) | a fold with no breast, a breast with no fold | flatten the breast | new | 2 |
| FLD-5 | R | fold depth at each site | a fold is never deeper than the overhang that makes it | crease sagitta at most the radial excess of the section above the fold over the section below | a fold cut into flat skin | deepen a fold relief | new | 1 |
| FLD-6 | R | facial creases | the face's sulci deepen with age and adiposity, not otherwise | depth at most a function of `fat` and the skin's `wrinkles` (source needed) | a lean young face with deep nasolabial folds | deepen the nasolabial relief | cut: no source for the depth law | 2 |
| FLD-8 | R | the limbs' and the foot's fold sites | a limb or foot crease stands only where anatomy has one, no deeper than the overhang that makes it | leg: the gluteal sulcus, the popliteal fossa, the anterior ankle crease, the groin; arm: the antecubital crease, the axillary hollow, the wrist creases; foot: the anterior ankle crease and the toe webs; hand: the finger-joint and palmar creases. A lean person (waist / stature < 0.5, `fat` <= 0) shows none elsewhere, and at a site at most FLD-5's overhang | a groove across a shank or forearm, a fold on a lean person's calf | cut a 2 mm groove across the shank | new (reads the sagitta of the section with `HumanAnatomyShared.curveCrease`) | 1 |
| FLD-7 | R | posed flexor sides | a flexed joint creases on its flexor side only (popliteal, antecubital, the palm's and fingers' flexion creases) | a crease under flexion on the flexor side; the extensor side stretched and smooth | a knee that folds in front | flex a knee on a copy whose binding is reversed | new | 2 |

### 4.13 Joint kinematics at neutral and at range ends (KIN)

Each row poses the person through the public pose evaluator and reads the rig's joint centres and the posed skin. Clinical directions follow AAOS; ranges follow `joint-range.md`.

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KIN-LG-1 | R | ankle centre under knee flexion | knee flexion carries the ankle behind the knee | (ankle - knee) . thigh's forward axis < 0 for flexion > 0 | a knee that bends forward | flip the knee axis on a copy | new | 1 |
| KIN-LG-2 | R | ankle under pure knee flexion | the shank swings in the thigh's sagittal plane | lateral deviation at most `sin(5 deg)` of the shank (transepicondylar axis obliquity; source note needed) | a knee that bends inward or outward | tilt the knee axis 20 degrees | new | 1 |
| KIN-LG-3 | R | knee at its extension end | the knee hyperextends no further than its range | posed angle at -1.3 degrees (Soucie 2011) at most | a recurvatum past the clamp | request -20 | exists in part (`test_human_engine_pose`) | 2 |
| KIN-LG-4 | R | hip, knee, ankle centres at neutral | the knee centre stands on or near the hip-ankle line | hip-knee-ankle angle from 4.1 degrees of valgus to 8.5 degrees of varus, Tang 2000's healthy young adults (2.2 degrees varus, SD 2.5 women and 2.7 men) plus and minus 2.326 SD (`tang-2000-lower-limb-alignment.md`) | knock-knees or bow legs at neutral | move each knee 50 mm medially | written | 1 |
| KIN-LG-5 | R | hip flexion | hip flexion carries the knee forward and up | knee . forward > 0 | | flip | new | 2 |
| KIN-LG-6 | R | ankle dorsiflexion | dorsiflexion raises the toes | toe tip y rises | a foot that plantarflexes for dorsiflexion | flip | new | 2 |
| KIN-AR-1 | R | wrist centre under elbow flexion | elbow flexion carries the wrist forward and up toward the shoulder | (wrist - elbow) . forward > 0 and the elbow angle closes | an elbow bending backward | flip the elbow axis | new | 1 |
| KIN-AR-2 | R | carrying angle at neutral | the extended, supinated forearm deviates laterally from the upper arm | carrying angle within the published adult band, larger in women (Kaewpornsawan 2018 note; adult band to be read) | an arm with a medial or no carrying angle | | new | 2 |
| KIN-AR-3 | R | shoulder abduction | abduction raises the elbow laterally | elbow . lateral > 0 | | | new | 2 |
| KIN-AR-4 | R | forearm pronation at neutral | thumbs forward at the zero of the forearm (DGUV F 4030 Neutral-0) | the thumb's MCP forward of the little finger's at neutral | palms forward or backward at zero | | new | 2 |
| KIN-HN-1 | R | finger flexion | each finger flexes toward the palm in its own plane; fingers converge toward the scaphoid when flexed together | tips move palmar; flexed fingertips converge (source note needed) | a finger bending backward or sideways | flip a PIP axis | new | 1 |
| KIN-HN-2 | R | thumb at neutral | the thumb lies beside the index metacarpal without passing through the palm | no crossing (`test_human_skin_integrity_posed`) | the thumb through the palm | | exists | 1 |
| KIN-SK-1 | R | contact at rest | the arms clear the trunk and the thighs clear each other at neutral, within the contact depth | existing pose rows (1 mm) | arms sunk into the trunk | | exists | 1 |
| KIN-SK-2 | R | contact at range ends | at a joint's flexion end soft tissue meets and compresses within 10 mm | existing | | | exists | 1 |
| KIN-SK-3 | R | skin strain | principal stretch under 2 everywhere in every pose | existing | | | exists | 1 |
| KIN-SK-4 | R | flexor and extensor skin | under flexion the flexor side shortens and the extensor side lengthens | mean principal stretch on the extensor side > 1 > the flexor side's | a binding that stretches the wrong side | swap the binding's sides on a copy | new | 2 |

### 4.14 Cross-feature facts (XF)

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| XF-HD-1 | R | eye globes against the orbit and lids | each globe sits in its orbit, behind the lid margins, its front within the lids' opening | globe front 0 to 4 mm behind the lid margins' plane, the globe's centre inside the orbit relief | eyes bulging out or sunk behind the skin | move a globe 5 mm forward | new | 1 |
| XF-HD-2 | R | pupils | the pupils stand level and at the fissures' middles | inner eye heights within H1 | a lazy eye | | new | 2 |
| XF-HD-3 | R | nostrils | the nostrils open downward under the nasal tip, between the alae, behind pronasale | openings' normals within 45 degrees of down, centres between al and al | nostrils opening forward | rotate the nose base | new | 1 |
| XF-HD-4 | R | mouth corners | cheilia lie within the face's width, under the pupils' columns or medial of them, above menton | ch-ch < the pupils' distance plus a band (source needed) | a mouth wider than the face | widen the mouth | new | 2 |
| XF-HD-5 | R | teeth and tongue | under the skin, unseen at rest | existing mouth rows | | | exists | 1 |
| XF-HD-6 | R | ear position | superaurale above the exocanthion's level less a band, subaurale above menton and below superaurale; the ear's long axis inclined backward; the tragion behind the zygion | order and bands (head observer's evidence: a convention, not a canon) | an ear on the cheek or the neck | move an ear 30 mm down | new | 1 |
| XF-HD-7 | R | ears against the vault | the auricle stands out of the scalp by its protrusion input, its root on the head's side | protrusion input; root within the T guide | an ear floating off the head | move the ear 10 mm out | exists in part (protrusion row) | 2 |
| XF-TR-1 | R | nipples and genitals | left out of the modelled skin (construction rule) | no relief at the nipple or genital sites | an unexpected relief | | cut: nothing is modelled there to test | 3 |
| XF-TR-2 | R | umbilicus | as LMK-11 | | | | new | 2 |
| XF-TR-3 | R | breasts | a feminine breast's apex lies at the chest point height, lateral of the midline by half the bust point width where the input is read | apex height at T2 within 9 mm | a breast at the wrong level | lift the breast relief | new | 2 |
| XF-TR-4 | R | scapulae and clavicles | the back's scapular guide and the clavicle lie at their published levels (inferior angle T8 on average, range T4 to T11, Cooperstein 2015) | inferior angle height within that range | scapulae at the waist | | cut: rank 3, no visible defect | 3 |
| XF-LG-1 | R | malleoli | the medial malleolus stands higher and further forward than the lateral (Gray 1918) | medial apex height > lateral; medial apex x > lateral | malleoli swapped | swap the malleolus reliefs | new | 2 |
| XF-LG-2 | R | patella | in extension the patella's apex stands at the level Gray 1918 gives against the knee joint line, the line read at tibiale (ANSUR II: mid-patella 11.2 and 20.2 mm above tibiale) | mid-patella above tibiale by ANSUR II's mean plus and minus 2.326 SD (the apex's own level is read from Gray 1918's text before it binds) | a patella below the joint | lower the patella relief 30 mm | new | 2 |
| XF-LG-3 | R | fibular head | slightly above the tibial tuberosity, lateral and behind (Gray 1918) | order | | | cut: rank 3, no visible defect | 3 |
| XF-AR-1 | R | olecranon and epicondyles | in extension the olecranon's tip is level with the epicondyles; the medial epicondyle the more prominent (Gray 1918) | heights within H1 of each other; medial reach > lateral | | | cut: rank 3, no visible defect | 3 |
| XF-AR-2 | R | radial head dimple | radiale's hollow lies distal of the lateral epicondyle, 6 to 20 mm from the elbow centre | de Leva 1996 13.9 / 14.3; existing course locator | an elbow without its dimple | | exists (course) | 2 |

### 4.15 Head and face (HD)

Head rules beyond the order, profile and cross-feature rows above.

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HD-1 | R | median profile landmarks | the profile's landmarks stand in vertical order v, g, n, prn, sn, ls, sto, li, sl, pg, gn, me | strict order beyond H1 | a lip above the nose base | swap two layers | now | 1 |
| HD-2 | R | forward order | pronasale is the face's most anterior median point; glabella ahead of nasion; pogonion ahead of sublabiale | x order | a chin ahead of the nose | push the chin | now | 1 |
| HD-3 | R | face thirds | g-sn and sn-me shares of g-me within the published band (Farkas 1994; the canon of equal thirds holds in a minority, so the band is wide) | band from Farkas means and SDs (source needed) | a face of the wrong thirds | stretch the lower face | new | 2 |
| HD-4 | R | eye level | the eye centres stand near mid head height | (v - eye) over (v - me) within the published band | eyes at the forehead | lift the eyes | new | 2 |
| HD-5 | R | intercanthal against fissure | en-en over en-ex within 0.598 to 1.341 | existing | | | exists | 1 |
| HD-6 | R | lid closure | the lids meet at the canthi and the lid margins never cross | margins' crossing count 0; canthi G0 | a split lid | | new | 2 |
| HD-7 | R | jaw line | the mandible's lower border runs from gonion to menton as one convex arch below the face | convex sign run, go below the ear, me the lowest | a jaw notch | dent the jaw | new | 2 |
| HD-8 | R | cervicomental angle | the throat meets the chin's underside at an angle within the published band (105 to 120 degrees in young adults; source note needed) | band | a double chin on a lean person, or no throat | | cut: no source note for the cervicomental band | 2 |
| HD-9 | R | vault | the vault is convex everywhere outside the temporal fossa | no concave run on vault sections | a dented skull | dent the vault | new | 1 |

### 4.16 Hair (HR)

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HR-1 | R | scalp boundary | the hairline runs closed round the scalp, trichion on the midline above glabella, the frontotemporal apex above the exocanthion, the sideburn at eye level, the nape below the occipital | ordered heights and azimuths | a hairline crossing the forehead or the ear | lower the trichion | new | 1 |
| HR-2 | R | coverage | the scalp inside the boundary is covered to the coverage law's share; no bare patch outside the parting and the whorl | coverage map share above the law's floor inside | the balding look | | new | 1 |
| HR-3 | R | guides | every guide starts on the scalp inside the boundary and stays outside the skin and the envelope | zero guide points inside the skin | hair through the head | | new | 1 |
| HR-4 | R | left and right | hair is the declared reflection except the parting and the whorl | mirror within the card width | a one-sided style by accident | | new | 2 |
| HR-5 | P | hair pieces (56 files) | each piece against its own definition | as each piece's definition | | | new | 1 |
| HR-EXT-1 | R | every scalp card vertex | no card vertex farther from the head skin's centroid than the head's farthest skin point plus the hair length input plus the card's root width | a strand is never farther from its root than its own length (a chord is no longer than its arc) | a hair sheet radiating from the head (the 01:43 f1 frame), a card launched off its root | a card vertex moved 1 m out | written (`test_human_curves_spike_hair`) | 1 |
| HR-EXT-2 | R | each card's root | the root lies on the scalp within the hair's layer clearance | the bound needs a published root clearance; the guide's own stacked layer is a construction value | a root floating off the scalp | | held (source owed) | 2 |
| HR-EXT-3 | R | head and ear skin, upstream of the hair | no head point farther from the head skin's centroid than the head's largest diameter by its inputs (head length or height) plus ear protrusion | the centroid lies inside the head | a flung head chain that the hair's roots then follow | a head vertex moved 500 mm out | written (`test_human_curves_spike_hair`) | 1 |

### 4.17 Placement, parts and surface integrity (existing rules)

Rules the existing tests read.

| Id | L | Read | Statement | State |
| --- | --- | --- | --- | --- |
| PLC-1 | C | part counts | a thumb and four fingers to a hand, five toes to a foot, an arm, a leg and an ear to each side, a trunk, neck and head | exists (`test_human_curve_placement`) |
| PLC-2 | C | crown and sole | the crown at stature and the sole on the floor within a day's change of stature | exists |
| PLC-3 | C | arms beside the trunk | no arm ring inside the trunk below the axilla | exists |
| GEO-1 | R | closed skin | one closed, outward, two-manifold skin, ending only at declared openings, crossing itself nowhere, at the bind and in every pose | exists (`test_human_skin_integrity`, `_posed`) |
| GEO-2 | C | curve soundness | finite, stations, winding, crossing, slope, slide, overshoot, crease, band, ridge, ripple, alias, ledge, base, jaw, facet, pit, rib, ball, dome, gap, seam, fold, midline, mirror, rim-slide, ear-fold, ear-crossing, thigh, tear, crumple, join | exists (`test_human_curve_*`) |
| GEO-3 | C | declared layers on the emitted skin | every principal layer's ring lies on the skin within 1 mm, with its declared continuity | exists (`test_human_layer_composition`) |

### 4.18 Population ends (POP)

| Id | L | Read | Statement | Expectation | State | Rk |
| --- | --- | --- | --- | --- | --- | --- |
| POP-1 | R | the test people's inputs | every input inside its domain and its sex's surveyed range, every relation inside its band, the ends reaching every coordinate's end | `test_human_people` | exists | 1 |
| POP-2 | R, C | every rule above | every rule holds on every person of the core set and, nightly, the extended set | the same rows | new for each new rule | 1 |
| POP-3 | R | one rule across the ends | a rule's reading moves monotonically with the input that drives it across the ends (a heavier person's waist girth exceeds a lighter one's of the same stature) | rank order of readings equals rank order of inputs | new | 2 |

### 4.19 Rules suggested by the reference photographs

Each rule was suggested by an observation of the reference renders of f1 (`screenshots-corrected`, front, side and per-part tiles) and is decided by anatomy and the person's inputs; the reference supplies the observation, the source supplies the expectation.

| Id | L | Observation | Read | Statement | Expectation | Catches | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OBS-LG-1 | R | front view: the outer calf curve peaks higher than the inner | frontal silhouette of each shank | the lateral contour's maximum stands above the medial contour's maximum | lateral maximum height > medial maximum height (Gray 1918: the medial gastrocnemius head extends lower; Bridgman 1920) | a calf bulging symmetrically or inverted | written (`test_human_curves_region_calf`) | 2 |
| OBS-LG-2 | R | front view: a teardrop bulge above the knee's inner side | frontal silhouette of each thigh's medial contour | the vastus medialis makes one medial bulge just above the knee | one medial local maximum within 0.03 to 0.15 of the femur above the knee centre (Gray 1918; window source needed) | a straight or notched inner knee | new | 3 |
| OBS-LG-3 | R, C | side view: the leg's back runs buttock, gluteal fold, thigh, popliteal hollow, calf, Achilles hollow, heel | posterior sagittal outline of each leg (guide P) | the posterior outline's curvature sign runs are convex, concave, convex, concave, convex, concave, convex, top to bottom | exactly those runs beyond the 1 mm crease floor | a missing gluteal fold or popliteal hollow, a calf bulging forward | new | 1 |
| OBS-LG-4 | R, C | side view: the shin runs nearly straight from the knee to the ankle | anterior sagittal outline (guide A) from the tibial tuberosity to the ankle | the shin's outline has no interior extremum and at most one inflection | as PRO-LG-8 on the outline | a bowed or bumped shin | new | 2 |
| OBS-TR-1 | R, C | side view: breast, inframammary hollow, abdomen, groin | anterior sagittal outline of the trunk | as PRO-TR-6 | | | written (`test_human_curves_profile_trunk`, as PRO-TR-6) | 1 |
| OBS-NK-1 | R | side view: the occiput stands behind the nape | the head's back against the neck's back | opisthocranion lies behind the neck's posterior outline at its least girth | op x < nape x - a margin of the scalp's thickness (5 mm; source needed) | a head flush with its neck at the back | new | 2 |
| OBS-NK-2 | R | side view: the neck leans forward from the shoulders to the head | the neck's axis | as PRO-NK-2 | | | new | 2 |
| OBS-AR-1 | R | side view at neutral: the elbow stands near the waist, the wrist near the crotch | posed neutral skin, joint centres | at the anatomical neutral the elbow centre stands within ANSUR II's elbow-height band and the wrist centre within the stylion-height band, both from stature | elbow 0.637 S (women) and 0.638 S (men), wrist 0.487 and 0.482 S, each plus and minus 2.326 SD (skeleton.md) | arms too long or short at rest, a shrugged or dropped shoulder | written (`test_human_curves_region_kinematics`) | 1 |
| OBS-AR-2 | R | front view: the hands hang beside the thighs, the fingertips at mid-thigh | posed neutral skin | the middle fingertip stands at stylion height less the hand length input | within H1 plus the wrist band's error | a hand hanging below the knee | new | 2 |
| OBS-HD-1 | R | side view: the ear's long axis leans backward | ear long axis against the vertical, in the sagittal plane | the axis inclines backward | within Farkas 1994's ear inclination band (source needed) | an upright or forward-leaning ear | new | 2 |
| OBS-HD-2 | R | side view: the vertex stands above the ear, behind the face | vertex position against tragion | the vertex lies above the tragion and behind the face | within a band behind the tragion's vertical (source needed) | a head peaked forward | cut: no source for the band | 3 |
| OBS-TR-2 | R | front view: the thighs meet below the crotch on a person whose thigh girth is large for the hip breadth | the gap between the thighs just below the crotch | the thighs touch when twice the thigh's half breadth exceeds the hip breadth less the crotch's width, and part otherwise | the contact predicted from the inputs | thighs passing through each other, or parted on a heavy person | new | 2 |

### 4.19a Visible defect classes (DEF)

Each class is a mathematical reading of a defect the viewer frames show; its test fails on a build that shows the defect and passes once the skin is sound. Tests live under `test/src/features/human/curves/defect/<class>/`.

| Class | Definition on the curves and the skin | Bound |
| --- | --- | --- |
| STEP | a sharp turn of a meridian outline across a ring, a layer or a seam: the sagitta over a 10 mm chord past the 12.5 mm radius' 1.04 mm | `HumanAnatomyShared.CREASE`, 1 mm |
| CRACK | a gap between a ring or a chain's end and its neighbour; an open boundary loop where anatomy has none; a non-manifold or inverted triangle | 1 mm (ISO 20685-1's least error); zero undeclared boundaries |
| DENT | a sharp concave turn, or an extra interior minimum of a profile anatomy makes convex or monotone | the crease bound; the profile shape rules (PRO) |
| RIB | alternating curvature sign runs along a ring or a profile, a ripple shading as stripes | more sign runs than the region's anatomy has (PRO, existing `rib`, `ripple`, `band`) |
| SPIKE | a vertex, card or piece detached from the surface it belongs to | distance from the body's skin beyond the part's own reach (a hair card beyond the hair length, a skin vertex beyond its neighbours' plane by more than the local edge length) |
| COLLAPSE | a loft flattened into a lens or shrunk to a point, a skin that does not span the rings it was lofted from, or vertices flung far off the body (which make a fit-to-bounds viewer draw every loft flat) | a ring's isoperimetric quotient `4 pi A / G^2` at least 0.3 (an ellipse of axis ratio 0.12; the palm, the flattest body section, reads above 0.6); each chain's skin extent per axis between half its rings' extent and that extent plus 0.1 S; every vertex within 0.6 S of the body's axis and 0.02 S of the floor and the crown |

| Id | L | Defect seen | Read | Test | Expectation | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| STEP-NK-1 | R | the neck base's flared disc and stepped collar (f1, f2, m1, m2) | lateral and posterior meridians through the neck's axis, 0.04 S below its base to 0.4 of the way to the head joint | `test_human_curves_step_neck_base` | no turn past the crease bound | written | 1 |
| STEP-SH-1, STEP-SH-2 | R | shoulder and arm-root steps | meridians round each humerus over the two thirds facing away from the trunk, from above the shoulder joint to a quarter of the humerus | `test_human_curves_step_shoulder` | no turn past the crease bound | written | 1 |
| DENT-HD-1 | R | the eye-to-ear groove, the vertical seam before the ear, the temple's cliff | vertical meridians behind the lateral canthus at the temples, 25 mm below to 45 mm above the eyes | `test_human_curves_dent_temple` | no turn past the crease bound | written | 1 |
| DENT-HD-2 | R | the forehead's plateau and step | frontal meridians 30 to 80 mm above the eyes | `test_human_curves_dent_forehead` | no turn past the crease bound | written | 1 |
| DENT-LG-1, DENT-LG-2 | R | calf and ankle dents | meridians round each tibia, 0.1 to 0.85 of the shank | `test_human_curves_dent_shank` | no turn past the crease bound | written | 1 |
| FLD-2-AB, FLD-2-BK | R | rolls on a lean trunk | a lean person's (waist over stature under 0.5, `fat` at or below zero) front flanks from 0.50 S to 0.62 S and back sides from 0.55 S to 0.72 S, the midline left out | `test_human_curves_fold_lean` | no turn past the crease bound | written | 1 |
| STEP-HD-1 | R | the blocky jaw and the step under the lower lip | the jaw's lateral meridians from gonion to the chin, the mentolabial sulcus left out | new | no turn past the crease bound outside the sulcus; the jaw's border one convex run (HD-7) | new | 1 |
| STEP-HD-2 | R | the eyelid's step line (m2) | meridians across the upper lid from the brow to the lid margin | new | one supratarsal crease at most, no second line; the lids' margins within the eye input's fissure | new | 1 |
| RIB-NK-1 | R | waves under the chin | anterior meridians through the neck's axis from 25 mm above its base to half the way to the head joint | `test_human_curves_rib_neck_front` | no turn past the crease bound | written | 1 |
| CRACK-HD-1 | S | head seam gaps | `test_human_layer_composition` seam readings of `head.lower`, `head.middle`, `head.upper` | exists | G0 within 1 mm | exists | 1 |
| RIB-FT-1 | C, R | foot ribs and the diagonal heel crease | the foot chain's longitudinal curves (existing `rib`) and the heel's vertical meridians on the skin, 5 to 40 mm above the floor, 120 to 240 degrees | `test_human_curves_rib_heel` | no turn past the crease bound on the heel's back and sides | written | 1 |
| RIB-FT-2 | R | web crumples, thin toe webs | the webs' meshed skin (existing `crumple`); a web's thickness at its crest at least the toes' skin depth | exists in part | no crumple; web thickness above the least skin depth (source needed) | new for thickness | 2 |
| SPIKE-HR-1 | R | stray hair cards arcing off the crown and the parting (f1, 23:20 frames) | every card vertex above the eyes' level, its stand-off from the head skin (radius from the head's centroid less the skin's outermost radius in the same 2 degree bin), for straight to wavy hair (curl I, II) | `test_human_curves_spike_hair` | at most 65 mm, the elastogravity length `(A / (lambda g))^(1/3)` of the stiffest fibre within 2.326 SD of the diameter (Goldstein 2012, `goldstein-2012-ponytail.md`): straight hair over the vault cannot hold itself farther off the scalp | written | 1 |
| SPIKE-HR-3 | R | stray cards by the jaw, ragged ends under the ears | card vertices below the eyes: none inside the skin; card ends within the cut level's band | new | no card vertex inside the skin; ends within the cut's band | new | 1 |
| COLLAPSE-1 | C, R | every loft collapsed flat in the 01:31 viewer bytes (the foot loft almost invisible, the head as four flat lenses) | every chain but the ears, at every layer and between layers, and every chain's bind skin | `test_human_skin_collapse` | the COLLAPSE bounds above; red on a zeroed layer, a layer stack flattened to 5 percent, a foot pressed flat and a vertex flung 1 km; first runs (f1): 01:40 bytes `head.lower` layer 51 of 98 reads 0.052; 01:46 bytes `head.lower` rings flung to 314 m (X), 943,608 skin vertices outside the standing box; every chain's rings are also read against the standing box, so a flung ring fails at the chain before any skin | written | 1 |
| STEP-LG-1, STEP-LG-2 | R | the ledge at the thigh root (owner, 02:05) | lateral meridians round each femur, 0.05 to 0.35 of the femur below the hip joint, the inguinal crease and gluteal sulcus left out | `test_human_curves_step_groin` | no turn past the crease bound | written | 1 |
| PLT-SH-1, PLT-SH-2 | R | flat wing plates projecting sideways above f2's shoulders (02:50 frames) | at the neutral, every vertex of one half body in 2 mm bins: the highest skin lateral of the shoulder point, and the frontal half width going up from the deltoid's widest level | `test_human_curves_plate_shoulder` | nothing lateral of the shoulder point above it, no widening above the deltoid, each within the crease bound | written | 1 |
| LUMP-BT-1 to LUMP-BT-4 | R | the lump behind f2's buttocks in the side view (02:50 frames) | posterior meridians through each hip joint, 0.04 S below to 0.08 S above (1, 2); the side view's rearmost outline of one half body over the same span (3, 4) | `test_human_curves_lump_buttock`, `test_human_curves_plate_shoulder` | no turn past the crease bound; one rearmost maximum, the outline only coming forward from it within the crease bound | written | 1 |
| DENT-TR-1 | R | the hip dents (owner, 02:05) | lateral vertical meridians from 0.50 S to 0.60 S | `test_human_curves_dent_hip` | no turn past the crease bound | written | 1 |
| SPIKE-HR-2 | R | black dots at the temples | no card root outside the scalp boundary | new | every root inside the boundary (HR-1) | new | 1 |
| DENT-HR-1 | R | bare skin patches and bands at the parting and temples | the coverage map inside the boundary | new | coverage above the law's floor everywhere inside but the parting's declared width (HR-2) | new | 1 |

### 4.20 Head, neck, trunk and shoulder pieces and seams (PC)

The head's piece rows read the skin piece built alone from its fixed inputs: `AutoMovieHumanHeadPass.prepare` on the person's neck chain and head inputs, then one `build` with no corrections, cut by `AutoMovieHumanHeadSkin.sides` at any station (`HumanHeadPiece`). The seam rows read the composed chains at the events the body declares (`HumanEventSeamRows`): at 48 parent phases per arc, the nearest point of the child's adjacent end ring, both meridians away from the seam and their normals. Every reading is a signed sagitta (`HumanSagitta`) or a gap and normal angle, in input millimetres and degrees. The proofs run on made shapes in memory: the head rows on an ellipsoid of f1's head length, breadth and height (green) and that ellipsoid with a defect of known size (red); the seam rows on a sphere cut at its equator (green) and its child pushed out 2 mm at the seam (red).

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PC-HD-1 | P | head skin piece, vertical profiles of the half width at five forward places from 8 mm before the otobasion superius to 8 mm behind the exocanthion, 15 mm under to 30 mm over its level | the temple's half width runs smooth with height | every sagitta over a 10 mm chord within CR either way: no named crease lies between the lateral orbit and the ear (FLD-1) | the eye-to-ear groove, a cliff of the half width within a few millimetres of height | the ellipsoid widened 6 percent over 3 mm of height at the exocanthion's level | implemented (`test_human_head_surface_temple`) | 1 |
| PC-HD-2 | P | head skin piece, horizontal outlines over the same span | the temple's horizontal outline has no corner | as PC-HD-1 | a vertical seam or ridge before the ear, a dent of the temple | as PC-HD-1 | implemented (`test_human_head_surface_temple`) | 1 |
| PC-HD-3 | P | head skin piece, median profile and paramedian profiles 20 and 35 mm out, glabella to 6 mm under the vertex | the forehead curves up to the vault convex both ways | most convex and most concave sagitta over 10 mm within CR (HD-9, FLD-1) | a forehead plateau's edges, a shelf, a ridge or dent across the frontal bone | the ellipsoid's front pushed out 2 mm between 15 and 25 mm over the glabella | implemented (`test_human_head_surface_forehead`) | 1 |
| PC-HD-4 | P | head skin piece, horizontal sections from 0.15 to 0.7 of menton to stomion, midline back to 10 mm before the otobasion inferius | the chin and jaw under the lower lip run round with no step | every sagitta over 10 mm within CR: the mentolabial sulcus crosses the vertical profile, not the horizontal section | the blocky jaw step under the lower lip | the ellipsoid stepped out 1.5 mm beyond 15 mm of half width | implemented (`test_human_head_surface_jaw`) | 1 |
| PC-HD-5 | P | head skin piece, median and 15 mm paramedian profiles from 3 mm over the neck ring round the chin's underside | the profile runs throat, cervicomental angle, chin | sign runs of the sagitta over a 15 mm chord beyond H1 within convex, concave, convex from the neck up (PRO-HD-1) | waves and collars under the chin | the ellipsoid's front waved 1.2 mm at a 20 mm wavelength below the menton | implemented (`test_human_head_surface_submental`) | 1 |
| PC-SEAM-1 | S | neck chain `head` bottom ring and `upper` (SEAM-1), `upper` and `trunk` (SEAM-2), `upper` and each `arm.*` root (SEAM-3) | the neck, shoulders, trunk and arm roots meet with no crack, kink or crease | gap within 1 mm, normals within 0.1 degree, meridian sagitta over 10 mm within CR, the arm seam's lowest quarter (the axillary hollow, FLD-1) out of the crease reading | the neck base's flared disc and stepped collar, the axilla ridge, the shoulder and arm root step | the made sphere's child pushed out 2 mm at the seam, fading over 3 mm | implemented (`test_human_trunk_seam`) | 1 |
| PC-SEAM-2 | S | neck chain `head` top ring and `head.lower` (SEAM-9), `head.middle` with `head.lower` and `head.upper` (SEAM-10) | the head meets the neck and its chains join with no crack, kink or crease | as PC-SEAM-1 | a ring where the neck meets the jaw, open or kinked joins about the ears | as PC-SEAM-1 | implemented (`test_human_head_seam`) | 1 |
| PC-MRG-1 | S | each additive head piece's own radial height over the base (jaw joint, nose, upper and lower lip), every 0.5 mm over a grid of height and half width placed from the layout's landmarks | the piece merges by adding volume only | least height not below zero; the rise beside the support's edge over one step at most step^2 / 25 mm, a bend of the crease limit's 12.5 mm radius (G1); nothing on the grid's border (the base outside the window unchanged). The orbit's socket, the alar crease, the philtrum and the oral groove are declared subtractive and not read | a piece that cuts into the face, a window cut short (a printed ring), a piece leaking over the face | a made 2 mm bump of 14 mm radius, dented, cut at 10 mm or skirted | implemented (`test_human_head_merge`) | 1 |
| PC-MRG-2 | S | every relief of the `trunk`, `upper` and neck chains, read as the chain copy carrying that relief alone against the copy carrying none, along the relief's axis, every millimetre of station and arc over its window and 10 percent round it | each relief adds or removes volume, never both, and merges G1 inside its window | as PC-MRG-1 on the height times the sign of the relief's largest control height | a breast whose blend dips under the chest wall, a ring round a breast or the deltoid's cap, a relief leaking past its window | as PC-MRG-1 | implemented (`test_human_trunk_merge`) | 1 |
| PC-HD-6 | P | lid margins and the skin about them, each eye | the upper lid meets the skin above it with no step | as PC-HD-1 on vertical profiles through the fissure, outside the supratarsal crease's window | the eyelid step | | new | 1 |
| PC-TR-0 | R | trunk and neck tapes at their ISO sites, read with every other tape by ORD-0 (`HumanCurveOrder`) | the skin keeps the order of the person's own trunk and neck tape inputs (chest over waist on f1: 851.6 over 666.3) | sign agreement wherever the inputs differ by more than the sum of the two tapes' ISO 20685-1 errors | a chest narrowed under its waist | f1's chest narrowed to 0.65 of its girth | implemented within ORD-0 (`test_human_curves_region_order`) | 1 |
| PC-TR-1 | P | trunk and shoulder pieces (guides, sectors, reliefs, tapes) built alone from their fixed inputs | each piece against its own declaration: its tape at its site, mirror, its declared seams through `AutoMovieHumanSeam.measure` | the piece's declared continuity and site | a piece that steps, cracks or misses its tape on its own | | new | 1 |
| PC-TR-2 | P | torso rings below the axilla vault (`AutoMovieHumanTrunkRing.controls`) at each guide's knot | every guide owns its point, unit tangent and curvature (J1) and both neighbouring sectors meet it G2 (J2, `AutoMovieHumanSeamKnot.assemble`); the right side is the left reflected, guides at 256 less the knot (J6) | G2 at every guide; mirror within rounding; no crease beyond CR on the ring | a sector that kinks or steps at its guide, a one-sided ring | | new | 1 |
| PC-TR-3 | P | shoulder rings from the vault to the shoulder point (`AutoMovieHumanShoulderRing.controls`), anterior and posterior guides of the arm root arc | the arc leaves the torso with its declared corner: G0 at the vault (the axillary folds' crease), the tangent's turn falling by smoothstep to zero at the glenohumeral centre's height, G1 there and above, G2 at every other guide | the turn at A and P equals the declared corner weight at each height within rounding; G2 elsewhere | a corner where none is declared, a corner left above the glenohumeral height | | new | 1 |
| PC-TR-4 | P | shoulder line (`AutoMovieHumanShoulderLine`) and cap (`AutoMovieHumanShoulderCap`) | the line leaves the neck seat with the neck ring's lateral width, slope and curvature (`AutoMovieHumanTrunkNeckSeat.lateral`); the cap takes the line's jet at the shoulder point and ends on the arm's straight outer edge at the glenohumeral height (slope -tan 33 degrees, curvature 0) | G2 at all three joins | the stepped collar at the neck seat, a shelf at the shoulder point | | new | 1 |
| PC-TR-5 | P | feature windows (`AutoMovieHumanTrunkReliefNet.fromFeature`): breast, gluteal, umbilicus, spinal furrow | each window is one-signed (breast and gluteal heights at least 0, umbilicus and furrow at most 0) and vanishes C2 at its edge (the net's three outer rings zero, J7); the breast window's lower edge at the inframammary fold, its top under the axilla | sign by kind; height, slope and curvature zero at the edge within rounding | a breast that dips under the chest wall, a ring round a window, a breast reaching into the axilla | | new | 1 |
| PC-TR-6 | P | tapes (`AutoMovieHumanTrunkTapes`) at their sites | each tape is the hull girth of its own section at its site, the breast and buttock windows inside the chest and hip hulls, solved to the input; the tapes stand in the inputs' order | each tape within its ISO 20685-1 error of its input; ORD-0 on the piece | a tape solved off its site, a chest under its waist | | new | 1 |
| PC-TR-7 | P | rows (`AutoMovieHumanTrunkRows.stations`) and the chains' shared layers (`AutoMovieHumanTrunkChains.build`) | stations rise strictly, every interval at most 5 mm, every landmark (buttock, iliocristale, omphalion, waist, fold, bust, glenohumeral height, shoulder point) a row unless within 0.4 of a spacing of another kept station; `trunk` and `upper` share the vault layer with identical coefficients, slopes and curvatures, and `upper`'s top layer is the neck's bottom layer copied | exact equality of the shared layers | a landmark missing its row, a seam layer that differs between its two chains | | new | 1 |
| PC-HD-7 | P | ear-root splice (`AutoMovieHumanHeadEarRoots.spliced`), horizontal outline in front of the root | the head runs into the ear's front root with no vertical seam | as PC-HD-2 | the vertical seam before the ear in the middle head | | new | 1 |

### 4.21 Merging by added volume (MRG)

Pieces merge into the figure by adding volume: a base envelope without the protrusion, each protruding piece attached by a smooth union that only grows the volume; a recess belongs to the base or to a declared subtractive piece. Read with the piece replaced by nothing (the base alone) and with it (the merged surface).

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MRG-1 | P | each additive piece's own height over its base, on a grid of its window | the height is never negative | `h(u, v) >= -0.01 mm` | a piece that dents its base | a piece whose height dips below zero | new | 1 |
| MRG-2 | P, S | the height at the window's edge | the height and its slope vanish at the edge (G1), the curvature too where C2 is declared | edge values below 1e-9 relative | a seam printed round a relief | cut the window short | new | 1 |
| MRG-3 | P | the support against the window | the piece's support lies inside its declared window, and the base outside it is unchanged | the base with the piece and without it agree outside the window to 1e-9 mm | a piece that moves the base's curves | a piece that scales its whole ring | new | 1 |
| MRG-4 | P | the blend's width against the piece's size | the union's blend width grows with the piece's own size | blend width over the piece's radius within the declared band | a blend that leaves a sharp ridge on a large piece or swallows a small one | halve a piece's blend width | new | 2 |
| MRG-5 | C, R | the composed chain or skin against the base envelope | each relief is one-signed: an additive piece (largest displacement outward) never lies inside the base envelope, a subtractive piece (largest displacement inward: the umbilicus, the spinal furrow, the jugular notch) never stands out of it | the displacement of the other sign within 0.01 mm, read along the base ring's outward normal inside the window; the same claim as PC-MRG-2 (`test_human_trunk_merge`) | a union that cuts into the body | a relief with every other height negated (both signs) | written (`test_human_curves_merge`) | 1 |
| MRG-6 | C | the composed chain's lofting curves outside every relief window | a protruding piece leaves the base's curves unchanged | the chain with its reliefs removed equals the chain with them outside the windows, to 1e-9 mm | a relief that reshapes its whole section | | new | 1 |

### 4.22 Arm, hand, leg and foot pieces and seams (PB)

The piece rows read each limb's construction pieces built alone from the person's public inputs in world millimetres, with no body generated, one build per person and side (`HumanFootPieces`, `HumanLegPieces`, `HumanArmPieces` under `test/src/features/internal/<foot|leg|arm>/`). A section is read in its own plane by `HumanLimbSectionShape`: the concave sagitta over a 10 mm chord and the turn per mm times the section's radius, the curve audit's rib scale. A union is read by `HumanLimbUnion`: the base built without the piece against the base with it, or the piece's own height over its window. Each test proves its observer first on made shapes in memory (`assertHumanProof`): a straight elliptic tube, a law made through the person's tapes at anatomy's sites, a made bump, each green, and the same with a defect of known size, red at the defect's site.

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PB-FT-1 | P | foot body sections (`AutoMovieHumanFootBody.section`) at 101 stations, each of the five pieces' share of the section | every piece but the medial arch is convex across; no piece turns sharper than the rib limit | concave sagitta over 10 mm within CR; turn per radius at most 250 degrees (`HumanCurveConstants.RIB`) | the diagonal heel-to-instep crease, a junction dent, a dorsal arc's outward kink, the lateral border's branch protrusion | a 2 mm groove across the tube's dorsal-lateral piece; a 1.5 mm spike in its lateral border | red on the build: 3,828 rows, every person (`test_human_foot_piece_section`) | 1 |
| PB-FT-2 | P | 64 phase tracks along the foot body every 1 mm of station, by piece and tenth of the stations | the body runs along its stations without ribs | turn per mm times radius at most the rib limit | rib-like bands, a guide kinked between knots, the lateral border's branch bump | a 0.5 mm ripple of 4 mm wavelength over 0.3 to 0.5 of the stations | red on the build: 368 rows (`test_human_foot_piece_ribs`) | 1 |
| PB-FT-3 | P | each toe span (`AutoMovieHumanFootToeSpan`): first own section, cap, half breadth | a toe's own tube is at least as long as it is broad | cap less first section at least twice the half breadth there (the tip's dome and the web's fillet each take a half breadth) | the little toe's self-crossing web, the crumpled webs of toes two to five | the hallux's cap one half breadth past its first section | red on the build: toe 5 on every person, -3.2 to -5.9 mm (`test_human_foot_piece_toes`) | 1 |
| PB-FT-4 | S | `foot.left` chain with the lateral and medial malleoli against the same chain without them (`AutoMovieHumanFootBodyChain`) | the malleoli add volume only (MRG-1 to MRG-4) | merged never inside the base (0.01 mm), base unchanged outside the windows (1e-6 mm), the edge's rise within 0.1 degree, steepest rise at most 45 degrees | a malleolus that dents the ankle, a window that leaks, a lump stuck on | heights negated; window declared at half its span; heights times 20 | red on the build: the edge rise 0.07 to 0.11 per mm on every person; the window proof fails, observer under repair (`test_human_foot_seam_malleoli`) | 1 |
| PB-LG-1 | P | leg girth law (`AutoMovieHumanLegGirth.of`) every 2 mm, crotch to ankle centre | section 3.1 on the law: tapes at sites, thigh `down`, shank `up` to one calf belly then `down` to the least ankle, shares and ratios | thigh within G9, knee and calf within G4; excess per span within G4; calf at 0.15 to 0.6, least ankle at 0.75 to 0.97 of the shank, least over calf 0.439 to 0.719; thigh over knee; calf against knee signed as the inputs | ankle and calf dents, a second calf belly, a tape off its site | an 8 mm ripple of 40 mm wavelength on a made law's shank | red: 16 rows; the calf and thigh span readers under repair, the thigh tape off its site on m-short-heavy (`test_human_leg_piece_girth`) | 1 |
| PB-LG-2 | P | leg joint centres (`AutoMovieHumanLegBones.of`) and crotch (`AutoMovieHumanLegCrotchHeight.of`) | hip over crotch over knee over ankle; the knee on the hip-ankle line at neutral (ORD-LG-6, KIN-LG-4) | every gap positive; hip-knee-ankle angle, varus positive, within 4.1 degrees valgus to 8.5 degrees varus (Tang 2000: 2.2 varus, SD 2.7, 2.326 SD) | a crotch under the knee, knock-knees or bow legs | the knee moved 50 mm medially | green on every person under the former 3 degree limit (`test_human_leg_piece_bones`); now read against Tang 2000 | 1 |
| PB-LG-3 | S | the fourteen leg relief windows (`AutoMovieHumanLegReliefs.of`) on a 41 by 40 grid | each relief adds volume only (MRG-1 to MRG-4) | outward height at the centre positive; edge zero within 1e-6 mm; rise across the edge within 0.1 degree; steepest at most 45 degrees | a hollow made by a protruding piece (the popliteal fossa, the infragluteal and inguinal folds until declared subtractive), a step at a window's edge, a lump too steep | f1's patella window with its axis reversed; with its height three radii | red on the build: popliteal fossa, infragluteal fold, inguinal crease and greater trochanter push inward (`test_human_leg_seam_reliefs`) | 1 |
| PB-AR-1 | P | arm girth law (`AutoMovieHumanArmGirth`) over the five spans (`AutoMovieHumanArmPieces.build`), every 2 mm, shoulder centre to 10 mm past stylion | section 3.2 on the law: tapes at sites, root and upper arm `down`, one forearm belly in the proximal half, `down` to the least girth at the wrist, ORD-0 on the four tapes | tapes within G4; excess per span within G4; belly share at most 0.5; least girth 30 mm proximal to 10 mm distal of stylion; every pair signed as its inputs where they differ by more than 2 G4 | a wrist step, a second belly, a mitten wrist, a tape order the inputs deny | a 6 mm ripple of 30 mm wavelength over a made law's forearm | green on every person (`test_human_arm_piece_girth`) | 1 |
| PB-HN-1 | S | the digit joint swelling (`AutoMovieHumanDigitJointRelief`) and the fingertip pulp (`AutoMovieHumanHandWindow.PULP`), heights over their windows | each adds volume only (MRG-1 to MRG-4) | least height not below zero; edge zero; rise across the edge within 0.1 degree; steepest at most 45 degrees | a joint ring cut into the finger, a pulp printed as a bead | a made 0.4 mm swelling negated; cut at half its window | green on every person (`test_human_hand_seam_reliefs`) | 1 |
| PB-HN-2 | S | finger chains' layer stations (`AutoMovieHumanDigitStations` through `AutoMovieHumanHandDigitChain`) | a digit keeps the reference's section density from its own length | layer spacing at most 2 mm, at most 1 mm within 4 mm of an interphalangeal joint | finger-joint steps from too few sections, the missing section density | a chain with every other layer removed | new | 1 |
| PB-AR-2 | S | the forearm's last row against the hand heel's crease jet (`AutoMovieHumanHandHeel.creaseJet`) | the wrist seam is G2 (SEAM-6) | the jets agree within `HumanSeamObserver.exact` | the arm-hand wrist step | the forearm's last row offset 1 mm | new | 1 |
| PB-FT-6 | P | foot body sections, the lateral border's and the sole contact's pieces near the web ring | readings of the first run that name a cause | the lateral border's concave sagitta 1.5 to 3.1 mm and a turn of up to 23 per radius from 0 to 0.13 of the stations (the branch protrusion and its kink); the sole contact concave by 1.4 to 2.1 mm from 0.04 to 0.17 (a transverse hollow under the forefoot, to be judged against the metatarsal arch); the medial arch's turn up to 6.9 per radius at 0.6 to 0.73 (a junction's curvature) | | | recorded from `test_human_foot_piece_section` | 1 |
| PB-FT-5 | S | the toes' webs (`AutoMovieHumanFootWebSeams`, `AutoMovieHumanSeamPatch`) | each web is one G2 patch over its owners' jets (SEAM-8) | the patch reproduces a quintic saddle; corners' gap and twist within `exact` | torn or crumpled toe webs | | new | 1 |

PB coverage by person and family (first run, the core set: f1, f2, m1, m2, f-small, f-large, m-small, m-large, f-tall-light, m-short-heavy; both sides where a side exists):

| Family | Rows | People read | Red on the build | Proven red |
| --- | --- | --- | --- | --- |
| foot piece sections (PB-FT-1) | 101 sections x 5 pieces x 2 sides | 10 | all 10, both sides | yes |
| foot piece ribs (PB-FT-2) | 50 bands x 2 sides | 10 | all 10 | yes |
| foot toe tubes (PB-FT-3) | 5 toes x 2 sides | 10 | toe 5 on all 10 | yes |
| foot malleolus union (PB-FT-4) | 4 x 2 sides | 10 | all 10 (edge rise) | inside and steepness yes; window no |
| leg girth law (PB-LG-1) | 11 | 10 | 5 (f-small, f-large, m-small, f-tall-light, m-short-heavy) | yes |
| leg bones (PB-LG-2) | 5 | 10 | none | yes |
| leg relief union (PB-LG-3) | 4 x up to 14 reliefs | 10 | all 10 | yes |
| arm girth law (PB-AR-1) | 9 plus the tape pairs | 10 | none | yes |
| digit piece union (PB-HN-1) | 8 | 10 | none | yes |

### 4.23 Construction levels (LVL)

The construction is built in levels ([construction levels](../techniques/construction-levels.md)): inputs and calibration, base envelopes, additive pieces, subtractive pieces, apertures, seams, skin, hair, rig and pose. A level reads only the levels below it, and a piece never reads a sibling of its own level. The rows read the source's import edges, so they need no generation.

| Id | L | Read | Statement | Expectation | Catches | Red proof | State | Rk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LVL-1 | P | every relative import of `packages/human/src`, each file levelled by its name (the document's "File names" column; shared types and loft mathematics level 0) | no file imports a higher level | zero upward edges, the head's declared Farkas feedback (`AutoMovieHumanHeadSolve`) allowed | a piece that evaluates the base's guides or the skin, a base cut with its pieces in mind | a made nose piece importing the body surface | written (`test_human_levels_isolation`); first run: 8 upward edges (the head landmarks reading the vault, the sectors and back profile reading `lofting/AutoMovieHumanSeam`, the skin landmarks reading the skin chart) | 1 |
| LVL-2 | P | the same edges between pieces of levels 3 to 5 | no additive, subtractive or aperture piece imports a sibling of its level | zero sideways edges | an additive piece reading another, a carve reading a carve | a made upper lip importing the lower lip | written (`test_human_levels_isolation`); first run: 3 sideways edges (the oral cavity and the mouth's deformation reading the mouth) | 1 |
| LVL-3 | P | files whose names carry no level mark | every source file carries its level in its name | counted and printed, not judged, until the naming covers the tree | a file whose level cannot be read | | cut: a record, not a check | 2 |

## 5a. Coverage ledger

States: read (an existing or new test reads the rule), written (a test is written and awaits its first run), blocked (a source note or a region's division is owed), open (no test yet). Counts are rules of section 4; the core set of ten people is the population of every row.

| Family | Rules | Read | Written | Blocked | Open |
| --- | --- | --- | --- | --- | --- |
| IR, PAR (input response, parameters) | 33 | 25 | 1 | 1 | 6 |
| ORD (order) | 31 | 5 | 14 | 2 | 10 |
| PRO (profiles) | 38 | 6 | 22 | 2 | 8 |
| LMK, SEG (landmarks, segments) | 24 | 5 | 6 | 4 | 9 |
| SEC, CUR (sections, composed curves) | 21 | 6 | 5 | 0 | 10 |
| SEAM (seams) | 15 | 6 | 3 | 1 | 5 |
| VOL, SYM (volumes, symmetry) | 10 | 5 | 1 | 2 | 2 |
| FLD, KIN (folds, kinematics) | 24 | 5 | 7 | 6 | 6 |
| XF, HD, HR (cross-feature, head, hair) | 33 | 3 | 3 | 6 | 21 |
| PLC, GEO, POP (placement, integrity, population) | 9 | 7 | 0 | 0 | 2 |
| OBS (from the reference photographs) | 12 | 0 | 4 | 3 | 5 |
| DEF (visible defect classes) | 21 | 1 | 15 | 0 | 5 |
| MRG (merging by added volume) | 6 | 0 | 1 | 4 | 1 |
| LVL (construction levels) | 3 | 0 | 2 | 1 | 0 |
| Total | 279 | 74 (27 %) | 83 (30 %) | 32 (11 %) | 90 (32 %) |

Cut, each with its reason in its row: 15 rules tied neither to a visible defect nor to a published value (CUR-13, ORD-LG-9, ORD-NK-2, HD-8, FLD-6, SEG-11, VOL-2, VOL-5, OBS-HD-2, XF-TR-1, XF-TR-4, XF-LG-3, XF-AR-1, IR-23, LVL-3); the counts above still hold them until the final ledger.

By chain (section 4.8a), the written composed-curve tests read every chain for spacing and girth steps and every limb, digit and neck chain for star-shaped rings (`test_human_curves_rings`), the `leg.*` and `arm.*` chains' girth profiles (`test_human_curves_profile_leg`, `_arm`), the `trunk` and `upper` chains' three outlines, the shoulder line and the natural waist's height (`test_human_curves_profile_trunk`), the `head.upper` vault (`test_human_curves_profile_head`), the digit chains' thickness order and the skeleton's joints, lengths and motions (`test_human_curves_region_digits`, `_segments`, `_kinematics`), every chain's reliefs against their base (`test_human_curves_merge`), and through the skin the neck's base, the shoulders, the temples, the forehead and the shanks (`test_human_curves_step_*`, `_dent_*`) and the order of every tape pair (`test_human_curves_region_order`).

## 5b. Test survey

Every Human test judged against this bar: a red row must name a visible defect, a published value, a declared contract or a universality property, and every check must have been made to fail once. Verdicts: keep, fix (the reason says what), erase. "Shared proof" means the red proof lives in the shared assertion the test calls (`assertHumanCurveKinks`, `assertHumanProvenRows`, `assertHumanProof`, `assertHumanAnatomy`).

| Test | Guards | Verdict | Reason |
| --- | --- | --- | --- |
| `test_human_universality` | universality, totality | fix, done | now fails on any `AutoMovieHuman.diagnose` entry as well as a throw, a flung ring or a broken rim; red proof of the gate's predicate on made records |
| `test_human_universality_sample` | universality over the domain | fix, done | the 200-person Latin hypercube (seed 20261104, 20 a batch, `AUTOMOVIE_HUMAN_SAMPLE`) reads the same diagnostics; red proof by a headless made person |
| `test_human_skin_collapse` | COLLAPSE-1 | keep | isoperimetric and span rules with their own made collapse |
| `test_human_trunk_seam`, `test_human_head_seam`, `test_human_curves_seam_limbs` | the registry's event seams | keep | gap, normal angle and crease sagitta at the declared class, every seam printed by `HumanEventSeamTable` including passes; shared proof (`HumanEventSeamProof`) |
| `test_human_trunk_merge`, `test_human_head_merge`, `test_human_curves_merge` | MRG, one-signed reliefs | keep | shared proof (`HumanMergeProof`, made reliefs) |
| `test_human_leg_seam_reliefs`, `test_human_hand_seam_reliefs`, `test_human_foot_seam_malleoli` | MRG at the limbs | keep; fix the leg's doc count | the leg carries thirteen windows since 02:43 (inguinal crease and trochanter left it, a quadriceps window came) |
| `test_human_curves_step_*`, `_dent_*`, `_rib_*`, `_fold_lean` | DEF, the crease bound | keep | one region each in `HumanCurveKinkRegions`, shared proof (a 3 mm Gaussian ring on f1) |
| `test_human_curves_lump_buttock` | LUMP-BT-1, LUMP-BT-2 | add, done | f2's lump behind the buttocks (02:50 frames): posterior meridians through each hip joint |
| `test_human_curves_plate_shoulder` | PLT-SH-1, PLT-SH-2, LUMP-BT-3, LUMP-BT-4 | add, done | f2's wing plates over the shoulders and the buttock lump read on the outlines, for a plate too broad for the chord rule; made plate and lump on f1 |
| `test_human_curves_spike_hair` | SPIKE-HR-1 | keep | made antenna card |
| `test_human_curves_rings`, `_rings_centre` | CUR spacing, steps, star shape, offset layers | keep | own made rows |
| `test_human_curves_profile_*` | PRO at the limbs, trunk, vault | keep | own made profiles; expectations from each person's tapes |
| `test_human_curves_region_*` | ORD, LMK, SEG, KIN, the bones inside | keep | own made readings; published bands (FAA 1965, de Leva, ANSUR) |
| `test_human_anatomy_ordering` | ORD, LMK | fixed | red proof: f1 with both wrists swollen 60 % must list more broken relations; its arm-segment band is a population relation (ANSUR II), distinct from `test_human_curves_region_segments`, which holds the joint-centre lengths to the inputs |
| `test_human_anatomy_course` | identity at the ISO sites | keep | inputs at their published sites |
| `test_human_anatomy_{arm,foot,hand,head,leg,trunk}` | identity, population, anatomy | fixed | the survey found no proof in `assertHumanAnatomy`; each region now must list more failing rows on f1 read against its inputs raised 15 % (`HumanAnatomyMade.inputs`) than on f1 itself |
| `test_human_anatomy_pose` | pose skin | fixed | the audit takes its posing as a parameter; f1 posed with the skin round its left elbow pushed 40 mm through itself must list more failing rows |
| `test_human_anatomy_head_consistency`, `_trunk_silhouette` | HD order, the waist's narrowing | fixed | made f1 with its lower face widened 60 % (breadths no longer nest) and with a 35 % bulge round its waist, each required to list more failing rows |
| `test_human_input_response_*` | IR, PAR | fixed | every perturbation is judged as if it had moved nothing and must come out not honoured (`HumanInputResponse.assert`); `glutealFurrowHeight` read at its site in the new `test_human_input_response_anatomy`; the move of every input read to `body.anatomy` is owed with the input's phase 4 |
| `test_human_input_anatomy_defaults` | defaults inside the survey band | keep | inputs only, the parameter researcher's |
| `test_human_curve_{arm,foot,hand,head,leg,placement,trunk}` | CUR integrity, placement | fixed in part | red proof added in `assertHumanCurves`: f1 with the part's middle layers swollen 30 % (placement: dropped 0.05 S) must list more findings; the limits "just above what reads smooth in the viewer" still owe a geometric basis |
| `test_human_layer_composition` | CRACK-HD-1, layers on the skin | keep | its analytic tube carries made dent, gap, kink, curvature step and offset proofs (the survey's first pass missed them) |
| `test_human_people` | POP, every test person valid | keep | own made people |
| `test_human_skin_integrity`, `_posed` | closed, outward, no self-crossing | keep | made controls |
| `test_human_skin_binding`, `test_human_engine_pose` | binding, engine pose | fixed | made proofs: f1's rig with every weight given whole to its heaviest bone (a hard cut at every hinge) must fail the hinge audit; an evaluator that ignores its pose must fail the range audit |
| `test_human_mouth` | mouth contracts | fixed in part | the containment reading is proven red (every interior point moved 0.13 S forward of the face must read outside); the rim's jaw shares and the viseme rows still owe made defects |
| `test_human_pose_mirror` | SYM | keep | made mirror defect |
| `test_human_seam_patch`, `_ribbon`, `_station` | the shared seam module's analytic contracts | keep | exact analytic oracles with made defects |
| `test_human_seam_section` | the shared section module | keep | red with exact numbers on turned tangents, moved curvatures and a wrong J2 inverse |
| `test_human_levels_isolation` | LVL | keep | made imports |
| `test_human_once` | the cache never hides a failure | keep | infrastructure contract every person cache relies on |
| `test_human_{arm,leg,foot}_piece_*` | pieces alone from fixed inputs | keep | own made pieces (`leg_piece_bones`: f1's knee moved 50 mm) |
| `test_human_head_surface_*` | the head piece alone | keep | shared proof (`HumanHeadSurfaceProof`) |
| `test_human_head_section_layers` | none | erased | one person's layers 30 to 50 by index, a construction internal; a flung ring is the universality gate's and `test_human_skin_collapse`'s |
| `test_human_reference_*`, `test_human_raw_reference_oracle` | observers sound on real bodies | keep | the removable reference layer (section 7); `raw_reference_oracle` carries made buffers; `reference_anatomy` is the observers' green proof on real bodies by design |

Added in the same batch: `test_human_curves_seam_webs` (WEB-1 the webs' columns keep their order and never close into a fold, WEB-2 each arrives on its digit's section within 0.01 mm, both webs of the registry) and `test_human_foot_piece_guides` (no guide of a foot turns back between neighbouring chords). Owed additions: one test per registry seam not yet read (the webs' tangent rows and crest angle, the wrist, the face-to-cranium sector, the apertures), the trunk rows (vault seam outside the arm arc, the arm root's fin, belly over the waist-to-buttock chord bounded by fat), and the response rows of every new anatomy input as its modeler wires it.

## 6. Sources the rules need

Read and recorded under `packages/human/docs/sources/` before the rule that cites them binds: Drillis and Contini 1966 (segment lengths over stature); Dempster 1955 and Clauser 1969 (segment masses and densities); Cavanagh and Rodgers 1987 (footprint arch index); Moreland 1987 (lower-limb alignment); Browning 2010 (waist-to-stature ratio; Ashwell 2012 is read at second hand in `ashwell-2012-waist-to-height.md`); Farkas 1994 (head and face norms and canons); AAOS 1965 and Kapandji (joint motion directions and axes); a cervical lordosis and shoulder slope source; the adult carrying angle by sex; the cervicomental angle; ANSUR II head circumference means.

## 7. The reference comparison layer

The comparison with the private MetaHuman references is its own layer, held in `test/src/features/human/reference/` and `test/src/features/internal/reference/` and described with its files in [Reference comparison layer](reference-layer.md). Each reference check stands in for a logic rule above: shape between sites (PRO, SEC), part presence and closure (PLC, GEO-1), spikes and detached parts (GEO-1, CUR-3), sunk parts (KIN-SK-1, LMK-5), input response (IR).
