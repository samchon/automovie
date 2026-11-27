import {
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftCompliance,
  IAutoMovieSoftContact,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { validateSoftNumeric as numeric } from "./validateSoftNumeric";

/*
 * Admit a domain's compliance and contact: every compliance finite and not
 * negative, the thickness finite and positive, the friction finite and not
 * negative; and, when a cord asks for self-collision, a step that cannot carry
 * a segment past another unseen.
 *
 * A cord's self-contact is found at the end of a step, so a segment that
 * travels farther than the cord's radius in one step can pass through another
 * between two checks. The domain's declared design speed bounds the travel:
 * `fixedStepSeconds * referenceSpeed <= thickness` is required, the same
 * declared-speed premise the structural travel number rests on. Self collision
 * is evaluated only on a cord, a one-wide lattice; a sheet that asks for it is
 * refused, since the solver does not evaluate cloth on cloth.
 * Parameter out: The collector the domain's validation writes to.
 * Parameter root: The domain's path.
 * Parameter domain: The domain.
 */
export function validateSoftCompliance(
  out: IAutoMovieViolationCollector,
  root: string,
  domain: IAutoMovieSoftBodyDomain,
): void {
  const compliance: IAutoMovieSoftCompliance | null =
    domain.solver.compliance ?? null;
  if (compliance !== null)
    for (const family of ["structural", "shear", "bend"] as const)
      numeric(
        out,
        `${root}.solver.compliance.${family}`,
        `${family} compliance`,
        compliance[family],
        0,
        false,
        Infinity,
      );
  const contact: IAutoMovieSoftContact | null = domain.contact ?? null;
  if (contact !== null) {
    numeric(
      out,
      `${root}.contact.thickness`,
      "contact thickness",
      contact.thickness,
      0,
      true,
      Infinity,
    );
    numeric(
      out,
      `${root}.contact.friction`,
      "contact friction",
      contact.friction,
      0,
      false,
      Infinity,
    );
  }
  if (!domain.selfCollision || contact === null) return;
  const cord: boolean =
    domain.lattice.columns === 1 || domain.lattice.rows === 1;
  if (!cord) {
    out.push(
      "type",
      `${root}.selfCollision`,
      "self-collision is evaluated only on a cord, a one-wide lattice",
      domain.selfCollision,
    );
    return;
  }
  const travel: number =
    domain.solver.fixedStepSeconds * domain.solver.referenceSpeed;
  if (travel > contact.thickness)
    out.push(
      "range",
      `${root}.solver.fixedStepSeconds`,
      `a cord's segment may not travel further than its radius in one step: fixedStepSeconds·referenceSpeed <= thickness (${contact.thickness}), but travels ${travel}`,
      domain.solver.fixedStepSeconds,
      travel - contact.thickness,
    );
}
