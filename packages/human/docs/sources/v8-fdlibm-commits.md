# V8 commits importing fdlibm

Chromium code reviews of V8 changes, 2016:

- https://codereview.chromium.org/2122643002, "X87: [builtins] Unify most of the remaining Math builtins." (r37496, 2016-07-04), a port of the original change.
- https://codereview.chromium.org/2078273002, "PPC/s390: [builtins] Introduce proper Float64Cos and Float64Sin."

## Licence

Public code review records. Cited for a fact about V8's behaviour.

## What they say

- V8 imported "fdlibm versions of acos, acosh, asin and asinh, which are more precise and produce the same result across platforms".
- V8 imported `base::ieee754::cos()` and `base::ieee754::sin()` from fdlibm and built TurboFan operators on them, "similar to what we do for Float64Log".

## What Human takes

That one V8 version computes these functions with its own fdlibm port rather than the operating system's libm, so Windows and Linux agree for the same Node or Chromium version; nothing promises agreement across V8 versions (`../techniques/determinism.md`).
