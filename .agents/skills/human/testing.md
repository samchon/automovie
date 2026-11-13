# Testing

A Human test cross-checks the generated person against anatomy, geometry and its own inputs. A test that recomputes the construction's formulas passes whatever they are.

Every Human test is a pure-logic unit test that finishes in under one second.
- It calls one law, solver or operator on small made inputs.
- It checks the result against an expectation derived independently: a closed form, a published definition, or a geometric identity.
- It contains no hardcoded expected values copied from a run's output, and no monkey-patching or stubbing of the code under test.
- It does not build a whole person, loft or realize a body, or produce skin end to end.
- It reads no reference body: no registered reference mesh, no reference comparison, and no expectation taken from a reference.

Anatomical order relations are the main universal detectors, because they hold for any person:
- girth order along each limb: wrist below forearm maximum, ankle minimum below calf maximum below knee below thigh;
- neck below neck base, and waist below hip and bust;
- ordered landmark heights;
- one maximum per muscle belly;
- a monotone taper between landmarks;
- the axis inside its section;
- mirror symmetry.

Universal defect detectors are kept and completed. These find an error in any sculpted surface whatever its parameters: open or non-manifold edges, flipped triangles, self-intersection, folds, crease radius, non-simple sections, seam and port continuity, slivers, and curvature ripples. Each detector has a unit test that is red on a made defect and green on a correct shape. The figure's build report runs every detector on each render.

Whole-figure inspection belongs to the [shared instrument](screenshot.md), not to tests. The levels and audits below apply only in that form: as unit tests of the law or operator that guarantees each property.

## Levels

Test the geometry as 3D modeling's [Crafting](../3d-modeling/crafting.md#tests) describes. Test the mechanism once where it lives and the figure as a whole, so a defect of shared mathematics is found once and a part's change rewrites no test.

| Level | Reads | Expectation from |
| --- | --- | --- |
| Operator | each used shared operator alone, including original 2D composition, section/loft/sweep, known-port bands, continuations, retained volume operations, trims and atlas realization, on made inputs with no person generated | analytic oracles: closed forms, interpolation remainders and the operator's published contract |
| Audit | every section, declared seam and blend, chain surface and public input of every person, by one data-driven engine per class | geometry and the person's own inputs (below) |
| Anatomy | one table of relations the construction does not guarantee by itself, read on the finished curves, each row naming its source | published anatomy and population ranges |
| Pose and subsystems | the posed skin under the rig's binding, and each subsystem's declared behaviour | skin's failure strain, published joint ranges, the subsystem's declared error |

The audits read:

| Audit | Checks | Expectation from |
| --- | --- | --- |
| Sections | every actual loop of a declared closed section remains closed, simple and correctly oriented, with the promised guides/extrema/fullness and hole/branch topology; explicit open pieces, contact sheets and port boundaries retain their declared endpoints, connections and sheet/topology contract; require star-shapedness only of a primitive that declares it; breadth, depth and girth fair on their actual domains | geometry and the declared source domain; an open piece is not closed to satisfy a closed-loop check, and closed-loop health is not weakened |
| Seams and blends | position, normal and normal-curvature agreement at every declared port, continuation, seam and band rail, in the seam's own frame; preserve explicit creases | the declared C2/G2 or crease contract and independently derived physical/numerical bounds; a tessellation chord budget is not a source-continuity allowance |
| Surface health | steps, ripples, folds, section-centre tracks and actual chart transitions over every source/atlas region | the crease bound (no turn tighter than the smallest radius smooth skin takes), declared creases and the actual surface topology |
| Placement | every part present, crown at stature, sole on the floor, every limb outside the trunk | what any body must have |
| Input identity | every public input measured on the finished skin at its published site, or the reason it is no skin reading | the input, within its ISO 20685-1 allowance |
| Parametric identity and binding | logical region to source-subdomain/chart maps, shared boundary bindings, material coordinates, joint datums and rest/inverse-bind invalidation through the actual neutral/bind consumers | independently specified edits, source dependencies and declared physical-point identity; a surface split does not create a new bone |

Give an anatomy row only a relation the laws or their sources could get wrong, such as girth order along a limb, the narrowest wrist at stylion, one belly per muscle group, a monotone taper between landmarks, the bone inside its skin, mirror symmetry, or a population ratio. A value the construction sets by solving it belongs to input identity, and a property an operator guarantees to its operator test.

## People

