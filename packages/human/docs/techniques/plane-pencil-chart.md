# Signed-plane chart derivatives

`HumanPlanePencilChart` evaluates a chart from four signed affine functions in one caller-owned world frame. The common boundary owner supplies the hip, thigh, across and forward planes, their signs and their scales. The helper selects no ports, reference axes, canonical orientations or inside domain. It neither fits nor changes a surface.

For each plane, `p(P) = normal dot P - coordinateMm`. Coordinates and plane values use mm; normals are dimensionless and are retained without normalization. Simultaneously reversing or rescaling a plane is a caller decision that can change the quotients. Given the signed values `h,t,a,f`, the chart is

```
u = h / (h+t)
v = -a / (-a+f).
```

For an affine numerator `N` and affine denominator `D`, let `q=N/D`, `n=grad(N)` and `d=grad(D)`. Differentiating `N=qD` gives the exact world derivatives

```
g = grad(q) = (n-q*d)/D
Hq = -(g outer d + d outer g)/D.
```

The gradient has units `1/mm`, and the Hessian has units `1/mm²`. Both formulas retain the rational function. A finite nonzero denominator is required. The helper preserves negative denominators and values outside `[0,1]`; their meaning belongs to the owner of the domain.

## Surface pullback

Let the original analytic authority be `F(s,phi)`, with physical station `s` in mm and phase `phi` in radians. The input retains `F`, `Fs`, `Fphi`, `Fss`, `Fsphi` and `Fphiphi` in the units of `HumanCurveFamily.Jet`. Both pure second derivatives are required for the mixed chart derivative. A missing derivative is unsupported.

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

`Su`, `Sv` and `Suv` are world vectors in mm per dimensionless chart coordinates. This calculation includes the original pure and mixed surface derivatives and both world chart Hessians. It uses no finite differences, projected tangent, average or replacement curve. The output borrows the unchanged authority jet and its position; it does not reconstruct coefficients or change physical phase widths.

## Numerical admission and ownership

All inputs and outputs must be finite binary64 values. The two Jacobian rows are scaled for determinant evaluation. Cancellation within `32 * Number.EPSILON` times the absolute determinant-product sum is unresolved and throws. A zero row, singular Jacobian, nonrepresentable determinant or inverse, zero quotient denominator, or nonfinite derivative also throws before publication. The resolution check is not a minimum-area shape constraint. The returned determinant, relative determinant, `J*K-I` residual and mixed chart identities describe local arithmetic only.

The caller owns the four signed planes, source-to-generated correspondence, boundary functions, the valid chart domain and every orientation choice. This helper establishes neither global invertibility nor a unique parameter preimage, whole-patch regularity, anatomical correspondence, material phase or shared-boundary compatibility. Each call has constant work and storage, retains no cache or resources, and leaves source and caller objects unchanged. The main owner wires the helper to a surface authority and performs compilation and actual inspection; no Human test is added or executed for this helper.
