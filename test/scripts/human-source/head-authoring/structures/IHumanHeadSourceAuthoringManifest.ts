import type { IHumanHeadSourceInputEntry } from "./IHumanHeadSourceInputEntry.ts";

/** Exact source-byte authority for formulas, numerical recipes and ancestral profiles.
 * A completed component publication may own this manifest; normal generation
 * authority remains with the subsequent source compiler.
 * @author Samchon
 */
export interface IHumanHeadSourceAuthoringManifest {
  schema: "automovie-canonical-head-authoring-inputs/1";

  /** Stable source-authoring identity, independent of output locators. */
  sourceId: string;

  /** Native Blender metres, +X left, +Z up and -Y anterior. */
  frame: string;

  /** Optional common completed component publication authority. */
  publication?: string;

  /** Role-addressed numerical recipe inputs. */
  recipe: Record<string, IHumanHeadSourceInputEntry>;

  /** Role-addressed ancestral source profiles. */
  profiles: Record<string, IHumanHeadSourceInputEntry>;

  /** Complete maintained production/input population admitted before evaluation. */
  files: IHumanHeadSourceInputEntry[];

  /** Authored source and unavailable clinical qualification. */
  qualification?: string;
}
