# MakeHuman code is never read

## Decision

Nobody working on Human reads MakeHuman or MPFB code. Their CC0 data may be compared offline and is never shipped or loaded.

## Reasons

- MakeHuman code is AGPL-3.0 and MPFB2 code is GPL-3.0. Code written after reading them could be argued to derive from them; not reading them means that question never arises for an MIT package.
- Everything Human needs from that lineage is published literature: linear blend weights, barycentric binding, dual quaternion skinning, cage coordinates, anthropometric regression. `../techniques/` cites the papers.
- The assets, including hm08, targets and proxies, are CC0 since 2020, so comparing a render or a measurement against them offline raises no licence question.

## Consequences

- A technique note cites the paper or documentation it came from, never a MakeHuman source file.
- A comparison against MakeHuman CC0 data happens outside the package, and its result is recorded here as a reading, not as data.
