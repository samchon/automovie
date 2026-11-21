# Common

Every exported declaration answers this item alongside its design, implementation, testing or folder contract.

## Meaningful documentation

Can a reader trace the declaration to what it realizes, and each value it sets to its source?

In the doc comment, state the declaration's purpose and what it realizes: a screenplay section or beat, a subject record, a study section, an instruction or a requirement. Include units, frames, timebases, defaults and failure effects where a caller needs them. For each test, document its cases and expected behavior.

Comment each value the code sets, and each default it relies on, with the source it realizes and how. Write what a reader needs to check the value against that source without deriving it again. For a non-obvious calculation, explain its premises, derivation, units and frames, and cite the origin of fitted or conventional coefficients apart from measurements.

Write it to the documentation skill's rules, with a blank comment line between prose and tags and a blank line between documented properties.

State which facts the documentation gives.
