import type { IHousePart } from "../../types/IHousePart";
import { IExteriorZone } from "./IExteriorZone";

/** What a site owner emits: its zones and its solids. */

export interface ISiteBuild {
  /** Outdoor zones the site part declares. */
  zones: IExteriorZone[];
  /** Parts the site part owns. */
  parts: IHousePart[];
}
