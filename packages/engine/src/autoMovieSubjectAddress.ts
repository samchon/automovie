/**
 * The stable address of one stored subject, as subject description and diff
 * spell it.
 *
 * Addresses are `prototype:<model>`, `prototype-part:<model>/<part>`,
 * `element:<node>`, `element-part:<node>/<part>`, `instance-set:<set>`,
 * `space:<environment>/<space>` and `building:<environment>/<building>`, where
 * a built element's node is `<environment>/<element>`. Ids are inserted
 * verbatim and not escaped, so an id containing `/` can make two subjects of
 * one kind spell the same address; nothing here detects that. Single
 * instances carry their own address form, `autoMovieInstanceAddress`, because
 * it depends on the set's layout.
 *
 * @param subject The subject kind followed by the ids that name it, in the
 *   order the address spells them.
 * @returns The subject's address.
 *
 * @evidence contracts/common.md#principled-implementation A kind prefix followed by the owning ids is a total, deterministic spelling of each stored subject, which is all an address needs to be stable across revisions; the collision case for ids carrying separators is stated rather than escaped, because escaping would change every published address.
 * @evidence contracts/common.md#clear-and-simple-design One owner for the address grammar, read by subject description and by the structural diff, which previously rebuilt `prototype-part:`, `instance-set:`, `space:` and `building:` strings inline; the tuple parameter fixes each kind's id count at compile time.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or id is special-cased; each kind has one fixed form.
 * @evidence contracts/common.md#meaningful-documentation The documentation lists every form, how a built element's node is spelled, the verbatim insertion and its collision consequence, and where instance addresses live.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant work per call, one string template, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure formatter of one subject that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the returned string and retains nothing.
 */
export const autoMovieSubjectAddress = (
  ...subject:
    | [kind: "prototype", model: string]
    | [kind: "prototype-part", model: string, part: string]
    | [kind: "element", node: string]
    | [kind: "element-part", node: string, part: string]
    | [kind: "instance-set", set: string]
    | [kind: "space", environment: string, space: string]
    | [kind: "building", environment: string, building: string]
): string => `${subject[0]}:${subject.slice(1).join("/")}`;
