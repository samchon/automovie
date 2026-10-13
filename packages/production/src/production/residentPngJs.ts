import { createRequire } from "node:module";
import type { PNG } from "pngjs";

/** Installed PNG module shape; type-only PNG reference acquires no codec. */
interface IPngModule { PNG: typeof PNG; }

const load: ReturnType<typeof createRequire> = createRequire(__filename);
let png: IPngModule | undefined;

/**
 * Load the installed pngjs module on first actual use and retain that one module value.
 *
 * @evidence contracts/common.md#principled-implementation Node createRequire resolves pngjs from this production directory; nullish assignment stores a successful first load while failed loads leave the slot undefined.
 * @evidence contracts/common.md#clear-and-simple-design PNG inspection and preview/subject-image consumers share one lazy module owner; importing the compatibility barrel alone does not invoke its loader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The cached module is not a parsed-image answer or a proof of later on-disk identity. Resident generation sealing belongs to its separate owner, and there is no foreign loader/cache mutation here.
 * @evidence contracts/common.md#meaningful-documentation Documents lazy load, shared module lifetime, load-failure propagation and the distinction from per-input decoding.
 * @evidence contracts/performance.md#efficient-algorithms First use pays Node resolution and transitive module initialization cost; later calls return the cached reference in fixed work, while image parsing remains each consumer's cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Only successful module loading is shared. Mutable PNG bytes are independently inspected and decoded, and no input-path or image-result cache is supplied.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One module slot and its Node module-cache closure persist for process lifetime without explicit retirement; this helper opens no per-image file, worker or GPU handle.
 *
 * @author Samchon
 */
export function residentPngJs(): IPngModule {
  return (png ??= load("pngjs") as IPngModule);
}
