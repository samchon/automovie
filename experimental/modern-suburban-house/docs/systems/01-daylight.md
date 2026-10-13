# Daylight

## Afternoon sun above the front left {#daylight-sun}
<!--
@evidence principles/core/common.md#scope-preservation Owns direction, color, intensity and shadow range of the upper-front-left key sun.
@evidence principles/core/common.md#substantive-completion Defines azimuth 45° between -X/+Z, elevation 32°, 4,500 K (1.00, 0.89, 0.76), intensity 3.0, castShadow true and shadow camera covering the entire fence interior.
@evidence principles/core/common.md#declared-basis Receives upper-front-left key/rear-right shadows from lighting-state and axes from coordinate-units, identifying angles, color and intensity as branch choices rather than geographic calculations.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds numerical azimuth/elevation, color temperature, intensity and shadow range beyond lighting-state's directional impression.
@evidence principles/design/systems.md#system-authority-confinement Writes only one sun record, receiving roof/eave geometry and site boundaries from spaces owners.
@evidence principles/design/systems.md#system-dependency-basis Derives direction from coordinate-units' +Z front/-X left and shadow range from fence-enclosure-plan.
@evidence principles/design/systems.md#system-verification-address Exterior frames falsify rear-right shadow direction and shade beneath porch roof/eaves.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work Compared lighting-state's key direction and coordinate-units' axes; +Z front/-X left consistently produces rear-right shadows, requiring no parent revision.
@evidence settings/20-verification.md#lighting-state Realizes upper-front-left key and rear-right shadows through one directional with azimuth 45°/elevation 32°.
@evidence settings/00-production.md#coordinate-units Expresses the sun-direction vector using +Z front/-X left/+Y up.
@evidence spaces/site/fence.md#fence-enclosure-plan Uses the fence-line interior as the shadow-camera range.
@evidence obligations/core/common.md#purpose-fit 01-daylight.md owns daylight realizing lighting-state's exterior key, sky fill and window daylight; without it, exterior shadow direction and fixed exposure would be undecided.
-->

