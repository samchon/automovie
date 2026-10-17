# Halstead, Kass and DeRose 1993, fair interpolation with Catmull-Clark surfaces

Halstead M., Kass M., DeRose T. "Efficient, Fair Interpolation using Catmull-Clark Surfaces." SIGGRAPH 1993, pp. 35-44. [Pixar library page](https://graphics.pixar.com/library/FairSubdivision/index.html). Read: abstract and summaries.

## Licence

Paper copyright ACM. Human takes only the method.

## What it says

- The method computes a control mesh whose Catmull-Clark surface interpolates given data and minimizes a fairness norm, a linear combination of thin-plate and membrane energies.
- Although the surfaces have no closed-form parameterization, the interpolation conditions, the fairness norm and its derivatives are computed exactly, without numerical integration.
- Normals can also be interpolated at an arbitrary subset of the vertices.

## What Human takes

The option of solving a whole cage at once under exact limit constraints instead of sampling controls from a source ([subdivision and cage](../techniques/subdivision-and-cage.md#fitting-a-cage-to-curves), [surface interrogation](../techniques/surface-interrogation.md#global-fairing)).
