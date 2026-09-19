import { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";

/**
 * Shared by setHumanFaceDetail, setHumanFaceHairLayerDetail, which were one file until each public identity took its own.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Connects numerical sliders to actual detailed shape settings.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Provides field meaning, applied-value inspection and anatomical attachment context.
 * @author Samchon
 */
export function writeDetail(
  next: IAutoMovieHumanFaceDocument,
  path: readonly string[],
  value: number | undefined,
): IAutoMovieHumanFaceDocument {
  let object = next as unknown as Record<string, unknown>;
  const ancestors: { object: Record<string, unknown>; key: string }[] = [];
  for (const key of path.slice(0, -1)) {
    if (object[key] === undefined) {
      if (value === undefined) return next;
      object[key] = {};
    } else {
      // structuredClone preserves aliases. Detach only the containers on this
      // path so a selected side/layer cannot also edit its basis or sibling.
      const child = object[key] as Record<string, unknown> | unknown[];
      object[key] = Array.isArray(child) ? [...child] : { ...child };
    }
    ancestors.push({ object, key });
    object = object[key] as Record<string, unknown>;
  }
  const key = path[path.length - 1];
  if (value === undefined) {
    if (!Object.hasOwn(object, key)) return next;
    delete object[key];
    for (const parent of ancestors.reverse()) {
      if (Object.keys(object).length !== 0) break;
      delete parent.object[parent.key];
      object = parent.object;
    }
  } else object[key] = value;
  return next;
}
