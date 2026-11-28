# src/skeleton/AutoMovieHumanCanonicalProfile.ts#AutoMovieHumanCanonicalProfile.build

## @evidence contracts/development/common.md#meaningful-documentation

This call consumes a complete canonical rest joint map in metres, a positive kilogram mass, a profile id and the person's strength inputs. It produces the stock physical profile and reports missing required joints or segment colliders. Simulation-only sole shapes carry no mass.

## @evidence contracts/development/implementation.md#principled-implementation

Use the common polygon ring hulls plus hand capsules as skin shapes, and combine their inertias with each Dempster/Winter mass group's uniform density; the head share follows de Leva. Build the joint axes and limits in the canonical rest frame. Measured strength directions use the person model, while the unmeasured direction fallback scales with downstream mass. The sole support uses the heel and forefoot hull and only enters contactShapes when the support construction succeeds. The ring hull and the loft share input vertices, with different triangulation possible between those vertices.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation builds the contact shapes once, groups them by carrier and shares those parts between the volume-based mass calculation, joint-axis inertia calculations and returned segments. The per-axis subtree operations run over the fixed canonical rig during body preparation. Motion placement reads the prepared profile.
