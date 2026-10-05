import {
  createHumanBodyBasisBuilder,
  createHumanPersonBuilder,
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanPersonBuild,
  type IAutoMovieHumanPersonDocument,
} from "@automovie/human";

import { createHumanSourceAdmissionDocument } from "./createHumanSourceAdmissionDocument.ts";
import type { IHumanSourceAdmissionLog } from "./structures/IHumanSourceAdmissionLog.ts";

/**
 * Admit the P1 pair: the body alone at neutral, the person builder, the
 * neutral person, one person with a body and a face channel set, and one
 * person asking for an endpoint the body lists as unavailable, which the
 * builder must refuse by name.
 */
export function admitHumanSourceP1(log: IHumanSourceAdmissionLog, face: IAutoMovieHumanFaceBasis, body: IAutoMovieHumanBodyBasis): void {
  log.attempt("P1 body neutral", () => {
    const document = { id: "body", name: "body", basis: body.id, shape: {} };
    const before = JSON.stringify(document);
    const build = createHumanBodyBasisBuilder(body)(document);
    return `parts ${build.model.parts.length}; caller unchanged ${before === JSON.stringify(document)}`;
  });
  let buildPerson: ((document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonBuild) | null = null;
  log.attempt("P1 person builder construction", () => {
    buildPerson = createHumanPersonBuilder({ face, body });
    return "constructed";
  });
  const person = (name: string, bodyShape: Record<string, number>, faceShape: Record<string, number>): void =>
    log.attempt(name, () => {
      if (buildPerson === null) throw new Error("person builder unavailable");
      const document = createHumanSourceAdmissionDocument({ face: face.id, body: body.id, bodyShape, faceShape });
      const before = JSON.stringify(document);
      const build = buildPerson(document);
      return `parts ${build.model.parts.length}; caller unchanged ${before === JSON.stringify(document)}`;
    });
  person("P1 person neutral", {}, {});
  person("P1 person macroWeight 0.5 + chinHeight 0.5", { macroWeight: 0.5 }, { chinHeight: 0.5 });
  const unavailable = (body.unavailableTargets ?? []).find((t) => body.channels.some((c) => c.positive === t || c.negative === t));
  const owner = body.channels.find((c) => c.positive === unavailable || c.negative === unavailable);
  if (owner !== undefined)
    person(`P1 person requesting unavailable ${unavailable} through ${owner.id}`, { [owner.id]: owner.positive === unavailable ? owner.maximum : owner.minimum }, {});
}
