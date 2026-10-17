# Core capability survey

This survey separates shared capabilities from Human's use of them and remaining proposals. Core capability is distinct from Human emitting or visually validating it; inspect the named declarations and consumers before treating a capability as missing.

## Implemented

Declarations and consumers determine each capability's scope:

| Requirement | Declaration and consumer | Human limit |
| --- | --- | --- |
| Rig-owned anatomical axes | `interface/src/skeleton/IAutoMovieBone.ts` carries `axes`; engine pose resolution honors declared axes before host tables/defaults. | Human's eye signs, gaze and lid behavior still need actual consumer checks. |
| Linear and dual-quaternion skinning | `interface/src/model/IAutoMovieMeshSkin.ts` selects `method`; engine `skinAutoMovieMesh` and viewer `buildModel.ts` implement it. | Human joined skin has placeholder distance-based weights. DQS is a comparison baseline, not an accepted deformation solution. |
| Relative morph targets | `interface/src/model/IAutoMovieMesh.ts` carries `IAutoMovieMeshMorphTarget[]`; viewer geometry/model construction uploads them before skinning. | `AutoMovieHuman.express()` returns neutral. Generating the 52 ARKit targets from anatomical articulation remains Human work. |
| Pose-driven target weights | `interface/src/model/IAutoMovieMorphTargetDriver.ts` maps a bone's clinical angle through an `IAutoMovieDrivenCurve`; viewer pose application writes the weight. | This scalar driver is not a general multi-joint corrective solver. Human corrective generation and contact remain unresolved. |
| Bone gaze | `interface/src/model/IAutoMovieLookAt.ts`, engine `resolveLookAt.ts` and viewer expression/pose consumers turn declared eye bones. | Availability does not prove Human emits a working gaze/lid contract. |
| Model-carried images | `interface/src/model/IAutoMovieModel.ts` carries `IAutoMovieImage[]`; the viewer's model texture resolver decodes them before falling back to project assets. | Human emits procedural skin, eye and hair images; their appearance and attachment remain unresolved. |
| Hair/fabric/specular lobes | `interface/src/material/IAutoMovieMaterial.ts` carries anisotropy, sheen and specular intensity; viewer `buildMaterial.ts` maps them. | Two shifted hair lobes and special transparency ordering remain research options if an observed render requires them. |
| Subdivision and face-varying UVs | Engine `subdivideAutoMovieSurface` supplies limit positions/normals and face-varying charts; Human joins its cage before `meshAutoMovieHumanCage.ts` invokes it. | Shared topology and numerical fitting do not prove junction anatomy or form. |
| Signed mesh queries | Engine `createAutoMovieSignedMeshQuery` and `measureAutoMovieMeshClearance` provide geometric queries. | Query success is not pose/contact acceptance or an emitted garment. |

Mesh buffers already carry normals, UVs, physical-vertex aliases, regional colors and relief weights. Skeletons use the shared 55-bone vocabulary and per-bone constraints. Human emits an `IAutoMovieModel` with `origin: "generated"`; runtime regeneration from a private Human recipe is not needed for films.

## Remaining questions

| Question | Existing boundary | Reopening evidence |
| --- | --- | --- |
| Coupled joint/contact limits | `IAutoMovieJointConstraint` describes per-axis ranges and a combined swing cap, with no relation between separate joints. | Demonstrate admitted poses that require a shared constraint or contact mechanism before extending core. |
| Part-level anatomical masks and facial keypoints | Semantic mask entries address the scene graph; `IAutoMovieModelPart` has no anatomical semantic class, and the model has no facial-landmark record for pose-keypoint projection. | A concrete conditioning consumer must establish what additional generic contract is needed. This was a later proposal, not a completed Human feature. |
| Hair card transparency | `alphaMode` supports mask/blend; Human can order its own cards, but the material has no `alphaToCoverage` field. | Show the actual sorting or edge defect before choosing a new renderer option. |
| Alternative weighting/deformation | DQS and scalar morph drivers exist; optimized centers of rotation and a generic posed re-sweep contract are not implied by them. | Compare geometry-derived weights, posed section re-sweeps and anatomical correctives on the affected regions. |

The former exporter-comment cleanup and archetype recipe retirement were rebuild migration work, not ongoing geometry gaps. Reopen a specific stale comment from current source instead of repeating that historical backlog.
