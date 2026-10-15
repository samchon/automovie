# three.js r186, subsurface and physical material

three.js 0.186.0 as installed in `packages/viewer/node_modules/three`: `examples/jsm/shaders/SubsurfaceScatteringShader.js` and `src/materials/MeshPhysicalMaterial.js`. Read in the repository.

## Licence

MIT.

## SubsurfaceScatteringShader

Based on Barré-Brisebois and Bouchard, GDC 2011, "Approximating Translucency for a Fast, Cheap and Convincing Subsurface Scattering Look". It extends the Phong fragment shader; per light:

```
scatteringHalf = normalize(L + N * thicknessDistortion)
scatteringDot  = pow(saturate(dot(V, -scatteringHalf)), thicknessPower) * thicknessScale
scatteringIllu = (scatteringDot + thicknessAmbient) * thickness   // thickness from a texture
directDiffuse += scatteringIllu * thicknessAttenuation * lightColor
```

Defaults: distortion 0.1, ambient 0, attenuation 0.1, power 2, scale 10. It models light coming through thin parts (ears, nostrils, fingers) from behind, not lateral diffusion.

## MeshPhysicalMaterial

Exposes sheen (colour, roughness), anisotropy (strength, rotation, map), specularIntensity and specularColor, transmission, thickness, attenuationColor and distance, iridescence, clearcoat and dispersion. `packages/viewer/src/buildMaterial.ts` builds every automovie material as a MeshPhysicalMaterial and adds its own screen-space curvature subsurface approximation when `subsurfaceRadius` is set.

## What Human takes

Back-lit translucency of the ear and nostril rim needs a spatially varying thickness, while `IAutoMovieMaterial.thickness` is one scalar for dielectric transmission and the viewer's `subsurfaceRadius` approximation handles only lateral diffusion of front light. Anisotropy for hair and sheen for vellus and lashes exist in the renderer but not in the interface.
