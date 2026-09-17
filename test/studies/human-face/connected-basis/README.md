# Connected facial basis

`basis.json.gz` is a CC0 numerical study asset consumed by the playground's `connected-face.html`. The generic evaluator lives in `@automovie/human`; this selected head and its textures remain application content. The compact edit document identifies `mpfb-connected-head-2026-09-17-clipped` and contains shape, expression and optional material edits. Replay needs this basis, not a portrait or Blender.

## Sources and license

- [MPFB2](https://github.com/makehumancommunity/mpfb2), commit `817587ceb2ea03ea17a5b47e04396cbb4ddfa2d5`: CC0 base mesh and identity targets. Its asset license is retained in [LICENSE.md](LICENSE.md). Its GPL application code is used offline and is not included in this data payload or the runtime.
- [MPFB extra targets](https://github.com/makehumancommunity/mpfb-extra-targets), commit `7eaba3453134385bb5ea9811ef0b33b85b4b556d`: CC0 expression endpoints.
- [MakeHuman](https://github.com/makehumancommunity/makehuman), commit `a8bc2d54ff0ac92e78ff71431b1023eda42bf482`: CC0 low-poly eye asset.
- [Official CC0 system asset archive](https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip): teeth, tongue, brows, lashes and resident textures. [The receipt](system-assets-receipt.json) records the archive URL, ETag and exact downloaded file hashes.

## Derivation

The offline Blender 5.2 extraction samples the selected MPFB neutral head and 76 endpoint states: positive and negative endpoints for 12 identity controls, plus 52 expression controls. Skin receives one subdivision round, eyes two and tongue one. MPFB's native attachment refit samples each identity endpoint on all six surfaces; restoring every source control to zero reproduces all six neutral surfaces exactly.

Coordinates are metres, Y up and positive Z forward. A shared-edge polygon clip at Y = -0.145 m retains the head and upper neck. The same affine intersection stencils evaluate every endpoint, preserving vertex correspondence. Original lip groups become a separate material region; normals are reconstructed on the connected surface before separating materials and UV seams. UV V is inverted for the emitted glTF convention. Textures are original CC0 asset bytes, not input-person photographs.

[The extraction receipt](extraction-receipt.json) pins the source Blender file, uncompressed JSON and deterministic gzip hashes. Geometry is retained at full sampled precision; sparse rows omit only exact zero displacement. Shape controls cover head width/height/depth, cheek fullness, chin width/height/projection, nose width/height/depth and mouth width/height.

## Observed scope

Thirteen numerical states were built and exported through the package, with exact neutral recovery and unchanged caller inputs. Nine colour/clay views per state were captured on an AMD Radeon 8060S. The connected head preserves a continuous nose, cheeks, lips and jaw; shared attachments follow their authored endpoints. This is a reusable authored prior, not an individual anatomical measurement. Full jaw opening and full blink remain stylized, and arbitrary channel combinations have no collision-free or physiological guarantee. No input person's likeness is accepted by this asset study.
