# Agarwal et al. 2018, parametric design velocity

Agarwal D., Robinson T.T., Armstrong C.G., et al. "Parametric design velocity computation for CAD-based design optimization using adjoint methods." *Engineering with Computers* 34(2):225-239, 2018. https://link.springer.com/article/10.1007/s00366-017-0534-x ([group summary](https://www.qub.ac.uk/research-centres/FiniteElementModellingGroup/ResearchTopics/CADParameterisationinDesign)). Read: abstract and group summaries.

## Licence

Paper copyright Springer.

## What it says

- The normal component of design velocity is the outward normal movement of a boundary point caused by perturbing one parameter.
- It is computed by finite differences on faceted models: each parameter is perturbed, the perturbed geometry is faceted and compared with the original, giving one velocity field per parameter in seconds per evaluation. Results were validated against analytical and finite-difference values.
- Combined with an adjoint sensitivity map it gives the gradient of an objective with respect to every parameter from one adjoint analysis.
