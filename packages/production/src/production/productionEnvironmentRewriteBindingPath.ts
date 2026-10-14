
import type { IProductionEnvironmentBindingAddress as IBindingAddress } from "./IProductionEnvironmentBindingAddress";

/**
 * Translate an engine fold path from local validator input to authored program positions.
 *
 * A single-record root prefixes its program list/index to the remaining suffix. Otherwise the first ASCII field/index carrier is remapped through the supplied index list, preserving the nested suffix. Root wins when both forms are present; missing field/index mappings retain local spelling.
 *
 * @evidence contracts/common.md#principled-implementation buildingBoundDiagnostics supplies engine-generated $input paths and maps from filtered lists to their original zero-based positions. This is a restricted carrier translation, not general JSON-pointer parsing or arbitrary path admission.
 * @evidence contracts/common.md#clear-and-simple-design One path translator serves multi-list water/cloth/planting and single-record network/domain validators, leaving addresses beside their invoking fold.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing mapping falls back to the local index rather than validating map completeness. Nonstandard prefixes and unsafe numeric index text are not independently refused; actual callers rely on engine-generated finite array indices.
 * @evidence contracts/common.md#meaningful-documentation Documents root precedence, restricted carrier grammar, suffix preservation and fallback/input limitations.
 * @evidence contracts/performance.md#efficient-algorithms Regex matching and slicing allocate text proportional to path/suffix length; field and index lookups are direct and no program list is rescanned by this translator.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller-created index mapping is reused for every finding from that validator invocation; no mapping or translated path is retained across changed program populations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only translated text transfers to the finding; address/index arrays remain invocation-owned, with no file handle or running task.
 */
export function productionEnvironmentRewriteBindingPath(
  path: string,
  address: IBindingAddress
): string {
  const inside: string = path.slice("$input".length);
  if (address.root !== undefined)
    return `$program.${address.root.key}[${address.root.index}]${inside}`;
  const matched: RegExpExecArray | null = /^\$input\.([A-Za-z]+)\[(\d+)\]/u.exec(path);
  if (matched === null) return `$program${inside}`;
  const field: NonNullable<IBindingAddress["fields"]>[string] | undefined = address.fields?.[matched[1]!];
  if (field === undefined) return `$program${inside}`;
  const local: number = Number(matched[2]);
  return `$program.${field.key}[${field.indices[local] ?? local}]${path.slice(matched[0].length)}`;
}
