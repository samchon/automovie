# Models and motions

Before authoring an `externalMotions` adoption, run `npx --no-install automovie inspect-external <project-path> --profile <profile>`. The deterministic result supplies the exact source-order node identities, hierarchy, local rest basis, dependencies, takes, channels, and timing the adoption record may name. It deliberately performs no semantic bone mapping or adoption choice; the author records those decisions in governed source and may not infer them from display names alone.

Read [Geometry](geometry.md) before changing triangle data or choosing a geometry operation, and read [Rigging](rigging.md) before changing hierarchy, pivots, controls, or deformation.

## Model decisions

## Generated human models

Use `@automovie/human` when a reviewed model calls for a person. `AutoMovieHuman` generates one by code from a typed `IAutoMovieHumanIdentity`, or from beginner `IAutoMovieHumanTraits` through `AutoMovieHuman.fromTraits` and its converter; the installed package README and public JSDoc describe the documents, their admission and the stages not generated yet. Keep the production's identity, appearance, provenance and visible limitations under its model-source owner, and save the person's `getIdentity()` rather than the traits. The package generates people from parameters, not named people or photograph fitting.

Identity, pose and expression are separate documents. `pose` admits an `IAutoMovieHumanPose` against the person's own range of motion and returns the engine pose. `express` admits an `IAutoMovieHumanExpression`, FACS action units with an intensity and side, where an empty list is the neutral face; it returns the neutral engine expression until the face carries its morph targets, so plan facial acting for a shot only once the `express` JSDoc says the face renders it.

Use the returned metre-valued `IAutoMovieModel`, with `origin: "generated"` and the person's own skeleton, through the same model and instance realization path as other authored geometry. `getModel` takes an `IAutoMovieHumanAppearance` and an `assembly` of `"parts"` or `"joined"`. Review the actual skin, eyes, hair and all required views through the review-verification skill. Construction success does not settle likeness or the parts the package has not generated yet.

## Motion decisions

## Gates

## Boundary cases

- A semantic scale or clearance required regardless of representation is a settings fact; proxy dimensions, occupied bounds, and primitive decomposition are model decisions derived from it.
- Settings authorize a state change and any semantic limit; a model names the joint, pivot, and construction-safe interface that realizes it; a motion owns the timed path within both contracts.
- A treatment states why a movement matters; a script stages the physical event; a screenplay states the final audiovisual beat; a shot composes the implemented motions.
- A library stops at its reviewed source branches. A film or brief may consume the same model or motion source through shots.
