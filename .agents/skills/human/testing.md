# Testing

A Human test cross-checks the generated person against anatomy and its own inputs. A test that recomputes the construction's formulas passes whatever they are.

## What To Test

| Kind | Checks | Expectation from |
| --- | --- | --- |
| Identity | each public input measured on the skin at its site: tapes, lengths, breadths, head and face landmarks | the input, within the ISO 20685-1 tolerance for that measure |
| Population relations | relations no single input fixes: depth over breadth, crotch height over stature, hand and foot breadth over length, shoulder over hip breadth, facial proportions and angles | published population ranges (ANSUR II, Farkas) |
| Anatomical facts | one belly per muscle group, the narrowest wrist at stylion, the bone inside its skin, closed lips at rest, mirror symmetry | anatomy texts |
| Surface health | orientation, crossings, slopes, slide, overshoot, creases, curvature bands, ripples, open or kinked seams | what the surface is, anatomy, or what reads smooth in the viewer |
| Placement | every part present, crown at stature, sole on the floor, no limb inside the trunk | what any body must have |
| Pose | posed skin under the rig's binding: skin inside skin, principal stretch, folded triangles, volume change, in every supported pose and at each joint's range end | skin's failure strain, published joint ranges |
| Subsystem contracts | teeth and tongue under the skin, lips parting with the jaw, every consumer of a posed skin equal to what the shader draws | the subsystem's declared behavior and error |

## People

Run every test on whole people: the references, and people at the population ends of every length, breadth and sex, each internally consistent. The ends of a typed parameter range make no real person.

## Writing One

- Measure the generated output as an anthropometrist or a renderer would. Use construction internals only to locate an axis or a landmark, never as the answer.
- Cite the input or published value behind each expectation.
- Read a border, fold or profile across the feature, in the plane normal to its own tangent; a world plane misreads a slanted feature.
- Name no coordinate, store no snapshot, and read no private reference or earlier output.
- Write no test that needs the Human viewer or a GPU.
- Audit everything before failing, listing every finding by person, region and direction.
- Prove each check red on a made defect and green on a correct shape. A reading must move by a known change of its input.
- Give each limit its own basis; never loosen one to pass or copy an earlier figure's worst value.
- Record a measure that cannot be an independent check, with the reason, instead of inventing a site for it.
- When the viewer shows a defect no test listed, add the test that lists it.

## Running

Run a test alone with `pnpm test --include <name>` and read its whole list. While iterating, run the same test functions with `ttsx` through the local `test/src/executable/human-score/runHumanTest.ts`.

A clean run does not show the person looks human; that takes the [inspection round](verification.md#inspection-round).
