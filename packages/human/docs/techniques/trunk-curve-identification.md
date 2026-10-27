# Trunk curve identification

Native control values, captured measurement-course lengths and recovered skin perimeter are different observables. A native waist plane need not be the minimum-area plane.

## Size and shape

A candidate separates physical size Q(s), dimensionless radial shape S(s,phi;q) and a centre curve:

```
R(s,phi) = Q(s)*S(s,phi;q)
P(s,phi) = centre(s) + R(s,phi)*[cos(phi),0,sin(phi)].
```

If Q is cubic and S quintic, R has longitudinal degree eight. Circumferential multiplication by sine/cosine also changes the world Fourier order. Retain the actual function and analytic jets through restriction instead of making an endpoint-cubic surrogate.

At a native control plane where Q=q_i, the generated planar perimeter is

```
L_i = q_i * integral_0^(2*pi) sqrt(S_i²+(dS_i/dphi)²) dphi.
```

It equals q_i only under an additional normalization constraint, which does not apply when q_i names a different source measurement protocol.

## Feature and topology domains

Identify size planes, silhouette/volume features and topology events separately. Additional area-extremum curves can evaluate the unchanged family without adding fitting knots. A radial family requires a qualified unique positive ray intersection over its domain. Axillary mergers and open collar observations can violate that premise; they require branch charts rather than radial extrapolation.

A fitted centre is part of the skin authority and need not coincide with a rig axis. Compare source-local curve error, common-law residual, frame transport, tessellation and actual assembled appearance separately.
