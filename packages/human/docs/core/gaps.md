# Core gaps for Human

Survey of `packages/interface`, `packages/engine`, `packages/viewer` and `packages/render` as Human will use them, read at commit 7ef1fb80 on `feat/human-remake`. Human's output is an `IAutoMovieModel` with `origin: "generated"`: the skin as one skinned mesh part on `AutoMovieHumanoidBone` including fingers, eyeballs, teeth, tongue, nails, hair cards and garments as further parts, materials with procedural maps on a published UV layout, jaw and eye bones, and FACS-based expressions. The archetype recipe retirement (#2805) is out of this list.

## What fits as is

| Surface | Where | Verdict |
| --- | --- | --- |
| Model group | `interface/src/model/IAutoMovieModel.ts`, `IAutoMovieModelPart.ts` | Fits. Parts with `attachedBone: null` and a mesh skin become `THREE.SkinnedMesh` in `viewer/src/buildModel.ts`; rigid parts ride a bone; `parts` map gives part isolation to the viewer. |
| Mesh buffers | `interface/src/model/IAutoMovieMesh.ts` | Fits for positions, normals, UV0, indices (`setIndex` takes 32-bit indices), per-vertex `colors` (regional tint) and `reliefWeights` (normal-map strength per vertex). Human must write limit normals: with `normals: null` the viewer calls `computeVertexNormals`, which splits shading at UV seams. `physicalVertices` marks UV-seam duplicates as one point. |
| Skin weights | `interface/src/model/IAutoMovieMeshSkin.ts` | Fits: joint palette on `AutoMovieHumanoidBone`, four influences per vertex, admission at 1e-6. The skinning method is the gap below. |
| Skeleton | `interface/src/skeleton/IAutoMovieSkeleton.ts`, `IAutoMovieBone.ts`, `AutoMovieHumanoidBone.ts` | Fits: 55 VRM 1.0 names with 30 finger bones, `jaw`, `leftEye`, `rightEye`; per-bone `constraint` overrides the default ROM, which lets Human derive per-identity limits. FK ignores rest scale, so Human must not encode proportion in bone scale. |
| Pose | `interface/src/pose/IAutoMovieJointPose.ts`, `engine/src/kinematics/resolvePose.ts` | Fits for named clinical angles per bone (`IAutoMovieHumanPose` converts into it). Rotations only. |
| ROM | `engine/src/rom/constants/DEFAULT_HUMANOID_ROM.ts` | Fits as a fallback; Human supplies its own `constraint` per bone. |
| Retargeting | `engine/src/motion/retargetHumanoidMotion.ts` | Fits if Human's rest pose follows the canonical T-pose convention (`HUMANOID_REST_FRAME`, bone frames as the tables assume), since motion for the stickman then plays on Human with root translation scaled by rest height. |
| Materials | `interface/src/material/IAutoMovieMaterial.ts`, `viewer/src/buildMaterial.ts` | Fits for skin base, roughness, `subsurfaceRadius`, `normalTexture` plus tiled `detailNormalTexture`, `metallicRoughnessTexture`, `doubleSided`, `alphaMode: "mask" | "blend"`, `alphaCutoff`, eye `transmission`/`ior`/`thickness`, nail `clearcoat`. UV0 only, `coordinateSource: "normalized"` suits a published [0, 1] layout. |
| Body | `interface/src/model/IAutoMovieBody.ts`, `engine/src/physics` | Fits for Mission 2: one mass and centre of mass (Human can fill them from segment data). Engine physics works on primitives and spheres; per-segment inertia and collision capsules are Mission 3. |
| Display and render | `viewer/src/AutoMoviePlayer.ts`, `render/src` | Fits: render drives the same viewer in a headless browser, so a model that displays in the playground renders in films. |

## Gaps

Ordered by the stage that needs them first.

### 1. Joint axes for fingers, thumb, eyes and jaw, and the canonical palm orientation

