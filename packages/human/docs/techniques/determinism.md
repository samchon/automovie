# Floating-point determinism

[ECMAScript](../sources/ecma-262-math.md) specifies binary64 arithmetic and square root, but transcendental functions and exponentiation may use implementation approximations. Addition is not associative, so accumulation order also affects the result. [V8's fdlibm imports](../sources/v8-fdlibm-commits.md) improve cross-platform consistency for particular functions without promising bit identity across engine versions.

Human's reproducibility premise is a fixed identity, algorithm and runtime version. Typed inputs and seeded integer hashes stabilize a generated variant; they do not establish universal transcendental bit identity. Direct evaluation from parameters avoids compounding last-bit differences through accumulated state. Connectivity comes from semantic topology, not equality comparisons between generated positions.

A film carries generated geometry rather than regenerating it during rendering. The inspection viewer can regenerate from identity, so it remains sensitive to runtime changes. The engine's procedural-pattern generator likewise avoids a cross-platform transcendental identity claim.
