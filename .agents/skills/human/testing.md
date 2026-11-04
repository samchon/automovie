# Testing

A Human test cross-checks the generated person against anatomy and its own inputs. A test that recomputes the construction's formulas passes whatever they are.

## What To Test

| Kind | Checks | Expectation from |
| --- | --- | --- |
| Identity | each public input measured on the skin at its site: tapes, lengths, breadths, head and face landmarks | the input, within the ISO 20685-1 tolerance for that measure |
| Population relations | relations between measures: depth over breadth, crotch height over stature, hand and foot breadth over length, shoulder over hip breadth, facial proportions and angles | published population ranges (ANSUR II, Farkas) |
| Anatomical facts | one belly per muscle group, the narrowest wrist at stylion, the bone inside its skin, closed lips at rest, mirror symmetry | anatomy texts |
| Consistency | contradictions between a part and its neighbours: girth order along a limb, the ankle thinner than the calf, a smooth profile with no wobble, joint centres between their flanking sections, sizes, coordinates, midpoints and volumes, creases only at anatomical sites with a depth bounded by the person's fat | anatomy, and each person's own inputs |
| Surface health | orientation, crossings, slopes, slide, overshoot, creases, curvature bands, ripples, open or kinked seams | what the surface is, anatomy, or what reads smooth in the viewer |
| Placement | every part present, crown at stature, sole on the floor, every limb outside the trunk | what any body must have |
| Pose | posed skin under the rig's binding: skin inside skin, principal stretch, folded triangles, volume change, in every supported pose and at each joint's range end | skin's failure strain, published joint ranges |
| Subsystem contracts | teeth and tongue under the skin, lips parting with the jaw, every consumer of a posed skin equal to what the shader draws | the subsystem's declared behavior and error |

## People

Run every test on whole people: the references, and people at the population ends of every length, breadth and sex, each internally consistent.

## Writing One

- Measure the generated output as an anthropometrist or a renderer would. Use construction internals only to locate an axis or a landmark.
- Read a border, fold or profile across the feature, in the plane normal to its own tangent; a world plane misreads a slanted feature.
- Test at four levels: each piece alone from fixed inputs, every declared seam against the continuity it declares, read across the seam, the completed curves, and the region relations, so a defect names its piece and seam.
- Test piece-level only for a part whose division is complete: every piece in its own file, a typed fixed-input interface, a standalone entry. Until then test the seams, the completed curves and the regions.
- Test the completed curves by cutting through them, not only along their lines: stations along an axis, up and down runs, the places and shares of extrema, such as the arch of a foot along its length.
- Express an expectation as a function of the person's own inputs, an intrinsic profile, never of a population or a reference; a lean person has no folds, and a crease is allowed only at an anatomical site with a depth bounded by the person's fat.
- Keep reference comparisons in their own removable files that no real test imports, and never tighten a real rule to match a reference.
- Build every person, derived view, reference mesh and fixture inside the test that needs it and cache nothing across tests, so nothing outlives its test. Put test files in folders by level and part, a folder tree of its own for each.
- Derive every expectation from an input or a cited published value, so the test holds for any person.
- Run every test on the CPU; the viewer serves inspection.
- Audit everything before failing, listing every finding by person, region and direction.
- Prove each check red on a made defect and green on a correct shape. A reading must move by a known change of its input.
- Give each limit its own anatomical or geometric basis, and keep it when the figure fails it.
- Compare with a reference body only to catch gross defects: limit by the range real bodies take at that site, never by a closeness that rewards matching the reference, because the construction is universal logic the references inform, and a universal curve may differ from them and read better. Where the references barely vary, take that range from published population variation, not from a measuring tolerance.
- Record a measure that cannot be an independent check, with the reason, instead of inventing a site for it.
- When the viewer shows a defect no test listed, add the test that lists it.
- When a test and the viewer disagree, suspect both: check the observer's site and limit against the definition and the references before trusting either, because a wrong test steers every change that passes it.

## Running

Run tests with `pnpm test --include <names...>`.

After a clean run, judge the look in the [inspection round](verification.md#inspection-round).
