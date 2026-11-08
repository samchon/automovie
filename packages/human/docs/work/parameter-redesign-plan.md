# Human parameter redesign plan

The owner ordered this plan on 2026-11-08 at about 13:35. It turns the Human parameter type into a metric, anatomical and scientific description. The formulas then come from reverse analysis of f1's authored absolute coordinates, adjusted afterwards because one person is only a sample, and are combined with the new type. The work belongs in the draft pull request that follows the f1 pull request.

## Why the current type fails

- **MetaHuman bodies are averages.** A MetaHuman body is a weighted average over thousands of scanned people. Its authoring controls are blend weights, not measurements:
  - `fat` −0.65, `masculineFeminine` 0.95, `muscularity` 0.10;
  - tape targets such as `chest` 800, which the mesh does not reach: f1 measures 856.8.
  A shape derived from these controls inherits the average's coupling, not one person's anatomy.
- **The current type mirrors those controls.**
  - `IAutoMovieHumanBodyAnatomy` is a flat list of 64 survey tapes: girths, lengths, breadths, depths and heights.
  - `IAutoMovieHumanBuildTraits` holds unitless sliders: `adiposity`, `muscularity`, `slimness`, `cuteness`.
  - The arm and leg identities repeat lengths and girths.
- **Tapes are redundant and still underdetermine the shape.**
  - A girth, a breadth and a depth at one site constrain each other.
  - Even together, they do not fix the section's shape, its quadrant fullness, or where the bone sits in the section.
  - Today the gaps are filled by population means and regressions, so the person disappears into the average.
- **The type has no frames.**
  - Nothing says where a part's zero is or how it is oriented.
  - The authored coordinates are drawn at each part's own zero and angles, so a tape list cannot be mapped onto them.

## Design principles

1. **Layers, from inside out.** Each layer is stated relative to the one below it.
   - **Skeleton:** segment lengths between joint centres, joint centres, segment frames by ISB conventions, and the rest angles of each joint.
   - **Soft tissue:** muscle thickness and subcutaneous fat thickness at named sites, per quadrant, in each segment's frame.
   - **Surface:** derived from the two layers above. Tapes become checks, not inputs.
2. **Every field is measurable.** Each field states:
   - its unit;
   - its landmark and frame;
   - its posture;
   - its standard: ISO 7250-1, ISO 8559-1, ISB, or a cited imaging protocol.
   No unitless slider is a primary field.
3. **No redundancy.** Each geometric quantity has exactly one input. A girth that the skeleton and tissue already fix becomes a derived check.
4. **Frames match the authored coordinates.** Every part has the zero and the axes its authored coordinates use, so every knot maps to fields of its own part and its parent's joint.
5. **Priors are a separate layer.** Population defaults, regressions and covariates live in a prior that fills missing fields. A prior is never part of a person's identity. The macro controls (adiposity, muscularity) become prior inputs that set tissue fields, not shape drivers.
6. **Validity is part of the type.**
   - Each field has a published range.
   - The anatomical order relations are enforced on every resolved person: wrist below forearm maximum, ankle below calf below knee below thigh, waist below hip and bust, ordered heights, one belly per muscle.

## Three tiers and converters

The full anatomical type will be much more complex than today's. It carries skeleton lengths and frames, per-site and per-quadrant tissue, rest angles, and validity relations. Few callers can fill it directly, so the type comes in three tiers. Every tier converts to the full one.

| Tier | Holds | Audience | Fields (order of size) |
| --- | --- | --- | --- |
| Full (`IAutoMovieHumanAnatomyFull`) | Skeleton: segment lengths, joint centres, frames, rest angles. Tissue: muscle and fat thickness per part, site and quadrant. Derived surface checks. | The generator. Scientific or measured input. | hundreds |
| Intermediate (`IAutoMovieHumanAnatomyStandard`) | Stature, sex and age. Main segment lengths. Major girths and breadths at standard sites (chest, waist, hip, thigh, calf, arm). A few build measures: body fat %, muscle mass index. Posture angles. | Tailoring, game and film character work. Close to MetaHuman's control set, kept simpler where possible. | ~30–50 |
| Simple (`IAutoMovieHumanAnatomySimple`) | Sex, age, stature, mass (or BMI), and a few build descriptors with defined meanings: fat, muscularity, body-shape class. | Quick authoring by people or an LLM. | ~5–8 |

