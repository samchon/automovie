# Unreal Engine, hair card generator

Epic Games, "Hair Card Generator for Grooms in Unreal Engine" (5.8, experimental), https://dev.epicgames.com/documentation/en-us/unreal-engine/hair-card-generator-for-grooms-in-unreal-engine.

## Licence

Documentation under Epic's terms; technique reference only.

## What it says

- Strands are grouped into clumps; "a multi-card clump is a group of three hair cards that represent a volume of hair"; more clumps give more, narrower cards.
- A card is "a single rectangular geometry strip with a hair strand texture applied to it"; a triangle budget is distributed across the cards of a filter; subdivision is adaptive by curvature or a fixed maximum of vertical segments.
- Flyaways are single-strand cards for detail.
- Card textures form an atlas of texture islands; the number of unique islands per filter is a setting; textures can be compressed along the strand direction.
- Each LOD is its own generation setting.
