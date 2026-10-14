# MetaHuman

MetaHuman is the comparison reference for scan-derived realism. It serves as rendered visual comparison only. This survey comes from Epic's documentation and announcements, as recorded in the research notes on #2788.

## Topology

- One fixed template topology. Mesh to MetaHuman fits that template to an input and always outputs the standard topology.

## Faces

- The Creator blends presets drawn from a database of real-world scans. Epic publishes no count.

## Bodies

- 18 fixed body types until 5.5, kept as a legacy compatibility mode.
- From 5.6, a parametric body whose measurement sliders move through a statistical space built from real-world scans, so sliders are correlated: muscularity changes fat unless fat is pinned. No sample count is published.

## Rig

- The DNA file stores geometry, skeleton and rig; RigLogic (open-sourced as OpenRigLogic) evaluates it.

## Licences

- The tools are proprietary under the Unreal Engine EULA.
- The MetaHuman DNA Calibration licence permits use only to build export and edit tools and forbids distribution.
- Since 5.6, characters may be used in other engines and DCC tools and sold, but may not train or enhance AI models; above USD 1M revenue a seat licence applies.

## Use in the rebuild

- Renders of MetaHumans may be placed beside Human renders for visual comparison. Nothing from MetaHuman enters the package.
- The fixed template topology is the same contract Human adopts per profile (one topology and one UV layout for every identity), reached by generation from code instead of by fitting.
- The correlated-slider design is the opposite of Human's parameter rule: Human's detailed parameters are independent named measurements, and correlations live only in the simple-parameter converters.

## Sources

- https://dev.epicgames.com/documentation/metahuman/metahuman-creator-blend-tool-in-unreal-engine
- https://dev.epicgames.com/documentation/metahuman/metahuman-creator-from-custom-mesh-tool-in-unreal-engine
- https://dev.epicgames.com/documentation/metahuman/metahuman-creator-body-params-tool-in-unreal-engine
- https://dev.epicgames.com/documentation/metahuman/metahuman-dna-rig-definition-and-rig-operation
- https://metahuman.com/news/metahuman-leaves-early-access-with-a-feature-packed-new-release
- https://www.cgchannel.com/2025/06/you-can-now-sell-metahumans-or-use-them-in-unity-or-godot/
- https://github.com/EpicGames/MetaHuman-DNA-Calibration (LICENSE)
