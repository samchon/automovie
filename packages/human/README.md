# @automovie/human

Generates a human figure from typed parameters by code: named measurements, physiological motions and closed-set choices go in, and an `IAutoMovieModel` comes out. The package holds no mesh, morph target or baked data.

The package is being rebuilt under [#2788](https://github.com/samchon/automovie/issues/2788) and exports nothing yet.

The build first runs `scripts/guard.ts`, which refuses a file other than TypeScript, Markdown and the package's own configuration, a file above 256 KiB, and an array literal under `src` holding more than 64 numbers.
