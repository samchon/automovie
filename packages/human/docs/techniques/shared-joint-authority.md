# Shared joint surfaces

Equal sampled boundary positions and normals do not establish a regular interior. An unconstrained world-coordinate Hermite bridge can lose rank between valid endpoint curves. Increasing tessellation cannot repair that generating function.

## Cut and chart

Retain the original analytic shaft F(s,psi). Solve its actual plane intersection inside its supported station domain. For c=n dot F_s and d=n dot F_psi, the cut tangent is

```
a = -d/c
T = F_psi + a*F_s.
```

A polar reparameterization requires nonzero c and positive qualified polar speed. Mixed derivatives require the original pure and mixed second derivatives; finite differences are not exact authority jets.

## Positive-radius candidate

A physical Hermite field can interpolate log radius in the chart

```
P(lambda,phi) = J + lambda*n
             + exp(f(lambda,phi))*(U*cos(phi)+V*sin(phi)).
```

For an orthonormal frame and finite positive radius, n dot P_lambda=1 and n dot P_phi=0, while the angular tangent is nonzero. These premises establish local rank in this chart, not anatomical correctness or global embedding. The exponential surface is not a world-coordinate cubic.

Restrict adjacent shafts by their true parameter maps and differentiate those maps analytically. Skin and construction must retain the same evaluator through every child interval. Passing an analytic evaluator into a wrapper that later evaluates an endpoint cubic silently destroys the authority.

## Discrete boundary

Both incident meshes must consume one canonical boundary sampling schedule. Equal boundary functions can still emit different polygonal chords when sampled independently. Curve agreement, transverse continuity, regularity and actual mesh incidence are separate acceptance conditions. Finite feasibility samples do not certify every parameter or unseen input.

[Original derivation and experimental record](https://github.com/samchon/automovie/blob/197196b7b/packages/human/docs/techniques/shared-joint-authority.md). Its source identities, fitted coefficients, paths and reported outcomes are not validated for the current reference cohort.
