# Testing

A Human test cross-checks the generated person against anatomy, geometry and its own inputs. A test that recomputes the construction's own formulas passes whatever they are.

Every Human test is a pure-logic unit test that finishes in under a second:

- It calls one law, solver or operator on small made inputs.
- It checks the result against an expectation derived independently: a closed form, a published definition or a geometric identity.
- Its expected values come from that derivation, never from a run's output, and it stubs nothing in the code under test.
- It builds no whole person, realizes no body and reads no reference body.

Whole-figure inspection belongs to the [shared instrument](screenshot.md); the properties below are tested as unit tests of the law or operator that guarantees them.

## Detectors

Anatomical order relations hold for any person, so they are the main universal detectors:

- girth order along each limb, with the wrist below the forearm maximum and the ankle minimum below the calf maximum, below the knee, below the thigh;
- the neck below the neck base, and the waist below the hip and the bust;
- ordered landmark heights and one maximum per muscle belly;
- a monotone taper between landmarks;
- the axis inside its section, and mirror symmetry.

Surface defect detectors find an error in any sculpted surface: open or non-manifold edges, flipped triangles, self-intersection, folds, crease radius, non-simple sections, seam and port continuity, slivers and curvature ripples. Each has a unit test that is red on a made defect and green on a correct shape, and the figure's build report runs every detector.

## Levels

Test the mechanism once where it lives, as 3D modeling's [Crafting](../3d-modeling/crafting/SKILL.md#tests) describes, so a defect of shared mathematics is found once and a part's change rewrites no test.

| Level | Reads | Expectation from |
| --- | --- | --- |
| Operator | each shared operator alone (composition, section, loft, ports, splits, continuations, merges, trims, atlas realization) on made inputs | closed forms and the operator's published contract |
| Audit | every section, seam, blend, chain surface and public input of every person, one data-driven engine per class | geometry and the person's own inputs |
| Anatomy | relations the construction does not guarantee, read on finished curves, each row naming its source | published anatomy and population ranges |
| Pose and subsystems | the posed skin under the rig's binding, and each subsystem's declared behaviour | the skin's failure strain, published joint ranges, the declared error |

The audits read sections (closed, simple, oriented, with their declared topology), seams and blends (position, normal and curvature agreement under the declared C2, G2 or crease contract), surface health (steps, ripples, folds), placement (every part present, crown at stature, soles on the floor, limbs outside the trunk), input identity (each public input measured at its published site within its ISO 20685-1 allowance), and parametric identity and binding.

Give an anatomy row only a relation the laws could get wrong. A value the construction solves for belongs to input identity, and a property an operator guarantees to its operator test.

## People

The active task sets person coverage; select f1 explicitly for an f1-only campaign and leave population acceptance unclaimed. A person-level audit uses whole, consistent people: the references, the population ends of each length, breadth and sex, and each input at both declared ends. Derive every limit from the person's inputs, a published source or geometry, never from closeness to a reference body.

## Writing One

- Read the stage under test through its public seams: original functions and jets for source ownership, chains for raw lofts, finished skin for anatomical and input measurements.
- Read a border, fold or profile across the feature, in the plane normal to its own tangent, because a world plane misreads a slanted feature.
- Prove each check red on a made defect and green on a correct shape, with the defect at a size the limit can see.
- Give each limit its own anatomical or geometric basis, widen a finite-difference reading by its truncation error, and keep the limit when the figure fails it.
- Audit everything before failing, listing every finding by person, part, region and direction.
- Build every person and fixture inside the test that needs it, and put each test in the folder of its level.
- When a still shows a defect no test lists, add the reading to the audit or table that owns its class. When a test and a still disagree, check the test's site and limit against the definition before trusting either.
- For a shared connection, check the original pieces and their maps before lofting, both production consumers, and topology and continuity on the domains that promise them. A name alias or a coincident sampled boundary is not shared ownership.

## Running

Run tests on the CPU once the test type-check watch reads clean, with every test a question needs in one run, as development's [Tests](../development/validation.md#tests) describes. They confirm each batch of fixes; the instrument serves inspection. Selecting a person changes the run's scope, not its expectations.
