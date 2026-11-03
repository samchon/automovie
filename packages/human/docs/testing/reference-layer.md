# Reference comparison layer

The reference comparison layer reads each generated reference person (f1, f2, m1, m2) against its private reference body from the reference source, and catches gross defects: a region too full or too thin by more than real people differ there, a bump, dent, hole, spike or floating part, and a section misplaced or folded at a named layer. The anatomical-logic tests carry the lasting coverage. This layer stands in for the parts of that coverage still to be written, and it is removed as one unit once they exist.

## Principles

- A reference is an observation of one real body, never a target. A universal construction may differ from it and read better.
- Every limit is the range real bodies take at that site: 2.576 standard deviations (the two-sided 99 % normal quantile) of the reference population there. Where the population barely varies (hands, digits, feet, the four fitted heads), the limit is floored by the published population variation of the nearest measured dimension (ANSUR II, ANSUR 1988, Weinberg 2016, Cho 2025), and never set below ISO 20685-1:2018 Table 4's 2 mm.
- A limit reads no generated position, so it cannot reward closeness to the reference.
- Every reader is proved inside its test, red on made defects of known size and green on the reference itself, before its readings blame a person.
- The reference data stays private and git-ignored under `test/.shots/<alias>/` and `.references/curves/<alias>/`. Without it, each test prints that it did not run and returns.
- Each loaded body, labelled skin, population body, limit set, layer basis and curve-pack file is built for each call, so nothing outlives the test that reads it.

## Folders and files

Everything in the layer lives in two folder trees. Its only edges into the rest of the test program go outward, to shared helpers such as `HumanAnatomy`, `HumanPeople`, `HumanLayerIndex` and `HumanRawGeometry`.

Tests, under `test/src/features/human/reference/`:

| File | Reads |
| --- | --- |
| `surface/test_human_reference_surface.ts` | the whole bind skin against the reference body both ways, as patches by region and direction |
| `surface/test_human_raw_reference_oracle.ts` | the raw two-mesh comparator's arithmetic on analytic planes |
| `layers/test_human_reference_layers.ts` | each loft layer's section of the generated skin against the reference cut in the same plane |
| `anatomy/test_human_reference_anatomy.ts` | every anatomy observer on the reference bodies, so a row a reference fails blames the observer |
| `anatomy/test_human_reference_thumb.ts` | the resting thumb of each reference from its own rig: the MCP and IP angles, and the metacarpal and proximal phalanx in the hand's frame |
| `isolation/test_human_reference_isolation.ts` | the layer's import boundary: every import edge from outside the two folders into them |

Internals, under `test/src/features/internal/reference/`:

| Folder | Files | Holds |
| --- | --- | --- |
| `bodies/` | `HumanReference`, `HumanReferenceFiles`, `HumanReferenceWeld`, `HumanReferenceSkin`, `HumanReferenceBodies`, `HumanReferenceRawOrder`, `HumanReferenceRig` | reading the reference bodies: the welded mesh, the skin labelled by the generated person's chains, the 66 population bodies, the welded-to-raw vertex order, and the source's own rig (bind frames of every joint, from `body-observations.json`) |
| `surface/` | `HumanReferenceSurface` and its pieces `Align`, `Compare`, `Extras`, `Flag`, `Floor`, `Grid`, `Limits`, `Mesh`, `Naming`, `Offsets`, `Pair`, `Patches`, `Population`, `Proofs`, `Regions`, `Search`, `Skin`, `Tree` | the two-way surface comparison, its population limits and its proofs |
| `layers/` | `HumanLayerBasis`, `HumanLayerCompare`, `HumanLayerFold`, `HumanLayerReport` | the section comparison by layer and phase |
| `curves/` | `HumanReferenceCurves` and `HumanReferenceCurve{Geometry,Quality,Pack,Store,File,Sections,Limbs}` | reading the private curve pack |
| `audit/` | `HumanReferenceAudit` | the raw two-mesh comparator |
| `anatomy/` | `HumanReferenceThumb` | the thumb's joint angles and bone directions read from a rig |
| `isolation/` | `HumanReferenceIsolation` | the import-boundary reader |

The layer also cites the source note `packages/human/docs/sources/horn-1987-absolute-orientation.md`, used only by the surface alignment, with its line in `packages/human/docs/sources/README.md`.

## Removing the layer

The layer is the two folders above, this note, and the Horn 1987 source note with its index line. Deleting them leaves the rest of the test program compiling, which `test_human_reference_isolation` holds while the layer exists. Each reference check stands in for logic coverage, which the anatomical-logic tests take over:

