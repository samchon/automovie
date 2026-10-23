# Guide completeness and bounded retry

A partial collection can contain valid open curves, valid closed curves, unresolved fit tolerances and failed contours. Preserve those populations separately. An open guide is not absent data, and an unresolved fit estimate does not authorize replacing an already published curve.

## Finite budget argument

A noncoplanar triangle contributes at most one plane-intersection segment; a coplanar triangle contributes at most three boundary edges. For F distinct contributing faces, the emitted contour graph therefore has at most 3F edges. A maximal-chain walk visits each emitted edge once; aliases or coincident-edge cancellation can reduce the count.

If an adaptive fitter partitions positive integer ranges of original observation edges, every accepted span and outstanding job owns at least one edge. A split partitions a job into two nonempty ranges. Thus

```
accepted spans + outstanding jobs <= observation edges <= 3F.
```

A span budget of 3F removes that particular budget failure under these premises. It does not prescribe one span per edge, establish a continuous tolerance bound or eliminate numerical failure. Retry only failed contours through the official resume path while retaining published authorities byte-for-byte.

## Endpoint and interior shape

Small endpoint residuals do not justify replacing a multi-span guide by one endpoint cubic. A candidate boundary-preserving residual is

```
E(t) = H(t) + L*t²*(1-t)²*sum(c_k(q)*P_k(2t-1)),  0 <= t <= 1.
```

H owns exact endpoint values and normalized first jets. L is a declared physical scale. Integrate over the original clipped Hermite intervals with sufficient quadrature order for the actual polynomial products. Normalize physical source phase with its signed Jacobian.

A possible dimensionless condition is endpoint chord length divided by endpoint-jet scale, with L=(|E_t(0)|+|E_t(1)|)/2. This ratio is invariant to rigid placement and uniform spatial scale, but nonlinear retiming changes it. Rank, conditioning and omitted-person behavior must qualify extra conditions; lower in-sample error alone does not justify them.

[Original derivation and experimental record](https://github.com/samchon/automovie/blob/197196b7b/packages/human/docs/techniques/branch-guide-observation-audit.md). Its source identities, fitted coefficients, paths and reported outcomes are not validated for the current reference cohort.
