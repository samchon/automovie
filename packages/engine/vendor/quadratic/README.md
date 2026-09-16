# Constrained displacement kernel

This directory preserves the earlier OSQP implementation for reproducible numerical comparison. The active engine kernel is [Clarabel](../clarabel/README.md). The OSQP bridge borrows caller buffers, creates and destroys one solver, and copies the primal solution, dual solution and native diagnostics before cleanup. It does not inspect private layouts or retain solver state. The caller owns geometry, units, scaling and acceptance.

## Pinned sources

| Component | Revision | License |
| --- | --- | --- |
| [OSQP 1.0.0](https://github.com/osqp/osqp/tree/236713ce9a56c182ac3230d52108f952afce1523) | `236713ce9a56c182ac3230d52108f952afce1523` | [Apache 2.0](OSQP-LICENSE), with [original NOTICE](OSQP-NOTICE) |
| [QDLDL 0.1.8](https://github.com/osqp/qdldl/tree/138fdac58b9cd1c4137ff1b99152c8108a6cff5b) | `138fdac58b9cd1c4137ff1b99152c8108a6cff5b` | [Apache 2.0](QDLDL-LICENSE) |
| AMD ordering, included by pinned OSQP | OSQP's `algebra/_common/lin_sys/qdldl/amd` subtree | [BSD 3-Clause](AMD-LICENSE) |

The upstream source is unmodified. `CMakeLists.txt` pins both fetched repositories. `bridge.c`, the build configuration and the TypeScript transport are automovie-authored source. The upstream numerical algorithm is described by [Stellato et al., OSQP: An Operator Splitting Solver for Quadratic Programs](https://web.stanford.edu/~boyd/papers/pdf/osqp.pdf); API ownership follows the [OSQP C interface](https://osqp.org/docs/interfaces/C.html).

## Rebuild

Use Emscripten **6.0.9**, CMake **4.1.3** and Ninja **1.13.0**. With that SDK active in the current shell, run from the repository root:

```sh
emcmake cmake -S packages/engine/vendor/quadratic -B .shots/quadratic-build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build .shots/quadratic-build --parallel 4
```

The post-build step writes `quadraticKernelBytes.json` beside the binary in the selected build directory, with source revisions, compiler version, SHA-256 and hexadecimal module bytes. It does not overwrite the active engine kernel. Comparison callers must use OSQP's status meanings, sixth diagnostic (`polishStatus`) and Emscripten memory ABI. Normal TypeScript builds and package consumers neither fetch these repositories nor compile C.

The module uses double scalars and int32 indices. It exports linear memory, allocation, initialization and the bridge, and imports only a memory-growth notification. Printing, profiling, interrupts, derivatives and code generation are disabled. Adaptive rho updates use iteration counts, so machine timing cannot choose a different solve schedule. The TypeScript owner refreshes heap views after memory growth and copies results before returning storage.

The generated JSON is data, not hand-authored solver logic. The package ships this directory's attribution files alongside the compiled runtime and source. A native solved status remains distinct from original-row feasibility, post-deformation geometry, Float32 transport and anatomical plausibility.
