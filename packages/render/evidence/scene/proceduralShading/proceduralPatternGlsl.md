# src/scene/proceduralShading/proceduralPatternGlsl.ts#proceduralPatternGlsl

## @evidence contracts/development/common.md#meaningful-documentation

States the GLSL function it returns, the uniforms it reads and that it mirrors `autoMovieProceduralPattern` per kind.

## @evidence contracts/development/implementation.md#principled-implementation

Each kind's body restates the engine's expression with the same constants and operation order over the shared lattice GLSL.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Only the material's kind is compiled, so a program carries one pattern and the key names the kind.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant differs from the CPU reference; nothing is approximated for speed.

## @evidence contracts/development/implementation.md#efficient-algorithms

String assembly once per program compile.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Three caches the compiled program by the patch key.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
