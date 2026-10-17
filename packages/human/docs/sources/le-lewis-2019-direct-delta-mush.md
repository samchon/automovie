# Le and Lewis 2019, Direct Delta Mush

Le BH, Lewis JP. "Direct Delta Mush Skinning and Variants." ACM Transactions on Graphics 38(4), Article 113, 2019. Read from EA SEED's copy at https://media.contentapi.ea.com/content/dam/ea/seed/presentations/direct-delta-mush-and-variants.pdf (abstract and sections 1 to 2).

## Licence

Paper copyright ACM. Read for technique comparison only.

## What it says

- Delta Mush (Mancewicz et al. 2014, Rhythm & Hues) skins rigidly, smooths the deformed geometry (the "mush"), and adds back the rest-pose difference between the original and its smoothed version (the "delta"). It largely removes collapsing and bulging and simplifies rig authoring, but its Laplacian smoothing iterates every frame.
- Direct Delta Mush moves the smoothing to a rest-pose precomputation of per-vertex multi-weights, giving a direct per-frame formula comparable in form to other direct skinning methods.
- Auto-generated weights (Baran and Popović 2007; Jacobson et al.) remove manual weight painting but not collapsing or bulging artifacts.

## What Human takes

A comparison point for the [skinning choice](../techniques/skinning.md). Avoiding manual weight painting does not remove deformation artifacts, so candidate analytic weights alone are not grounds to reject Delta Mush. Its per-vertex representation and runtime work must be compared with the other methods. The original Delta Mush paper (Mancewicz et al. 2014) was not opened.
