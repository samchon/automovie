# Pelvic common seams

`HumanPelvisSeams` supplies the three interior curves between the common owner's current generated hip and two thigh ports. It does not construct a pelvic skin or choose shared port roots. The assembly owns those ports, their phase, surface normals, transverse fields, diagonals and surface patches. Construction and skin must consume the returned curve objects together.

## Observations and correspondence

The existing reference experiment program published the pelvic horizontal sections, oblique thigh sections and full longitudinal guides. Normal open guides live in `reports.open`; previously failed guides live in separate official contour-resume `fits` namespaces. Eight across guides retain their original physical Hermite widths and directions. Original native face witnesses and accepted-span addresses identify 48 port crossings and 24 intervening arcs. Own-leg ports are the unique positive closed shell containing the actual support-plane intersection. World lateral sign cannot select a port: inner skin in two references crosses that sign.

The source qualification joins 39 to 42 existing observed cells per guide through shared published ports and positive-area cross-chart witnesses. All three native paths lie in one connected observed component union. This establishes neither an exact three-port boundary nor an embedded pelvic skin. Male composite events, the four-port source component and unresolved posterior events remain explicit. Genital semantic exclusion is not established by calling an annulus a pelvis.

The neighboring published source thigh planes have fractions 0.250319 to 0.260026 of actual support length. Their normal offsets from exactly 0.25 are 0.140 to 4.627 mm. Applying the common law at generated exact-quarter ports is an interpolation prediction across that difference, rather than a comparison on the identical observed plane.

## Common guide plane

All positions use mm in the common rest frame: forward +X, up +Y and signed lateral Z. Let `A` be the generated thigh support and `b` its normalized thigh-to-calf direction. The observed plane definition is:

```text
n = normalize(eX - dot(eX,b)*b)
c = dot(n,A)
dot(n,P) = c
```

The zero support-relative offset is inherited from the acquisition's defining constraint. It is not an invented world zero or an average of source plane constants. On the eight actual source support frames the maximum offset residual is 9.36e-15 mm and normal angular residual is 6.95e-18 rad. This checks the same geometric definition on held-out supports; it does not independently validate the skeleton's prediction of those supports from body inputs. `guidePlane` applies that definition to the common owner's generated supports.

## Physical phase and exact endpoint jets

Source identification reads achieved `body-application.json` values, including actual Hip in mm and the dimensionless shape readback. Authored targets remain separate. The original restricted sum of source `h` supplies the observed phase width. Its pooled generated prediction is:

```text
Louter = Hip * (0.09064553821638005 + 0.008474150491653168*shape)
Linner = Hip * 0.051649795942427114
```

Inner shape dependence worsens whole-person holdout and is omitted. Width fit RMS is 3.827 mm outside and 5.090 mm inside; holdout width errors reach 11.381 and 11.318 mm. These are conditional geometric rules over four correlated references, not independent shape effects or population laws.

The generated physical phase is `t` in `[0,L]`, with `u=t/L`. The main owner supplies each actual port curve, its exact intersection parameter and an oriented unit tangent from the generated surface/guide-plane intersection. Endpoint positions and `dP/dt` inherit those current authorities exactly. Normalized endpoint derivatives are `L*unitT`. Unit endpoint speed is a declared generated gauge; original native Hermite speeds and physical widths remain unchanged outside the generator. Neither native nor generated phase width is claimed to be exact arc length.

The seam is a cubic Hermite endpoint field plus `Hip*u²*(1-u)²` times common Legendre channels in its chord-plane frame. Outside, two pooled coefficients yield degree four. Inside, six pooled coefficients yield degree six. Full analytic derivatives retain those degrees and apply `1/L` and `1/L²`. Right outer bend reflects by source side. Inner direction follows source-owned left-to-right identity and bend uses projected common +Y, preserving direction when medial endpoints reverse their world-Z order.

## Fit and remaining work

Every leave-person-out fold refits both phase-width and interior coefficients before evaluating the entire held-out person. Outer fit RMS/max is 0.292/0.604 mm, with holdout RMS 0.226, 0.378, 0.741 and 0.569 mm. Inner fit RMS/max is 2.187/5.506 mm, with holdout RMS 1.037, 1.640, 4.611 and 1.595 mm. Those comparisons condition on observed source endpoints and unit directions. Runtime instead consumes actual generated roots and directions; no source endpoint or normal fallback exists.

Endpoint P/D compatibility supplies no transverse ribbon jet or smooth assembled surface by itself. Coincident ports or a singular chord frame refuse rather than acquiring a coordinate offset. Exact three-port topology, semantic scope, embedding, pointwise/material phase, actual parameter interactions and current hardware-render fidelity remain the common assembly's verification work. No Human or Human-viewer test is introduced or executed.

The source bindings and complete fit candidates remain in `test/.shots/human-analysis/pelvis-port-source-qualification-v1.json`, `pelvis-source-corrected-event-list-v1.json`, `pelvis-plane-width-law-v1.json` and `pelvis-seam-hermite-law-study-v1.json`. Earlier target-conditioned and horizontal two-port experiments remain separately labelled evidence; their unused product implementations were removed.
