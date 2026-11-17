# Human schema refinements

Public Human data contracts originate in `@automovie/interface`. They carry field semantics without depending on typia. Runtime constructors and named string constants remain in `@automovie/human`.

For typia validator or schema generation, import the corresponding `*Schema` type from the main `@automovie/human` entry, for example `IAutoMovieHumanParametersSchema`. These types intersect the canonical contracts with their original minimum, maximum, unit and nested schema metadata. They preserve optional properties and inherited refinements; they do not themselves validate a value, apply a default, or add a constructor.

This is an explicit compatibility change for external generators: the plain `IAutoMovieHumanParameters` type, including its compatibility re-export from Human, no longer carries typia tags. Change generator type arguments to `IAutoMovieHumanParametersSchema` to retain those constraints. Ordinary callers can continue passing canonical data to Human's constructors.

Human's former string enums are now const objects backed by canonical literal unions. Runtime member access such as `AutoMovieHumanSex.Female` keeps its name and value. An enum member used as a type must become the corresponding string literal, such as `"female"`, or `typeof AutoMovieHumanSex.Female`; import the whole union type from `@automovie/interface`.

The package contains no direct typia validator/schema-generation call, and generated validator/schema equivalence has not been verified. Runtime admission and fallback behavior belong to Human's constructors and channel evaluators.
