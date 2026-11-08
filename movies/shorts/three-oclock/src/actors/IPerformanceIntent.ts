import type * as THREE from "three";

import type { evaluateExchange } from "./evaluateExchange";

/**
 * Scene-owned clinical and contact intentions for the remaining encounter.
 *
 * @evidence contracts/common.md#implementation-and-ownership Extends the original world-metre root/feet and public clinical pose with grip weight, desired hand-frame directions and requested events. Intent is not ownership: only measured skin/paper contact may attach, receive or release the sheet, and the measured shared contact owns stopping/recovery. No package-level motion catalogue or second rig is introduced.
 * @evidence contracts/common.md#authoring-interface World vectors and absolute scene seconds share the original actor frame. gripWeight is bounded0open–1closed; requested events are permissions for the scene's actual geometry gates, not fabricated successful timestamps. Implementations remain separately inspected before assembly.
 */
export type IPerformanceIntent = ReturnType<typeof evaluateExchange> & {
  gripWeight: number;
  rightNormal?: THREE.Vector3;
  rightLongAxis?: THREE.Vector3;
  rightNormalWeight?: number;
  rightNormalPolicy?: "essential" | "preferred";
  rightHandRole?: "carry" | "free";
  rightReach?: { towards: THREE.Vector3; fraction: number; weight: number };
  rightSeedFrom?: { seconds: number; blend: number };
  bendAmount: number;
  requests: ("release" | "pickup" | "receive" | "give")[];
};
