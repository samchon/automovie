# References

## Recover The Complete Source

Call user-provided geometry a reference model in public code, documents, commits, issues and pull requests; omit the generating service's name. Preserve original observations outside the product generator.

Use the actual `recovery` package API and [Mesh Recovery](../3d-modeling/recovery.md) for extraction, registration and independent reconstruction. Recover sections, longitudinal guides, obliques and feature boundaries throughout the body, including small parts. Save curve membership, continuation, selection, publication and override relationships, open endpoints, orientation and branch or contact events with source provenance.

Inventory declared, recovered, converted and unsupported families separately. A convenient subset, successful command or count of spans does not establish complete extraction. Resolve source requests, saved controls and measured evaluated geometry separately; retain unknowns without inferring controls from a filename or appearance.

## Hermite Storage

Save the whole recovered curve set before selecting principal layers. For a cubic segment `C(t)` on `[a,b]`, store endpoints `P0=C(a)`, `P1=C(b)`, original interval and endpoint derivatives `D0=dC/dt(a)`, `D1=dC/dt(b)`. With `h=b-a` and `u=(t-a)/h`, its exact form is:

```text
C(t) = (2u^3-3u^2+1) P0 + (u^3-2u^2+u) h D0
     + (-2u^3+3u^2) P1 + (u^3-u^2) h D1
```

Preserve degree, knots or segment intervals, physical units, frames, orientation and curve relationships. Endpoint positions and first derivatives determine a cubic, not an arbitrary higher-degree or rational curve. Retain enough derivatives or homogeneous polynomial and weight information for the original basis, or declare the unsupported conversion; never silently reduce it to a cubic. Any separately requested approximation states its error and remains distinct from exact storage.

When reversing or changing a parameter, transform derivatives by the chain rule and retain the mapping. A horizontal ring's height difference is not its curve parameter width. Distinguish a section's circumferential derivative from the derivative between layers; a collection of section tangents does not supply an observed longitudinal tangent field.

Publish immutable source and converted-artifact hashes, conversion method, family inventory and relationships so the generating analysis can be reproduced. Executable conversion tools belong to their responsible package or tooling surface, never the research documentation directory.

## Comparable Observations

Compare measurements only under matching units, posture, physical frame, plane and landmark definitions. Record any conversion and its uncertainty. Geometric extrema, rig markers and clinical landmarks are different observations until correspondence is supported.

Keep measured, derived, fitted, conventional and unknown quantities explicit. The reference is a practical shape criterion; do not fit its incidental noise or require population or clinical confirmation before implementing its broad form. Population and physiological claims require their own evidence under [Anatomy](anatomy.md).
