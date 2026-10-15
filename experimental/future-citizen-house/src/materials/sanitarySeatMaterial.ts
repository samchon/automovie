/** Native finish recipes
 * The shared constructor supplies only the documented renderer defaults. */
import type { IAutoMovieMaterial } from "@automovie/interface";
import { materialFinish } from "./materialFinish";

/** The toilet seat is resin rather than the old linen colour's textile. */
export function sanitarySeatMaterial(): IAutoMovieMaterial {
  return materialFinish("sanitary-seat", "#e7e6df", .30);
}

