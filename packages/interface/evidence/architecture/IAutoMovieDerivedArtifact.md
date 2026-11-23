# src/architecture/IAutoMovieDerivedArtifact.ts#IAutoMovieDerivedArtifact

## @evidence contracts/development/design.md#principled-representation

Admission compares recorded head/variant/phase/configuration, full upstream artifact stamps and citations against directly named input subjects' authored digests, then checks graph cycles. Freshness is conditional on complete honest dependency recording: upstream artifact digest changes with an unchanged stamp are not compared, and no output or input file is rehashed by this gate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Inputs, byte citations, the stamp, and the output digest are four separate members because each answers a different staleness question, and `designLineageImpact` reads only `inputs` to walk the graph backwards.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Output/configuration digest spelling is not byte verification. Every direct input subject carrying a digest requires one matching citation; authored/null-digest subjects and upstream artifacts use the separate stamp rule. Fairness compares phase/configuration among all same-kind artifacts associated with a decision's options, including multiple artifacts of one option, rather than proving their pictures or quantities were generated under equivalent actual conditions.

## @evidence contracts/development/common.md#meaningful-documentation

States the acyclicity and staleness rules, the id collision rules against subjects and published identities, the at-least-one and distinct input rules, the one-citation-per-imported-input rule, the head requirement on the stamp, and what validation checks of the digest.
