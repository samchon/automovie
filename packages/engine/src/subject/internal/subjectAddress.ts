/*
 * The stable address of one stored subject, as subject description and diff
 * spell it.
 *
 * Addresses are `prototype:<model>`, `prototype-part:<model>/<part>`,
 * `element:<node>`, `element-part:<node>/<part>`, `instance-set:<set>`,
 * `space:<environment>/<space>` and `building:<environment>/<building>`, where
 * a built element's node is `<environment>/<element>`. Ids are inserted
 * verbatim and not escaped, so an id containing `/` can make two subjects of
 * one kind spell the same address; nothing here detects that. Single instances
 * carry their own address form, `instanceAddress`, because it depends
 * on the set's layout.
 * Parameter subject: The subject kind followed by the ids that name it, in the
 * order the address spells them.
 * Returns: The subject's address.
 */
export const subjectAddress = (
  ...subject:
    | [kind: "prototype", model: string]
    | [kind: "prototype-part", model: string, part: string]
    | [kind: "element", node: string]
    | [kind: "element-part", node: string, part: string]
    | [kind: "instance-set", set: string]
    | [kind: "space", environment: string, space: string]
    | [kind: "building", environment: string, building: string]
): string => `${subject[0]}:${subject.slice(1).join("/")}`;
