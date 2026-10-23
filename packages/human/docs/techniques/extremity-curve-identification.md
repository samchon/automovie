# Hand and foot curve identification

Source support chords, clinical skin dimensions and visible endpoint positions have different definitions. Select a positive shell by actual support-chain intersection and lineage, not contour ordinal or size. A proximal finger cut can contain palm; a toe-root cut can contain forefoot. Multiple radial intersections reject a single-radius chart rather than justify an outermost-hit shortcut.

For a cubic source span with physical width h,

```
P(t) = H00(t)*P0 + h*H10(t)*D0 + H01(t)*P1 + h*H11(t)*D1.
```

Keep h, original derivative units, degree, closure and source-fit diagnostics. Adaptive Bernstein flattening controls approximation of the saved cubic, not its unknown error against the original surface.

## Defining dimensions and features

An exact breadth or length equality belongs in the common solve. Root spacing, palm reach, digit reach and thumb reach are independent constraints; a girth-only support fit cannot recover all of them. Direct Pythagorean construction can enforce a chord breadth after its other components are fixed, but infeasible dimensions must refuse generation.

Identify foot centre and radial shape separately. Distinct breadth maxima, minima, arch/instep transitions and pre-web endpoints can require distinct principal features. Constrain defining width over the whole supported domain; exact width at one ring does not prevent a wider intermediate ring. Increasing Fourier order can reduce RMS while worsening maximum error.

## Terminals

A positive-radius terminal hypothesis from an actual shaft endpoint can use R>0, u=(s-s0)/(2R), z=2u-u² and

```
r(u,phi) = (1-u)*A(phi)
 * exp(u*(1+2R*D(phi)/A(phi))+u²*G(phi)+u³*H(phi)).
```

A and D are endpoint radius and physical radial derivative. The expression preserves the starting value and longitudinal jet under the stated station map and keeps interior radius positive when finite and A>0. Terminal topology, pole regularity and finite jets require their own qualification; a smooth single-pole hypothesis does not reproduce every saved source critical event.

Cubic radius interpolation can become negative even with positive boundary radii. A positive expression avoids that failure without identifying an unobserved fingertip, web or toe. Use source incidence and explicit branch domains before choosing caps.

## Boundaries and qualification

Ankle and wrist joins need common exact cuts, physical phase and transverse jets. Overlapping triangle bounds do not prove a collision; sampled collision absence does not certify continuous embedding. Forward extent, breadth, perimeter, held-out residual and actual appearance remain separate checks. Old geometric proxy tables and conditional fits are not current reference measurements or clinical conversions.

[Original derivation and experimental record](https://github.com/samchon/automovie/blob/197196b7b/packages/human/docs/techniques/extremity-curve-identification.md). Its source identities, fitted coefficients, paths and reported outcomes are not validated for the current reference cohort.