Realize the upper-front-left key of [lighting and reference state](../settings/20-verification.md#lighting-state) as one directional light `light:daylight:sun`. Under the [coordinate convention](../settings/00-production.md#coordinate-units), front is +Z and left viewed from front is -X. Choose the sunward vector at azimuth 45° between -X/+Z and elevation 32°; light travels +X·-Y·-Z, placing shadows rear-right. Color is a late-afternoon warm white of approximately 4,500 K, linear RGB (1.00, 0.89, 0.76), and `intensity` is 3.0. These are branch choices as in settings, not geography/date calculations. `castShadow` is true; the shadow camera of installed `IAutoMovieLightShadow` covers the entire house, porch, driveway and terrace inside the [fence line](../spaces/site/fence.md#fence-enclosure-plan). Land beyond that range receives no shadows, and this limitation is recorded through visible exterior-frame results.

The source owner is `src/systems/lighting.ts`. Original exterior views confirmed shade at porch beams, columns and eaves and rear-right shadows. A separate native original with sun intensity 0 removed those shadows. [Lighting review set](00-lighting-frame.md#lighting-review-set) preserves the comparison's actual source/GPU provenance. Existing observations were compared for equivalence with current light-list/environment outputs, and readability was also confirmed in original whole-building views.

## Sky fill and fixed exposure {#daylight-sky-fill}
<!--
@evidence materials/03-furnishings.md#greige-cabinet Actual GPU output showed only outlines on vertical semimatte greige-cabinet faces below bright tops, leading both fills to rise to 0.80. The same global lighting makes face partitions readable without changing material #8A7F72/roughness 0.50.
@evidence principles/core/common.md#scope-preservation Owns sky-fill lights and fixed environment background, exposure, toneMapping and shadows values.
@evidence principles/core/common.md#substantive-completion Defines front/rear fill directions (-0.60, 1.00, 0.60)/(0.60, 1.00, -0.60), linear RGB (0.80, 0.88, 1.00), intensity 0.80 each, downward ground-bounce intensity 0.16, image null, exposure 1.0, acesFilmic and pcfSoft.
@evidence principles/core/common.md#declared-basis Receives sky-fill/fixed-exposure requirements from lighting-state and identifies hemisphere absence as a result of reading installed IAutoMovieSceneEnvironment.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds fill kind, directions, color/intensity and environment values beyond lighting-state's requirement to record fill and fixed exposure.
@evidence principles/design/systems.md#system-authority-confinement Writes only fill records/environment values, leaving surface response to materials.
@evidence principles/design/systems.md#system-dependency-basis Derives shadowless directional lights from the installed type's lack of hemisphere and the decision not to adopt external HDR.
@evidence principles/design/systems.md#system-verification-address Falsifying observations check that faces opposite the sun do not become completely black and that exterior/interior frames share environment values.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work Compared lighting-state's fill/fixed-exposure requirement with installed environment fields; installed capabilities can realize the requested result without parent revision.
@evidence settings/20-verification.md#lighting-state Prevents sky fill from closing deep shade and records fixed exposure/white balance through the same environment values in every view.
-->

Sky fill uses two directional lights that cast no shadows. `light:daylight:sky-fill` comes from above rear-right (0.60, 1.00, -0.60), and `light:daylight:sky-front-fill` from above front-left (-0.60, 1.00, 0.60). Each uses linear RGB (0.80, 0.88, 1.00) and `intensity` 0.80 to divide the same sky contribution. Both directions are used because a single fill makes opposite walls and enclosed porch shade disappear into black. Self GPU inspection on 2026-09-28 identified why lower-cabinet vertical faces were dark and readable only as outlines, prompting the two fills' horizontal contribution/intensity to rise to these values. The same values apply to every room/exterior without viewpoint brightness correction. Separate `light:daylight:ground-bounce` is a shadowless directional from below (-0.10, -1.00, 0.10), linear RGB (0.75, 0.72, 0.65), `intensity` 0.16. It is a defined approximation of ground-reflected daylight that reveals structure beneath porch/eaves. All four directionals apply equally to the entire house. Installed `IAutoMovieSceneEnvironment` has no hemisphere light, and no external HDR image is adopted, so `image` is null. Environment values are fixed to pale-sky `background`, `exposure` 1.0, `toneMapping` `acesFilmic`, `shadows.enabled` true and `type` `pcfSoft`, with every view using the same values. Exposure/white balance are the recorded values required by settings, without per-room correction.

The source owner is `src/systems/lighting.ts`. Siding/brick in porch shade and interior lower-cabinet vertical faces remain distinguishable with readable boundaries/handles instead of closing into black. Exterior/entry requests share environment values, and the material board's neutral/baseline states are each equivalent to current outputs. Differences in observation backgrounds reflect designated neutral model views versus house views rather than per-room exposure correction.

## Interior daylight through windows {#daylight-interior-reach}
<!--
@evidence materials/01-exterior.md#glass-clear Uses the same sun through original windows with transmitting clear glass. modelScene disables castShadow on transmitting faces so glass panes do not become opaque sun barriers.
@evidence materials/01-exterior.md#glass-obscure Obscured bathroom glass also transmits, without separate window-area lights. Glass obscurity/reflection remains with materials while interior reach of the same directional is observed.
@evidence principles/core/common.md#scope-preservation Owns how interior window daylight is realized and the prohibition on window lights.
@evidence principles/core/common.md#substantive-completion Defines interior daylight solely as sun/fill passing through envelope glass, without an area light at each window.
@evidence principles/core/common.md#declared-basis Receives the prohibition on arbitrary per-room brightness from lighting-state; prohibiting window lights is this branch's application of that rule.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds realization through the same sun, two sky fills and ground-bounce without window lights beyond lighting-state's requirement for readable window daylight.
@evidence principles/design/systems.md#system-authority-confinement Materials owns whether glass blocks shadows, and spaces 06-openings owns opening positions.
@evidence principles/design/systems.md#system-dependency-basis Interior daylight comes only from named sun/fill H2s and exterior-opening boundaries.
@evidence principles/design/systems.md#system-verification-address Separately compares front living-room window-bar sunlight patterns on wooden flooring and rear common-area window/floor readability. The former expectation that front sun produces the same direct-light pattern through rear windows contradicted direction and was withdrawn without adding rear window lights.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work Compared lighting-state's window-daylight requirement and 06-openings' rough-opening boundaries; openings can receive light without parent revision.
@evidence settings/20-verification.md#lighting-state Realizes window daylight through the same sun, two sky fills and ground-bounce without arbitrary per-room brightness.
@evidence spaces/06-openings.md#external-opening-interface Consumes envelope openings as passages for interior daylight.
-->

Interior daylight is the same sun/sky fill passing through glass in [envelope openings](../spaces/06-openings.md), without separate window lights. Materials decides whether glass surfaces block sun shadows. Adding an area light at every window to brighten rooms would be the same arbitrary per-room brightness prohibited by settings and is not used.

The source owner is `src/systems/lighting.ts`. In the original whole-building living-room view, direct-light patterns divided by window bars read on wooden flooring and the kitchen connection. Rear common-area views confirmed the exterior through glass doors/windows and readability of floor/cabinets, without claiming direct sunlight patterns below rear windows. The front-left sun does not shine from outside the rear wall inward, so the earlier observation expecting identical direct-light patterns at both windows contradicted direction. Rear sky fill and lit pendants consume the same fixed light records without separate window lights.
