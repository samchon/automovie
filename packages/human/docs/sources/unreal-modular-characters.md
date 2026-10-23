# Unreal Engine, working with modular characters

Epic Games, "Working with Modular Characters", https://dev.epicgames.com/documentation/en-us/unreal-engine/working-with-modular-characters-in-unreal-engine.

## Licence

Documentation under Epic's terms; technique reference only.

## What it says

- Three methods: Leader Pose Component (children follow a leader mesh), Copy Pose from Mesh (an AnimGraph node copies matching bones) and Skeletal Mesh Merge (parts merged at runtime into one mesh).
- Leader pose children must be "a subset with the exact matching structure"; extra or skipped joints render in the reference pose.
- The merge path does not transfer morph targets.
- The page does not discuss normals, vertex matching or where to split parts.