- Where: `engine/src/kinematics/constants/HUMANOID_JOINT_AXES.ts`, `engine/src/rom/constants/DEFAULT_HUMANOID_ROM.ts`, `engine/src/rom/constants/HUMANOID_REST_FRAME.ts`.
- Missing: `HUMANOID_JOINT_AXES` remaps only the arm chain. Every other bone uses `DEFAULT_JOINT_AXES` (flexion about X, abduction about Z, twist about Y). In the T-pose a finger lies along X, so finger flexion rolls the finger about its own length. Horizontal eye rotation is a turn about Y, which the default basis calls twist, but the ROM declares eye twist `null` (immobile) and gives abduction, a roll about Z, the range ±45. The jaw's lateral excursion has the same mismatch. No table states the palm orientation of the canonical rest pose, which fixes what wrist and finger flexion mean.
- Why Human needs it: Human emits finger, thumb, jaw and eye bones (#2793, #2797, #2799), and a film poses them through these tables. Without axes, a curled hand or a sideways glance cannot be authored.
- Change: add finger, thumb, eye and jaw entries to `HUMANOID_JOINT_AXES`, state the canonical palm orientation in its JSDoc, and align the eye and jaw rows of `DEFAULT_HUMANOID_ROM` with those axes. Signs per side follow the existing arm calibration.
- Later, not blocking: carry axes and rest frames on `IAutoMovieBone` so a generated rig describes itself instead of relying on the host passing the right table to `applyPose`.

### 2. Skinning method

- Where: `interface/src/model/IAutoMovieMeshSkin.ts`, `viewer/src/buildModel.ts`, `engine/src/validation/validateMesh.ts`.
- Missing: the viewer builds `THREE.SkinnedMesh`, which is linear blend skinning, and the skin record cannot ask for anything else.
- Why Human needs it: #2800 plans dual quaternion skinning (`../techniques/skinning.md`). Human computing DQS while the viewer draws LBS would make the render differ from Human's own measurement.
- Change: `method?: "linear" | "dual-quaternion"` on `IAutoMovieMeshSkin` (omitted is linear), a DQS vertex shader patch through the viewer's existing material shader patch mechanism, and an engine reference function that skins a mesh with the same formula so measurement and render share one definition. If the evaluation in #2800 picks optimized centres of rotation, a per-vertex `centers` buffer extends the same record.

### 3. Morph targets on meshes

- Where: `interface/src/model/IAutoMovieMesh.ts`, `viewer/src/buildGeometry.ts`, `viewer/src/buildModel.ts`, `engine/src/validation/validateMesh.ts`.
- Missing: a mesh has no morph targets. `viewer/src/applyExpression.ts` already drives `morphTargetDictionary` by ARKit and preset names, but a generated mesh never has one, so `IAutoMovieExpression` cannot move a generated face.
- Why Human needs it: expressions (#2802), eyelids following gaze, and pose correctives (gap 4). The jaw's protrusion and the condylar slide on opening are translations that `IAutoMovieJointPose` cannot express; the `jawForward` and `jawOpen` targets carry them.
- Change: optional `targets?: Array<{ name: string; positions: number[]; normals: number[] | null }>` of deltas aligned to the vertices (the glTF morph target model), admitted for length, finiteness and unique names; the viewer sets `morphAttributes` with relative targets and calls `updateMorphTargets()`. Human emits exactly the 52 `AutoMovieArkitChannel` names, generated by its FACS articulation; it must not also emit preset-named targets, because `applyExpression` writes the preset name and its ARKit expansion together.

### 4. Pose-driven correctives

- Where: `interface/src/model` (no rig-level driver), `interface/src/core/IAutoMovieDrivenDriver.ts` (clip-level only), `viewer/src/applyPose.ts`.
- Missing: a model cannot declare that a target's weight follows a joint angle. Drivers exist only inside clips, and `applyPose` writes bone rotations only.
- Why Human needs it: the elbow and knee crease, the gluteal fold and the deltoid under abduction need correctives with any blend (`../techniques/skinning.md`, SMPL and pose space deformation). Applying them only inside Human's own posing would leave films without them.
- Change: an optional `driver` on a morph target from gap 3: one bone, one clinical axis and an `IAutoMovieDrivenCurve` from angle to weight. The engine resolves the weights with the pose, and `applyPose` writes them beside the bone rotations.

### 5. Gaze through eye bones

- Where: `interface/src/model/IAutoMovieModel.ts`, `viewer/src/applyExpression.ts`, `engine/src/motion/sampleMotion.ts`.
- Missing: `lookUp`, `lookDown`, `lookLeft`, `lookRight` and the `eyeLook*` channels drive morph names only. VRM 1.0 lets a model declare `lookAt.type: "bone"` so gaze rotates `leftEye` and `rightEye` (`../sources/vrm-1-lookat.md`).
- Why Human needs it: eyeballs are separate meshes on eye bones; a morph cannot rotate a sphere without shrinking it at intermediate weights.
- Change: an optional `lookAt` record on `IAutoMovieModel` (type and range maps, after VRM 1.0) and engine resolution of the gaze channels into eye joint rotations when the type is `bone`. Depends on gap 1 for the eye axes.

### 6. Generated images carried by a generated model

- Where: `interface/src/material/IAutoMovieTextureReference.ts`, `interface/src/model/IAutoMovieModel.ts`, `viewer/src/AutoMovieTextureCache.ts`, `viewer/src/IAutoMovieTextureLoader.ts`.
- Missing: a texture binding names a project asset that the host's loader decodes. A model produced at runtime by code has nowhere to put its own pixels.
- Why Human needs it: procedural skin normal and roughness maps, the regional roughness map, and the hair strand atlas (#2801) are generated per profile or per identity.
- Change: `images?: Array<{ id: string; mimeType: "image/png"; data: string }>` on `IAutoMovieModel` (base64, the glTF `images` model), with a binding's `asset` resolved against the model's images first; `AutoMovieTextureCache.prime` decodes them like loaded assets. When the model becomes a fixed generated asset under #2805, the images travel inside it with the same provenance.

### 7. Material lobes for hair, fabric and skin specular

- Where: `interface/src/material/IAutoMovieMaterial.ts`, `viewer/src/buildMaterial.ts`.
- Missing: anisotropy, sheen and specular intensity or colour. The repository's three.js 0.186 `MeshPhysicalMaterial` supports `anisotropy`, `sheen` and `specularIntensity` (read from `node_modules/three/src/materials/MeshPhysicalMaterial.js`). The basis-era hair shadow shading lived in `viewer/src/human`, which #2789 deletes.
- Why Human needs it: hair cards read as hair only with tangent-aligned anisotropic highlights (`../techniques/hair-cards.md`); garments need a fabric sheen; skin specular intensity varies by region (`../techniques/skin-material.md`).
- Change: optional `anisotropy?: { strength: number; rotationDeg: number; texture: AutoMovieTextureBinding | null }`, `sheen?: { color: IAutoMovieColor; roughness: number }` and `specularIntensity?: number` mapped to the same three.js properties. Two shifted hair lobes (Scheuermann) are a later shader patch if single-lobe anisotropy falls short in the render.

### 8. Transparency order for hair cards

- Where: `interface/src/material/IAutoMovieMaterial.ts` (`alphaMode`), viewer rendering.
- Missing: blended cards within one mesh draw in index order with no per-frame sort, and there is no alpha-to-coverage or depth-prime option.
- Why Human needs it: layered cards show sorting errors at the fringe as the head turns (`../sources/scheuermann-2004-hair.md`).
- Change: to be decided in #2801 from renders. Human can pre-sort cards from the scalp outward in its index buffer without any core change; if `mask` with that order is not enough, add `alphaToCoverage?: boolean` (a three.js material property) to the material.

### 9. Semantic masks and keypoints below the model level

- Where: `interface/src/render/IAutoMovieSemanticMaskEntry.ts`, `AutoMovieSemanticKind.ts`, `interface/src/cinematics/IAutoMoviePoseKeypoint.ts`, `engine/src/film/resolvePoseKeypoints.ts`.
- Missing: mask entries address scene nodes, so a whole person is one colour; keypoints are bone origins only, with no nose, eye or ear points.
- Why Human needs it: the campaign's realism goal is to keep diffusion from distorting faces and hands; masks for skin, hair, eyes, teeth and garment and facial keypoints are the conditioning that protects them.
- Change: an optional closed `semantic` class on `IAutoMovieModelPart` that the mask derivation allocates as part-level entries, and optional bone-attached `landmarks` on `IAutoMovieModel` that `resolvePoseKeypoints` projects beside bones. Not blocking any Mission 2 stage; file after #2802.

### 10. Coupled joint limits

- Where: `interface/src/skeleton/IAutoMovieJointConstraint.ts`.
- Missing: limits are per joint and per axis, with one swing cap. A limit that depends on another joint (hip flexion with the knee straight, set by the hamstrings) cannot be declared.
- Why Human needs it: Human admits only combinations a living body can take (#2800).
- Change: not yet; #2800 first reports such cases from Human's admission. If they must reach films, a constraint coupling record is a later core change.

### 11. Stale core documentation about the retired Human exporter

- Where: `interface/src/material/IAutoMovieMaterial.ts` (type JSDoc, `subsurfaceRadius`, `overlays`), `interface/src/material/IAutoMovieMaterialOverlay.ts`.
- Missing: these comments describe a "static Human glTF exporter" that #2789 removes.
- Change: rewrite the sentences when #2789 lands; a glTF export that Human adds later documents its own limits.

## Not gaps

- Catmull-Clark subdivision is not in `engine` (`engine/src/geometry` has loft, sweep, extrude and mesh queries). The plan puts it in Human's `junction` module. It could serve any generated model, so moving it to `engine/src/geometry` later is a judgement for core review, not a blocker.
- `engine/src/geometry` signed mesh queries (`createAutoMovieSignedMeshQuery`, `measureAutoMovieMeshClearance`) already serve garment clearance checks.
