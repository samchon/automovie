# Testing

A Human test cross-checks the generated person against anatomy, geometry and its own inputs. A test that recomputes the construction's formulas passes whatever they are.

## Levels

Test the geometry as 3D modeling's [Crafting](../3d-modeling/crafting.md#tests) describes. Test the mechanism once where it lives and the figure as a whole, so a defect of shared mathematics is found once and a part's change rewrites no test.

| Level | Reads | Expectation from |
| --- | --- | --- |
| Operator | each shared operator alone (lofting a part from its views, solid merge, solid diff, trims, the merged body, the realization of a whole construction tree) on made inputs, with no person generated | analytic oracles: closed forms, interpolation remainders and the operator's published contract |
| Audit | every section, declared seam and blend, chain surface and public input of every person, by one data-driven engine per class | geometry and the person's own inputs (below) |
| Anatomy | one table of relations the construction does not guarantee by itself, read on the finished curves, each row naming its source | published anatomy and population ranges |
| Pose and subsystems | the posed skin under the rig's binding, and each subsystem's declared behaviour | skin's failure strain, published joint ranges, the subsystem's declared error |

The audits read:

| Audit | Checks | Expectation from |
| --- | --- | --- |
| Sections | each section closed, simple, star-shaped about its axis, curvature continuous round the ring, touching its outline box at the guides where it was lofted from views; breadth, depth and girth fair along the stations | geometry; the declared box |
| Seams and blends | gap, normal angle and normal-curvature jump across every declared seam and every merge's two rails, read in the plane normal to the seam | the declared continuity, within bounds each test derives and states: a gap below the tessellation's chord error, a normal angle below the smallest crease shading shows, and a curvature jump that turns the normal by less than that angle over one vertex spacing |
| Surface health | steps, ripples, folds and the section centres' track over every chain | the crease bound (no turn tighter than the smallest radius smooth skin takes) and what any closed surface is |
| Placement | every part present, crown at stature, sole on the floor, every limb outside the trunk | what any body must have |
| Input identity | every public input measured on the finished skin at its published site, or the reason it is no skin reading | the input, within its ISO 20685-1 allowance |

Give an anatomy row only a relation the laws or their sources could get wrong, such as girth order along a limb, the narrowest wrist at stylion, one belly per muscle group, a monotone taper between landmarks, the bone inside its skin, mirror symmetry, or a population ratio. A value the construction sets by solving it belongs to input identity, and a property an operator guarantees to its operator test.

## People

Run every person-level test on whole people, each internally consistent: the references, people at the population ends of every length, breadth and sex, and every public input at both ends of its declared range and in combined extremes, declaring a range first where an input has none.

Derive every limit from the person's inputs, a published source or geometry, never from closeness to a reference body, because such a check rewards matching a few people and fails the population.

## Writing One

- Measure the generated output as an anthropometrist or a renderer would. Use construction internals only to locate an axis or a landmark.
- Read a border, fold or profile across the feature, in the plane normal to its own tangent; a world plane misreads a slanted feature.
- Cut the finished curves through, not only along their lines: stations along an axis, up and down runs, the places and shares of extrema.
- Express an expectation as the person's own intrinsic profile: a lean person has no folds, and a crease stands only at an anatomical site with a depth bounded by the person's fat.
- Prove each check red on a made defect and green on a correct shape, and take the made defect at a size the check's limit can see. A reading must move by a known change of its input.
- Give each limit its own anatomical or geometric basis, and widen the limit of a finite-difference reading by that difference's own truncation error. Keep the limit when the figure fails it.
- Audit everything before failing, listing every finding by person, part, region and direction.
- Build every person, derived view and fixture inside the test that needs it, so no test reads state another test left or changed. Put each test in the folder of its level.
- Record a measure that cannot be an independent check, with the reason, instead of inventing a site for it.
- When the viewer shows a defect no test listed, add the reading that lists it to the audit or table that owns its class.
- When a test and the viewer disagree, suspect both: check the observer's site and limit against the definition before trusting either, because a wrong test steers every change that passes it.

## Running

Run tests on the CPU, once the test type-check watch reads clean, with every test a question needs in one run as development's [Tests](../development/validation.md#tests) describes. They confirm each batch of fixes in the Human skill's [order](SKILL.md#order); the viewer serves inspection.
