# Common Implementation Principles

These chapters apply to every maintained declaration. Answer with grounds specific to the declaration; a generic compliance sentence is no evidence.

## Principled Implementation

- Implement the required meaning with methods justified by the problem's principles: language idioms, documented API semantics and recognized algorithms where they fit. Popularity or prior use alone proves nothing, and a custom method needs a sound semantic or mathematical basis.
- For a transformation, separate the intended change from the meaning that must survive. For a numerical algorithm, address precision, degeneracy and approximation, because a recognized method can be invalid for the representation it actually receives.

Answer: the method or representation, its premises and why they hold for the supported inputs. Support nonobvious reasoning with the contract, documented semantics, an algorithmic argument or an authoritative reference, and state unresolved limitations. An ordinary adapter justifies its mapping directly.

## Clear and Simple Design

- Use the simplest structure that serves current requirements. Add no layer, option or abstraction for a presumed future need, because each element adds to what callers and maintainers must understand.
- Keep each decision with its owner instead of duplicating policy across paths. Hide changeable details behind meaningful boundaries so a later change stays local.

Answer: the reason for any nonobvious layer, option or separation. Ordinary types and adapters need only their contract.

## Prohibited Implementation Shortcuts

- **Hardcoding:** do not special-case consumers, fixtures, expected answers or measurement results. Contract-defined constants, discriminants and defaults remain legitimate.
- **Monkey patching:** do not replace foreign methods, globals or internals to change their behavior. Use supported extension or injection boundaries.
- **Test-only logic:** do not add production behavior solely to make a test or measurement pass.
- **Chains of workarounds:** do not keep a disproven assumption under compensating wrappers, retries or exceptions. Correct the owning implementation and remove compensations that no longer serve a requirement. A compatibility path is legitimate only for an actual supported difference.

Answer: the basis, in a supported requirement, of each special case, foreign mutation or compensating path actually present, and any unresolved violation. Do not recite prohibitions the declaration has no mechanism for. A passing test or renamed wrapper does not legitimize a compensation, and repair history belongs in the issue.

## Meaningful documentation

- Document public declarations and members with their purpose and the nonobvious facts needed to use them: ownership, units, failure effects and optional-state meaning. Restating names, types and branches adds nothing.
- Apply the documentation skill's writing rules to native comments. Concision never merges different ideas into one paragraph.
- Separate prose from acknowledgment tags with a blank comment line, and documented properties with a blank source line. Properties carry native documentation without checklist acknowledgments.

Answer: the documentation itself. A sentence saying the documentation is useful replaces none of these facts.
