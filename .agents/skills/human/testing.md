# Testing

A Human unit test checks one law, solver or operator on small made inputs. Finish in under one second. Derive expectations independently from closed forms, published definitions or geometry. Run the real code with no stubs, generated expectation values, reference bodies or whole-figure builds. Inspect whole figures with the [shared instrument](screenshot.md).

## Detectors

Check anatomical order relations on the law or operator that guarantees them.

- Limb girth order, from wrist to forearm and ankle through calf, knee and thigh.
- Neck below neck base, waist below hip and bust.
- Ordered heights, one maximum per muscle belly and monotone taper between landmarks.
- Axis inside its section and mirror symmetry.

Test each surface detector on a made defect and valid geometry. Cover open or non-manifold edges, flipped triangles, intersections, folds, crease radius, non-simple sections, seam or port continuity, slivers and curvature ripples. The build report runs the detectors.

## Levels

Test the shared operator once at its owner under [construction](../3d-modeling/crafting/construction.md#tests).

| Level | Check |
| --- | --- |
| Operator | Made inputs against a closed form or independent contract |
| Audit | One data-driven detector per section, seam, surface or input property |
| Anatomy | Anatomical relations against published definitions and ranges |
| Pose and subsystems | Posed skin and subsystem bounds, including strain and joint ranges |

Audits check declared section topology, orientation, continuity and surface health. Verify placement, parameter identity at ISO 20685-1 tolerances, and atlas and bind identity. An anatomy row covers a relation the construction might get wrong.

## People

Use coverage from the task. An f1-only check leaves population acceptance open. A population audit includes the references, population ends of length and breadth and each sex, and both declared ends of every input. Derive limits from the person's inputs, published sources or geometry.

## Writing one

- Read original functions for curves, chains for lofts and finished skin for anatomical measures.
- Measure across a feature in a plane normal to its tangent.
- Verify that each detector fails on a visible defect and passes on valid geometry.
- Account for finite-difference truncation error without widening the original bound.
- Report all findings by person, part, region and direction.
- Build fixtures in the test that owns them and place each test at its level.
- Add a detector for each observed defect class the checks miss.
- Check the test's site and limit when evidence from a still disagrees.
- Compare source maps and both consumers for each shared connection.
- Verify topology and continuity within their stated domains.

## Running

Reuse the [one shared watch](../development/validation.md#type-checking) for Human type checking. The test program's watcher is the only compiler used during Human development.

Once it reads clean, run the relevant CPU [tests](../development/validation.md#tests) together. Select people to set coverage and keep the same expected measurements.
