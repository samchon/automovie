# src/material/AutoMovieEngineMaterial.ts#AutoMovieEngineMaterial.pcg3d

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc describes three lattice inputs, their conversion to unsigned 32-bit words and the three output words. A negative integer carries its two's-complement bits.

## @evidence contracts/development/implementation.md#principled-implementation

The PCG3D implementation advances each coordinate by a fixed affine word step, cross-mixes the three values twice, and separates the mixes by a high-half shift and XOR. Math.imul and unsigned conversion implement the same modulo-2^32 word arithmetic throughout.

## @evidence contracts/development/implementation.md#efficient-algorithms

The three-word hash runs a fixed number of arithmetic operations. It retains no state and returns a fresh tuple.

# src/material/AutoMovieEngineMaterial.ts#AutoMovieEngineMaterial.proceduralCells

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies seed and lattice units, the searched neighbourhood and which distances are also valid for the full lattice.

## @evidence contracts/development/implementation.md#principled-implementation

Each cube gets one seeded feature point from salt 16 and three hash words scaled into the unit cube. The scan maintains the two shortest Euclidean distances, including equal distances from different points. An unvisited cube lies at least one unit away, so candidates up to one unit are full-lattice distances.

## @evidence contracts/development/implementation.md#efficient-algorithms

The operation hashes and scans exactly 27 cells. Two running minima supply the fresh distance pair.

# src/material/AutoMovieEngineMaterial.ts#AutoMovieEngineMaterial.proceduralFractal

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the lattice scale, number of octaves, frequency and amplitude progression and the normalized range.

## @evidence contracts/development/implementation.md#principled-implementation

The four noise calls use salts 1 through 4, with scale factors 1, 2, 4 and 8. Their nonnegative weights sum to 1.875. Dividing by that sum preserves the individual noise bounds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four fixed-cost noise calls accumulate a local sum. The amplitude and frequency are carried between octaves.

# src/material/AutoMovieEngineMaterial.ts#AutoMovieEngineMaterial.proceduralFrame

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the axis admission premise, names the three sample-space vectors and specifies the near-Z reference switch.

## @evidence contracts/development/implementation.md#principled-implementation

Normalizing the authored axis gives along. A cross product gives an orthogonal across direction, and the alternate X reference keeps that direction nondegenerate near Z. Normalizing across and crossing it with along gives the oriented frame used for directional sampling.

## @evidence contracts/development/implementation.md#efficient-algorithms

The calculation uses fixed-size vector arithmetic and performs the alternate cross product only near the Z axis. Each call returns its own frame.

# src/material/AutoMovieEngineMaterial.ts#AutoMovieEngineMaterial.proceduralHash

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc separates seed and salt from lattice identity, and states the word conversion, output size and replay rule.

## @evidence contracts/development/implementation.md#principled-implementation

PCG3D first mixes seed, salt and the fixed word 0x9e3779b9 into a three-word key. Each signed coordinate contributes its low 32 bits by XOR with its corresponding key word. A second PCG3D pass produces the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two fixed-size hashes and three XORs form the result from local words.

# src/material/AutoMovieEngineMaterial.ts#AutoMovieEngineMaterial.proceduralNoise

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the seed and salt, lattice units, eight-corner interpolation, lattice zero and output range.

## @evidence contracts/development/implementation.md#principled-implementation

The low four bits of each hashed corner choose a gradient from the improved Perlin edge directions. Quintic fades blend corner dot products along the three axes. Shared corner values preserve interpolation across cells, and the final clamp enforces the stated range.

## @evidence contracts/development/implementation.md#efficient-algorithms

The seed/salt key is built once per sample. Eight hashes, three fades and seven scalar blends complete the sample with constant storage.

# src/material/AutoMovieEngineMaterial.ts#AutoMovieEngineMaterial.proceduralPattern

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the sampling frame and units, scale, six pattern choices and common output bound.

## @evidence contracts/development/implementation.md#principled-implementation

Each material converts metres by its declared scale. Plaster and clay remap fractal noise, stone weights the cell-distance gap three to one against noise, and wood evaluates a perturbed periodic ring radius. Fabric takes the larger staggered thread profile with deterministic thread weights. Brushed metal stretches the directional frequency ratio by 100. Each branch clamps its result.

## @evidence contracts/development/implementation.md#efficient-algorithms

A switch evaluates only the selected material law. Directional branches alone build the axis frame, and the noise and cellular calls use fixed-size work independent of the sampled scene.

# src/material/AutoMovieEngineMaterial.ts#AutoMovieEngineMaterial.proceduralPieceOffset

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies the module identity, UTF-16 input and output axes in metres. It gives the offset span and scale premise.

## @evidence contracts/development/implementation.md#principled-implementation

A 32-bit FNV recurrence reads the occurrence's UTF-16 units. PCG3D hashes that word with the seed and salt 48. Each unsigned result is divided by 2^32 and scaled by 64 feature widths, giving three coordinate offsets for the selected occurrence.

## @evidence contracts/development/implementation.md#efficient-algorithms

The occurrence ID is read once into one 32-bit accumulator. Hashing and mapping the final three words take constant work and no per-piece cache.

# src/material/AutoMovieEngineMaterial.ts#AutoMovieEngineMaterial.wearWeight

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the bind-pose frame, metre distance, band width and the representability premise for the zero boundary.

## @evidence contracts/development/implementation.md#principled-implementation

The distance-to-width ratio gives a clamped band. A smoothstep between one minus amount and one selects the weight, then normalized four-octave noise at the bind-pose point breaks up the band. The layer must give distinct smoothstep endpoints in binary64.

## @evidence contracts/development/implementation.md#efficient-algorithms

One band evaluation and one fixed-size fractal sample produce the weight. The function retains neither geometry nor sampled values.

# src/material/AutoMovieEngineMaterial.ts#AutoMovieEngineMaterial.sampleProceduralSurface

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc distinguishes the two sample records, their units, sheet modes, the finite mapped point and the result's colour, roughness and height.

## @evidence contracts/development/implementation.md#principled-implementation

For pieces the sampler rotates UV by the negative occurrence angle, applies the authored scale and offset, and converts sheet turns to metres. Module sheets add one occurrence offset. The resolved point is checked for finite coordinates before the selected pattern is evaluated and used to interpolate colour and roughness and scale relief.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each call maps one point, evaluates one material law and creates one result. The occurrence ID is read only for module sheets.