The intermediate tier starts from today's type, curated rather than replaced:
- **Kept as the core:** the ISO 7250-1 / 8559-1 / ANSUR tapes at standard sites (stature, girths, segment lengths, landmark heights). These are measurable, well defined and familiar to tailoring and character work.
- **Removed from the core:** redundancy at a site (girth, breadth and depth together). The girth stays primary; the breadth and depth become optional overrides that pass straight to the full tier.
- **Moved to the full tier as optional fields:** the f1-specific calipers added during the f1 campaign (forearm and wrist breadth and depth, midpatella and calf heights).
- **Moved to the simple tier as defined descriptors:** the unitless sliders (`adiposity`, `muscularity`, `slimness`, `cuteness`). `cuteness` is dropped unless it gets a measurable definition.
- **Moved to pose and mobility:** the joint ranges in the arm and leg identities (flexion, extension, pronation and similar).
- **Merged:** the duplicated lengths and girths between the body anatomy and the arm and leg identities, so each quantity has one field.
- **Size:** the result is about 40–50 fields, with optional overrides beyond them.

Converters run toward the full tier only, and each step states its source:
- **Simple → intermediate:** sex-, age- and build-conditioned regressions and ratios from published surveys (ANSUR II, NHANES, Size Korea, and others). Every coefficient is cited, and every output stays inside its published range.
- **Intermediate → full:**
  - The skeleton comes from segment-length relations on stature and the given lengths.
  - The tissue thicknesses are solved so that the derived girths and breadths equal the given ones. Quadrant splits come from the formulas found in Phase 3 (the f1 coordinates) and calibrated in Phase 4.
  - The anatomical order relations are enforced throughout.
- **Composition:** simple → intermediate → full is the composition of the two converters. A caller may also supply any subset of full-tier fields over a lower tier, and those values win.
- **Round trip:** the full tier reports its derived intermediate measurements as checks. Converting a person down and back up must reproduce the given intermediate values within their ISO 20685-1 allowance.

The MetaHuman-like sliders (fat, muscularity, masculine–feminine) belong in the simple tier only, as defined descriptors that feed the regressions. They never drive shape directly.

## Phases

### Phase 0: f1 by authored coordinates (this pull request)

Each part's `F1Lines` module holds its hand-authored control points at its own zero and angles. The parameter laws are commented out and marked for algorithmization. The joints succeed, and the universal detectors read zero. Then the pull request is merged.

### Phase 1: knot inventory

For every knot in every `F1Lines` module, record:
- its part and frame;
- its semantic role: a landmark, an outline extremum, a datum slope, or a quadrant fullness;
- the anatomical quantity it embodies: a bone position, or a bone half-width plus muscle plus fat along a direction.

The output is one table per part.

### Phase 2: new schema

Define the new types from the inventory:
- `IAutoMovieHumanSkeleton`: segment lengths, joint centres and frames, rest angles.
- `IAutoMovieHumanTissue`: per part, per site, per quadrant, muscle thickness and fat thickness.
- `IAutoMovieHumanSurfaceChecks`: the tapes, as derived observations.

Each field carries a JSDoc definition and its standard. The old tape fields stay as an input adapter: given tapes, solve the tissue fields; given tissue, report the tapes.

### Phase 3: reverse analysis

Express each knot as a function of the new fields:
- in general, the knot position is the landmark or joint position plus a direction times the sum of bone half-width, muscle thickness and fat thickness;
- slopes and fullness are functions of neighbouring thicknesses.

Solve f1's field values from her knots. Record every coefficient as provisional: one person is a sample, not a law. Write the derivation of each formula in its comment.

### Phase 4: calibration

- Adjust the provisional coefficients with more samples: the other reference people (f2, m1, m2), each conquered by the same authored-coordinate method first, plus published tissue and skeleton ranges.
- Keep a coefficient only where the samples agree within the range. Otherwise record its covariate (sex, build, age), or keep it as a person field.
- Run the anatomical order and surface detectors on the population ends and the combined extremes.

### Phase 4b: tiers

Define the intermediate and simple tiers and write both converters, each with unit tests. A converter's output must pass every anatomical order detector at the population ends. A round trip must reproduce its intermediate inputs.

### Phase 5: migration

- Route `IAutoMovieHumanParameters.body` through the new layers.
- Turn the MetaHuman-like sliders into prior inputs.
- Delete the commented law blocks that the new formulas replace.
- Keep the viewer and capture operational throughout.

## Done means

- A person written only as skeleton plus tissue fields reproduces f1's authored knots.
- The same formulas produce other people with every detector at zero.
- No primary field is a slider, a plain population mean, or a redundant tape.
