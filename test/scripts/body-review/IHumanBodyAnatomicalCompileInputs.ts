import type { AutoMovieHumanBodyPartId } from "@automovie/human/body/anatomy/identity/AutoMovieHumanBodyPartId";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanBodyLayerThicknessField } from "@automovie/human/body/anatomy/layer/IAutoMovieHumanBodyLayerThicknessField";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanPersonDocument } from "@automovie/human/human/structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import type { IHumanBodyAnatomicalCompilePlan } from "./IHumanBodyAnatomicalCompilePlan";

/** Exact admitted source inputs and the independently registered candidate. @author Samchon */
export interface IHumanBodyAnatomicalCompileInputs {
  /** Actual source preparation and source-registration plan. */
  plan: IHumanBodyAnatomicalCompilePlan;

  /** Original typed head view. */
  head: IAutoMovieHumanPersonHeadView;

  /** Original typed body view. */
  body: IAutoMovieHumanPersonBodyView;

  /** Original immutable anatomical assembly. */
  originalAssembly: IAutoMovieHumanBodyAnatomicalAssembly;

  /** Same assembly addressed to the derived body basis. */
  assembly: IAutoMovieHumanBodyAnatomicalAssembly;

  /** Derived body that preserves original exterior and rig payloads. */
  candidate: IAutoMovieHumanBodyBasis;

  /** Parsed canonical document after actual serialization round trip. */
  document: IAutoMovieHumanPersonDocument;

  /** Exact original assembly bytes whose digest identifies publication. */
  assemblyBytes: Uint8Array;

  /** Complete original preparation refusal population, never discarded. */
  sourceRefusals: unknown[];

  /** Optional original native-indexed tissue thickness field. */
  layerField: IAutoMovieHumanBodyLayerThicknessField | undefined;

  /** Exact field bytes identity when supplied. */
  layerFieldSha256: string | undefined;

  /** Original body's native triangle indices. */
  skinIndices: readonly number[];

  /** Authoritative closed identity population admitted by the source owner. */
  declared: ReadonlySet<AutoMovieHumanBodyPartId>;

  /** Actual source part identities, preserving source order. */
  ids: AutoMovieHumanBodyPartId[];

  /** Exact derived registration identity recorded in output receipts. */
  candidateId: string;
}
