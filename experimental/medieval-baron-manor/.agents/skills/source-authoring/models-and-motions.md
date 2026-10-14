# Models and motions

Before authoring an `externalMotions` adoption, run `npx --no-install automovie inspect-external <project-path> --profile <profile>`. The deterministic result supplies the exact source-order node identities, hierarchy, local rest basis, dependencies, takes, channels, and timing the adoption record may name. It deliberately performs no semantic bone mapping or adoption choice; the author records those decisions in governed source and may not infer them from display names alone.

Read [Geometry](geometry.md) before changing triangle data or choosing a geometry operation, and read [Rigging](rigging.md) before changing hierarchy, pivots, controls, or deformation.

## Model decisions

## Anatomical face models

Use `@automovie/human` when a reviewed model calls for numerically authored facial anatomy. Its installed package README and public JSDoc describe `IAutoMovieHumanFaceDocument`, `buildHumanFace`, component profiles and scalar controls. Keep the production's observed or authored basis, part settings, provenance and visible limitations under its model-source owner. The package supplies capability, not named people or photograph fitting.

Identity, observed expression and current expression are separate records. An omitted current expression means neutral; it does not replay the photographed smile. A motion owner may evaluate its reviewed time-varying expression and call the face builder for the selected pose. This is procedural reconstruction, not a skinned animation or a real-time playback guarantee. Record the sampling cost and supported combinations before choosing it for a shot.

Use the returned metre-valued `IAutoMovieModel` through the same model and instance realization path as other authored geometry. `exportHumanFace(model)` produces portable GLB bytes and glTF/resources without handing a class-bound document across module instances. A static facial GLTF/GLB may instead be adopted as an external model under the existing adoption procedure; its exported pose has no facial animation channels. Review the actual eyes, lips, dental occlusion, shared skin and all required views through the review-verification skill. Construction success does not settle likeness, hidden anatomy or unsupported oral physiology.

## Motion decisions

## Gates

## Boundary cases

- A semantic scale or clearance required regardless of representation is a settings fact; proxy dimensions, occupied bounds, and primitive decomposition are model decisions derived from it.
- Settings authorize a state change and any semantic limit; a model names the joint, pivot, and construction-safe interface that realizes it; a motion owns the timed path within both contracts.
- A treatment states why a movement matters; a script stages the physical event; a screenplay states the final audiovisual beat; a shot composes the implemented motions.
- A library stops at its reviewed source branches. A film or brief may consume the same model or motion source through shots.
