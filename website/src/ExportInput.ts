import type { AncientSource } from "./AncientSource";
import type { ModernSource } from "./ModernSource";
import type { FutureSource } from "./FutureSource";

/** Building identity paired with that production's native camera transport; the exporter retains the supplied native object. */
export type ExportInput =
  | { building: "ancient"; native: AncientSource }
  | { building: "modern"; native: ModernSource }
  | { building: "future"; native: FutureSource };
