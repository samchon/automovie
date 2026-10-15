# ECMA-262, Number arithmetic and the Math object

ECMAScript Language Specification, current draft. Read from the source at https://raw.githubusercontent.com/tc39/ecma262/main/spec.html (definitions of implementation-approximated, the Number type, `Number::add`, `Number::exponentiate`, and the Math function properties).

## Licence

Ecma International specification text. Cited, not copied.

## What it says

- An implementation-approximated facility "is defined in whole or in part by an external source but has a recommended, ideal behaviour".
- `Number::add` performs IEEE 754-2019 binary64 addition and returns the Number value for the exact real sum; "finite-precision addition is commutative, but not always associative".
- `Math.sqrt` returns the Number value for the exact square root.
- `Number::exponentiate` (so `**` and `Math.pow`), and `Math.acos`, `acosh`, `asin`, `asinh`, `atan`, `atanh`, `atan2`, `cbrt`, `cos`, `cosh`, `exp`, `expm1`, `hypot`, `log`, `log1p`, `log10`, `log2`, `sin`, `sinh`, `tan`, `tanh` return implementation-approximated values.
- The spec recommends, without requiring, the fdlibm approximation algorithms.
- `Math.fround` converts with roundTiesToEven, exactly.

## What Human takes

Which operations give identical bits on every engine and which do not (`../techniques/determinism.md`).