The active task sets person coverage. Select f1 explicitly for an f1-only campaign and leave broader population acceptance unclaimed. A general person-level audit uses whole, internally consistent people: the references, population ends of each length, breadth and sex, and each public input at both declared ends and in combined extremes. Declare a range first where an input has none.

Match construction work to the question. An original-source or operator question reads its actual producer without requiring unrelated regional sources, raw lofts, full calibration or final skin. Raw-loft and final-skin questions request those actual consumers separately. A selected source result is not a whole-person result.

Derive every limit from the person's inputs, a published source or geometry, never from closeness to a reference body, because such a check rewards matching a few people and fails the population.

## Writing One

- Read the stage being tested through its actual public seams: original functions and qualified jets for source ownership, actual chains for raw lofts, and finished skin for final anatomical/input measurements. Use construction internals to locate an axis or landmark for a finished-skin measurement, rather than substituting the source's assigned value for that measurement.
- Read a border, fold or profile across the feature, in the plane normal to its own tangent; a world plane misreads a slanted feature.
- Cut the finished curves through, not only along their lines: stations along an axis, up and down runs, the places and shares of extrema.
- Express an expectation as the person's own intrinsic profile: a lean person has no folds, and a crease stands only at an anatomical site with a depth bounded by the person's fat.
- Prove each check red on a made defect and green on a correct shape, and take the made defect at a size the check's limit can see. A reading must move by a known change of its input.
- Give each limit its own anatomical or geometric basis, and widen the limit of a finite-difference reading by that difference's own truncation error. Keep the limit when the figure fails it.
- Audit everything before failing, listing every finding by person, part, region and direction.
- Build every person, derived view and fixture inside the test that needs it, so no test reads state another test left or changed. Put each test in the folder of its level.
- Record a measure that cannot be an independent check, with the reason, instead of inventing a site for it.
- When a still shows a defect no test listed, add the reading that lists it to the audit or table that owns its class.
- When a test and a still disagree, suspect both: check the observer's site and limit against the definition before trusting either, because a wrong test steers every change that passes it.
- For a shared connection, distinguish equal centres/four supports with unequal interiors, wrong units or directions, unavailable versus zero jets, stale source bindings, unequal densities and the relevant end/footprint domains. Exercise both actual production consumers and the promised unchanged source intervals; an isolated operator pass does not wire Human. State the limits of finite phase observations.
- For composed sources and known ports, check the original pieces and their maps before lofting, the actual logical subdomains and material charts afterward, and topology/continuity on the domains that promise them. A name alias or coincident sampled boundary is not shared binding ownership. Let genuinely coupled constraints propagate and test the declared unaffected domains separately.

## Preparation Measurements

Time source/control-record creation, scalar preparation/interpolation, constraint inversion and parent contact, native/frame evaluation, raw lofting, display materialization and final realization separately. Start the original-source interval before its first demand and include every deferred solve needed to complete that demand. Report compilation/import startup and the actual visible consumer's end-to-end interval separately. Creating a lazy record alone does not measure completed source geometry.

Record first and retained reads within one invocation, with the source/input identity, actual requested work and concurrent load. Retained reads are not independent cold builds. Inclusive CPU stacks overlap; use disjoint elapsed intervals for totals and comparable stages for a claimed saving. Reuse only an invariant source/trial state, retain failed solves as failures, and include the first evaluation cost of any moved work.

Count independent authored control families, generated streams, logical names, atlas charts and internal polynomial pieces separately from derived instances, signed outlines, support knots, evaluated sections, display polylines, pole slots, cached aliases and triangles. Record planned inputs/ports/operators separately from executed attempts and successful realization. A display inventory or a smaller declared Boolean graph cannot establish source-creation cost, speedup or a finished skin.

## Running

Run tests on the CPU, once the test type-check watch reads clean, with every test a question needs in one run as development's [Tests](../development/validation.md#tests) describes. They confirm each batch of fixes in the Human skill's [order](SKILL.md#order); the instrument serves inspection.

The following is a review candidate for the new explicit person selector. Its actual runner/fixture behavior is still awaiting the combined validation round; do not report this command supported from source inspection alone:

```text
pnpm test --human-people f1 --include workspace_human_people_selection human_trunk_section_family human_shared_neck_boundary human_gluteal_connection human_body_definition human_neck_source_curves human_mass_source_ownership human_head_on_trunk
```

Person selection changes the run's scope, not its geometric expectations. Keep the existing default population and environment selector behavior for callers that do not supply a CLI person option; set no environment variable inside a fixture or selection helper.
