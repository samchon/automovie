/**
 * A validator's field list made complete by the compiler: the fields it admits
 * of an interface, typed as that interface's keys, and the fields it leaves to
 * ordinary solving, so that a field the interface gains is a type error until
 * the validator classifies it. The interface stays the one owner of its
 * fields.
 */
export namespace HumanFields {
  /**
   * The fields of `T` that neither list names: `never` while the lists are
   * complete.
   */
  export type Unlisted<
    T,
    Admitted extends keyof T,
    Excluded extends keyof T,
  > = Exclude<keyof T, Admitted | Excluded>;

  /**
   * The admitted fields as a set, accepted by the compiler only when the
   * validator lists every field of its interface (`Missing` is `never`).
   *
   * @param fields The admitted fields, as the interface names them.
   * @param _complete Nothing: its type names the unlisted fields, which must be
   *   none.
   * @returns The admitted field names.
   */
  export function admitted<T, Missing extends never>(
    fields: readonly (keyof T & string)[],
    ..._complete: Missing[]
  ): ReadonlySet<string> {
    return new Set<string>(fields);
  }
}
