import { auditHouse } from "./auditHouse";
import { Assembly } from "./Assembly";
import { initialState } from "./initialState";
import { type State } from "./State";
import { structure } from "../spaces/structure";
import { envelope } from "../spaces/envelope";
import { garden } from "./site/garden";
import { entry } from "./rooms/entry";
import { flex } from "./rooms/flex";
import { common } from "./rooms/common";
import { powder } from "./rooms/powder";
import { storageGround } from "./rooms/storageGround";
import { primary } from "./rooms/primary";
import { childOne } from "./rooms/childOne";
import { childTwo } from "./rooms/childTwo";
import { corridor } from "./rooms/corridor";
import { bathroom } from "./rooms/bathroom";
import { storageUpper } from "./rooms/storageUpper";
import { serviceUpper } from "./rooms/serviceUpper";
import { auditCanopy } from "./auditCanopy";
import { auditMaterialTextureScale } from "../materials/auditMaterialTextureScale";
import { type MaterialTextureScaleAudit } from "../materials/MaterialTextureScaleAudit";
export function buildHouse(state: State = initialState, report?: (audit: ReturnType<typeof auditCanopy>) => void, materialReport?: (audit: MaterialTextureScaleAudit) => void) {
  const a = new Assembly(state);
  structure(a); envelope(a); garden(a);
  entry(a); flex(a); common(a); powder(a); storageGround(a);
  primary(a); childOne(a); childTwo(a); corridor(a); bathroom(a); storageUpper(a); serviceUpper(a);
  a.environment.walkable = a.environment.surfaces.map((s) => s.surface.id);
  const result = auditHouse(a.environment);
  if (result.errors.length) throw new Error(result.errors.join("\n"));
  const canopy = auditCanopy(a);
  if (canopy.errors.length) throw new Error(canopy.errors.join("\n"));
  report?.(canopy);
  const materialAudit = auditMaterialTextureScale({ models: a.environment.models });
  materialReport?.(materialAudit);
  if (!materialAudit.validation.success)
    throw new Error(materialAudit.validation.violations.map(v => `${v.path}: ${v.expected}`).join("\n"), { cause: materialAudit });
  return a.environment;
}