| Reference check | Logic coverage it stands in for |
| --- | --- |
| Signed surface offset by region against the population spread (limbs, trunk, head) | Shape between measured sites: section depth over breadth by level (ANSUR II waist, chest and buttock ratios), limb taper with one belly per muscle group, left-right symmetry |
| Region floors (hand and foot breadth, facial, mandibular and cranial width, ear protrusion, limb, neck, shoulder, chest, waist and buttock girths) | Site measurements on the skin against published population ranges |
| Missing patches (a hole, a missing fingertip, an open border) | Part presence and closure: every anatomical part present, no open boundary edge, one watertight skin per declared part |
| Extra and detached patches (a spike, a floating part) | Connectivity, and slope and curvature bounds that reject a spike thinner than the vertex spacing |
| Inside patches in hands, fingers and forearms | No part sunk into another; digit proportions over hand length and breadth; thumb placement; forearm taper |
| Section radius, girth, area, centroid and fold by layer and phase | Profile shape along each chain: extrema and inflections per span, girth order along a limb, fold sites bounded by the person's fat |
| Observers on the reference bodies | Each observer's site and limit checked against its published definition |
| Thumb flexion on the references | The resting thumb rule, from the fingers' shares of their joint ranges |
| Whole-person spread over the population at the parameter domain's ends | Input response: each public control moves the figure monotonically through the construction |

## Reference curve pack

`.references/curves/<alias>/` holds the reference meshes cut by horizontal planes (normal to +Y, every 10 mm and denser near critical events). Recovery fitted each closed loop or open arc as a piecewise cubic Hermite curve. The producer is `test/src/executable/reference-experiments/processReferenceExperiment.mts` (Recovery `observeAutoMovieRecovery` in the Hermite format), reading `test/.shots/<alias>/hermite-curves.json.gz`. For f1, `limbs/` adds sections normal to every limb, digit and toe bone.

A curve is `{ type: "cubicHermite", closed, unit: "mm", phaseIntervals, spans, fit, quality }`. Each span carries `start` and `end` (the knots, mm) and `startDerivative` and `endDerivative` (the tangents, mm per phase mm) over the phase width `h = phaseIntervals[i]`:

```text
p(t) = (2t^3 - 3t^2 + 1) start + (t^3 - 2t^2 + t) h startDerivative
     + (-2t^3 + 3t^2) end      + (t^3 - t^2) h endDerivative
```

Each section's plane is `y = coordinateMm`. `links.json` joins the closed loops of neighbouring sections into tubes. The reference names no chains, so a region's loops are labelled from geometry alone.

`HumanReferenceCurves` reads the pack. `index.json` runs to tens of megabytes, so its readers take only the region files a query overlaps, and each pack file is parsed for each call by `HumanReferenceCurveFile`.

### Counts by region

These are the pack's counts per region, observations of the references. A section is a horizontal cut the region spans, a curve is a fitted loop or arc in it, and the knots are the curves' span ends (a closed curve of n spans has n knots). The arm is the arm above the wrist cut. The head counts the skin only; the separate head shells (eyes, teeth, lashes) are not counted. Left and right differ by a few curves, and the left is listed.

| Region | f1 sections / curves / knots | f2 | m1 | m2 | Knots per curve |
| --- | --- | --- | --- | --- | --- |
| Head and neck | 2579 / 21213 / 231063 | 2667 / 22029 / 220137 | 2321 / 18114 / 228343 | 2346 / 16554 / 251461 | 10 to 15 |
| Trunk | 158 / 214 / 15393 | 151 / 196 / 15275 | 150 / 192 / 15065 | 171 / 227 / 18397 | 72 to 81 |
| Arm | 30 / 30 / 956 | 30 / 30 / 1075 | 33 / 33 / 1675 | 33 / 33 / 1644 | 30 to 51 |
| Hand and fingers | 56 / 135 / 1617 | 56 / 135 / 1675 | 52 / 127 / 2671 | 69 / 162 / 3072 | 12 to 22 |
| Leg | 72 / 72 / 4134 | 69 / 69 / 3878 | 77 / 77 / 4872 | 77 / 77 / 4888 | 56 to 64 |
| Foot and toes | 81 / 293 / 8346 | 78 / 185 / 7513 | 85 / 317 / 9706 | 84 / 219 / 8470 | 28 to 41 |

The construction's own counts of sections and knots per region reach at least these, as the construction rules require.
