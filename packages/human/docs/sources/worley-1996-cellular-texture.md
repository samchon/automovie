# Worley 1996, cellular texture basis function

Worley S. "A Cellular Texture Basis Function." SIGGRAPH 1996, pp. 291-294. [Paper](https://cedric.cnam.fr/~cubaud/PROCEDURAL/worley.pdf), abstract and computation section.

## Licence

Paper copyright ACM.

## What it says

- A basis function complementing Perlin noise, from distances to feature points scattered in random cells; it produced flagstones, "organic crusty skin", crumpled paper, ice, rock and craters.
- Space is divided into unit cubes; the number of feature points per cube follows a Poisson distribution (density about 4 in practice); points come from a linear congruential generator seeded by a hash of the cube ID, so nothing is precomputed or stored.
- Only neighbouring cubes that could hold a closer point are searched, typically one to three.
