# Signed-plane chart derivatives

The chart is evaluated from four signed affine functions in one declared world frame: the hip, thigh, across and forward planes, with their signs and scales supplied by the common boundary owner.

For each plane, `p(P) = normal dot P - coordinateMm`. Coordinates and plane values use mm; normals are dimensionless and are not normalized. Reversing or rescaling a plane can change the quotients. Given the signed values `h,t,a,f`, the chart is

```
u = h / (h+t)
v = -a / (-a+f).
```

For an affine numerator `N` and affine denominator `D`, let `q=N/D`, `n=grad(N)` and `d=grad(D)`. Differentiating `N=qD` gives the exact world derivatives

```
g = grad(q) = (n-q*d)/D
Hq = -(g outer d + d outer g)/D.
```

The gradient has units `1/mm`, and the Hessian has units `1/mm²`. Both formulas retain the rational function. A finite nonzero denominator is required. Negative denominators and values outside `[0,1]` are kept; their meaning belongs to the owner of the domain.

## Surface pullback

Let the original analytic surface be `F(s,phi)`, with physical station `s` in mm and phase `phi` in radians, carrying `F`, `Fs`, `Fphi`, `Fss`, `Fsphi` and `Fphiphi` in their physical units. Both pure second derivatives are required for the mixed chart derivative.

Define the composite chart Jacobian and its inverse:

```
J = [ grad(u) dot Fs    grad(u) dot Fphi ]
    [ grad(v) dot Fs    grad(v) dot Fphi ]

K = inverse(J) = [ s_u      s_v   ]
                 [ phi_u    phi_v ].
```

The determinant has units `1/(mm radian)`. The rows of `K` have units mm and radians because `u,v` are dimensionless. First derivatives of the reparameterized surface are

```
Su = Fs*s_u + Fphi*phi_u
Sv = Fs*s_v + Fphi*phi_v.
```

The inverse-map second derivative is necessary even when the original surface is affine. Define the original surface's second derivative along the two inverse parameter directions:

```
Q = Fss*s_u*s_v
  + Fsphi*(s_u*phi_v + phi_u*s_v)
  + Fphiphi*phi_u*phi_v.
```

Differentiating `q(F(s(u,v),phi(u,v)))` first in `u`, then in `v`, makes the mixed chart derivative zero for each `q=u,v`. Consequently,

```
r_q = grad(q) dot Q + Su^T * Hq * Sv
[ s_uv, phi_uv ]^T = -K * [ r_u, r_v ]^T
Suv = Q + Fs*s_uv + Fphi*phi_uv.
```

`Su`, `Sv` and `Suv` are world vectors in mm per dimensionless chart coordinates. The calculation uses the original pure and mixed surface derivatives and both world chart Hessians, with no finite differences, projected tangent, average or replacement curve. It reuses the unchanged surface jet and position and changes no physical phase widths.

## Limits

Zero Jacobian rows, singular Jacobians, nonrepresentable inverses, zero quotient denominators and nonfinite derivatives are unsupported. Determinant estimates, `J*K-I` residuals and mixed chart identities describe local arithmetic, not global validity. The chart establishes neither global invertibility, a unique parameter preimage, whole-patch regularity, anatomical correspondence, material phase nor shared-boundary compatibility; the caller owns the planes, correspondence, boundary functions, valid domain and orientation choices.
