# Historical OSQP comparison provenance

The engine directly implements its [TypeScript quadratic solver](../../src/math/solveAutoMovieQuadraticKernel.ts). This directory retains historical comparison attribution; it contains no executable bridge, build recipe, byte payload or solver fallback.

| Historical component | Pinned revision | Retained license or notice |
| --- | --- | --- |
| OSQP 1.0.0 | 236713ce9a56c182ac3230d52108f952afce1523 | [Apache-2.0](OSQP-LICENSE), [NOTICE](OSQP-NOTICE) |
| QDLDL 0.1.8 | 138fdac58b9cd1c4137ff1b99152c8108a6cff5b | [Apache-2.0](QDLDL-LICENSE) |
| AMD ordering bundled in that OSQP revision | algebra/_common/lin_sys/qdldl/amd | [BSD-3-Clause](AMD-LICENSE) |

The prior AutoMovie C bridge and build inputs remain in [repository revision 0ed4cd38bd8e4cd115226e42ade4b43587a7f8be](https://github.com/samchon/automovie/tree/0ed4cd38bd8e4cd115226e42ade4b43587a7f8be/packages/engine/vendor/quadratic) and preserved comparison archives. The current solver imports none of them. Its actual [Clarabel-derived source provenance](../clarabel/README.md) documents the modified Apache-2.0 TypeScript files and their distribution obligations.
