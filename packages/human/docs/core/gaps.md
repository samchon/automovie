# Core capability survey

The original survey at `7ef1fb80` recorded requirements before the core implementation. Rechecked at Human checkpoint `758d17b5`, the items below are already available; treating them as missing would repeat completed work. Core capability is distinct from Human emitting or visually validating it.

## Implemented

Commit `4467d822` (#2815) introduced the shared capability family. Current declarations and consumers determine its scope:

| Requirement | Declaration and consumer | Human limit |
| --- | --- | --- |
| Rig-owned anatomical axes | `interface/src/skeleton/IAutoMovieBone.ts` carries `axes`; engine pose resolution honors declared axes before host tables/defaults. | Human's eye signs, gaze and lid behavior still need #2842's actual consumer checks. |
| Linear and dual-quaternion skinning | `interface/src/model/IAutoMovieMeshSkin.ts` selects `method`; engine `skinAutoMovieMesh` and viewer `buildModel.ts` implement it. | The current Human joined skin has placeholder distance-based weights. DQS is a comparison baseline for #2843, not an accepted deformation solution. |
| Relative morph targets | `interface/src/model/IAutoMovieMesh.ts` carries `IAutoMovieMeshMorphTarget[]`; viewer geometry/model construction uploads them before skinning. | `AutoMovieHuman.express()` returns neutral. #2845 must generate the 52 ARKit targets from anatomical articulation. |
| Pose-driven target weights | `interface/src/model/IAutoMovieMorphTargetDriver.ts` maps a bone's clinical angle through an `IAutoMovieDrivenCurve`; viewer pose application writes the weight. | This scalar driver is not a general multi-joint corrective solver. Human corrective generation and contact remain #2843. |
| Bone gaze | `interface/src/model/IAutoMovieLookAt.ts`, engine `resolveLookAt.ts` and viewer expression/pose consumers turn declared eye bones. | Availability does not prove Human emits a working gaze/lid contract; #2842 owns it. |
| Model-carried images | `interface/src/model/IAutoMovieModel.ts` carries `IAutoMovieImage[]`; the viewer's model texture resolver decodes them before falling back to project assets. | Human already emits procedural skin, eye and hair images; their appearance/attachment acceptance is #2844. |
| Hair/fabric/specular lobes | `interface/src/material/IAutoMovieMaterial.ts` carries anisotropy, sheen and specular intensity; viewer `buildMaterial.ts` maps them. | Two shifted hair lobes and special transparency ordering remain research options if an observed render requires them. |
| Subdivision and face-varying UVs | Engine `subdivideAutoMovieSurface` supplies limit positions/normals and face-varying charts; Human joins its cage before `meshAutoMovieHumanCage.ts` invokes it. | Shared topology and numerical fitting do not prove junction anatomy or form. |
| Signed mesh queries | Engine `createAutoMovieSignedMeshQuery` and `measureAutoMovieMeshClearance` provide geometric queries. | Query success is not pose/contact acceptance or an emitted garment. |

Mesh buffers already carry normals, UVs, physical-vertex aliases, regional colors and relief weights. Skeletons use the shared 55-bone vocabulary and per-bone constraints. Human emits an `IAutoMovieModel` with `origin: "generated"`; runtime regeneration from a private Human recipe is not needed for films.

## Remaining questions

| Question | Existing boundary | Reopening evidence |
| --- | --- | --- |
| Coupled joint/contact limits | `IAutoMovieJointConstraint` describes per-axis ranges and a combined swing cap, with no relation between separate joints. | #2843 must first demonstrate admitted poses that require a shared constraint or contact mechanism. |
| Part-level anatomical masks and facial keypoints | Semantic mask entries address the scene graph; `IAutoMovieModelPart` has no anatomical semantic class, and the model has no facial-landmark record for pose-keypoint projection. | A concrete conditioning consumer must establish what additional generic contract is needed. This was a later proposal, not a completed Human feature. |
| Hair card transparency | `alphaMode` supports mask/blend; Human can order its own cards, but the material has no `alphaToCoverage` field. | #2844 must show the actual sorting/edge defect before a new renderer option is chosen. |
| Alternative weighting/deformation | DQS and scalar morph drivers exist; optimized centers of rotation and a generic posed re-sweep contract are not implied by them. | #2843 compares geometry-derived weights, posed section re-sweeps and anatomical correctives on the affected regions. |

The former exporter-comment cleanup and archetype recipe retirement were rebuild migration work, not ongoing geometry gaps. Reopen a specific stale comment from current source instead of repeating that historical backlog. The [workspace index](../README.md) owns current issue routing and checkpoint limits.
