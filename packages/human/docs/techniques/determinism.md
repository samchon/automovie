# Floating-point determinism of generated geometry

## What the language guarantees

- ECMAScript Numbers are IEEE 754 binary64. `Number::add` returns the Number value for the exact real sum, and the other arithmetic operators and `Math.sqrt` are specified the same way, so they give the same bits on every conforming engine. The spec adds that "finite-precision addition is commutative, but not always associative", so summation order is part of the result (`../sources/ecma-262-math.md`).
- `Math.sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `sinh`, `cosh`, `tanh`, `exp`, `expm1`, `log`, `log1p`, `log2`, `log10`, `cbrt`, `hypot` and exponentiation (`**`, `Math.pow`) return "implementation-approximated" values. The spec recommends, but does not require, the fdlibm algorithms (`../sources/ecma-262-math.md`).
- `Math.sqrt`, `Math.abs`, `Math.floor`, `Math.round`, `Math.fround` and the min/max family are not in that list.

## What V8 does

- V8 imported fdlibm versions of acos, acosh, asin and asinh because they "are more precise and produce the same result across platforms", and imported fdlibm `cos` and `sin` into `base::ieee754` with matching TurboFan operators (`../sources/v8-fdlibm-commits.md`). The repository runs on V8 in Node 22 and in Chromium, so the same V8 version gives the same results on Windows and Linux for these functions.
- Across V8 versions (a Node upgrade, a browser update), nothing promises identical results for implementation-approximated functions.

## Rules for Human

1. A film carries the generated `IAutoMovieModel` (inline or as a fixed generated asset, #2805), not the identity, so rendering never regenerates geometry and a Node build and a browser render cannot disagree. Only the inspection viewer regenerates from an identity, and it judges the render, not bit identity.
2. Use only `+ - * /` and `Math.sqrt` in the hot geometry path where possible: subdivision masks, limit-point and limit-normal evaluation, barycentric binding and skinning weights are all rational or square-root formulas.
3. Where transcendental functions are needed (profile curves with cos and sin, Gaussian falloffs with exp), compute them from typed parameters, not from accumulated state, so a last-bit difference never compounds through iteration.
4. Fix every summation order (subdivision masks, weight normalization, averages) in code; never sum in an order that depends on a `Map` built from floats or on a sort with ties.
5. Never compare generated floats for equality to decide topology. Topology is fixed per profile by the cage connectivity, not discovered from positions.
6. Integer powers are multiplications, not `**`, because exponentiation is implementation-approximated.
7. A seeded hash or linear congruential generator for procedural maps and hair placement uses 32-bit integer arithmetic (`Math.imul`, `>>> 0`), which is exact.
8. Record geometry digests per identity in the build's measurement checks, so a toolchain upgrade that changes a bit is seen as a digest change, not as a silent drift.

`engine/src/architecture/generateAutoMovieSurfacePattern.ts` already states the repository's stance: hashing and seeded values stabilize variants "without asserting ... cross-platform transcendental bit identity". Human keeps the same stance and makes the claim it can prove: the same bits for the same identity on the same engine version.
