# Testing

A Human test cross-checks the generated person against anatomy and against its own inputs. It never restates the construction's logic: a test that recomputes the construction's formula passes whatever the formula is, and says nothing about the person.

## What To Test

| Kind | Checks | Expectation comes from |
| --- | --- | --- |
| Identity | each public input measured on the skin at its site: tapes, lengths, breadths, head and face landmarks | the input, within the ISO 20685-1 tolerance for that kind of measure |
| Population relations | shape relations no single input fixes: depth over breadth, crotch height over stature, hand and foot breadth over length, shoulder over hip breadth, facial proportions and angles | published population ranges (ANSUR II, Farkas and the like) |
| Anatomical facts | one belly per muscle group, the narrowest wrist at stylion, the bone inside its own skin, closed lips at rest, mirror symmetry | anatomy texts |
| Surface health | orientation, crossings, slopes, slide, overshoot, creases, curvature bands, ripples, open or kinked seams, mirrored sides | what the surface is, anatomy, or what reads smooth in the viewer |
| Placement | every part present, crown at stature, sole on the floor, no limb inside the trunk | what any body must have |
| Pose | posed skin under the rig's own binding: skin inside skin, principal stretch, folded triangles, volume change, in every supported pose and at each joint's range end | skin's failure strain, the joint's published range |
| Subsystem contracts | e.g. teeth and tongue under the skin, lips parting with the jaw, every consumer of a posed skin equal to what the shader draws | the subsystem's declared behavior and error |

## People

Run every test on whole people across the supported domain, not only the references: people at the population ends of every length and breadth, and a masculine and a feminine extreme, each internally consistent. A typed parameter range spans more than any real person, so its ends make no person.

## Writing One

- Measure the generated output as an anthropometrist or a renderer would. Use construction internals only to locate an axis or a landmark, never as the answer.
- Take each expectation from a public input or a cited published value, and cite it in the test.
- Measure a feature in its own frame: read a border, fold or profile across the feature, in the plane normal to its own tangent, because a fixed world plane misreads it as soon as it slants.
- Name no coordinate, store no snapshot, and read no private reference or earlier output.
- Write no test that needs the Human viewer or a GPU; the viewer is for inspection.
- Audit everything before failing, and list every finding by person, region and direction, because stopping at the first failure turns one cause into a run per symptom.
- Prove each check red on a made defect and green on a correct shape. A reading proves itself only when a known change of its input moves it by that amount; a reading that stays constant whatever the input measures the wrong thing.
- Never loosen a limit to pass, and never take one from an earlier figure's worst value; such a limit needs its own basis or must go.
- Record a measure that cannot be an independent check, with the reason, instead of inventing a site for it.
- When a defect reaches the viewer that no test listed, add the test that would have listed it.

## Running

Run a test alone with `pnpm test --include <name>` and read its whole list. While iterating, run the same test functions with `ttsx` through the local `test/src/executable/human-score/runHumanTest.ts`, and use `pnpm test --include` before a commit. Fix the list by cause, then run it again.

A clean run says the person is not broken where the tests look, not that it looks human; that still takes the [inspection round](verification.md#inspection-round).
