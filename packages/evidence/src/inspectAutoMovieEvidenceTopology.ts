import type { IAutoMovieEvidenceTopologyBranch } from "./IAutoMovieEvidenceTopologyBranch";
import type { IAutoMovieEvidenceTopologyEdge } from "./IAutoMovieEvidenceTopologyEdge";
import type { IAutoMovieEvidenceTopologyDeclaration } from "./IAutoMovieEvidenceTopologyDeclaration";
import type { IAutoMovieEvidenceTopologyDiagnostic } from "./IAutoMovieEvidenceTopologyDiagnostic";
import { compareCodeUnits } from "./compareCodeUnits";


/**
 * Inspects an account-owned foundation topology against its canonical matrix.
 *
 * @author Samchon
 *
 *
 * @evidence contracts/common.md#principled-implementation Maps keyed by declared branch and provider-consumer identity compare account relationships against the canonical matrix and explicit authoring order.
 * @evidence contracts/common.md#clear-and-simple-design One inspector returns structural diagnostics while the account author owns the semantic truth of each nonempty reason.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Disabled residue, duplicates, unknown branches and wrong order remain diagnostics rather than being repaired; duplicate canonical branch or matrix keys currently use Map last-entry semantics.
 * @evidence contracts/common.md#meaningful-documentation The result type names deterministic defect categories and accountable branch addresses; empty reason admission is structural, not prose quality judgment.
 * @evidence contracts/performance.md#efficient-algorithms For B branches, E expected edges and D declarations, map passes cost expected O(B+E+D), followed by O(K log K) sorting of K diagnostics.
 * @evidence contracts/performance.md#reuse-equivalent-work Branch, expected-edge and declaration maps each serve all comparisons for this one supplied topology; no cache assumes later declarations are equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only diagnostics escape; call-local maps retain supplied records until completion and acquire no filesystem resources.
 */
export function inspectAutoMovieEvidenceTopology(props: {
  branches: readonly IAutoMovieEvidenceTopologyBranch[];
  expected: readonly IAutoMovieEvidenceTopologyEdge[];
  declarations: readonly IAutoMovieEvidenceTopologyDeclaration[];
}): readonly IAutoMovieEvidenceTopologyDiagnostic[] {
  const diagnostics: IAutoMovieEvidenceTopologyDiagnostic[] = [];
  const branches: Map<string, IAutoMovieEvidenceTopologyBranch> = new Map(
    props.branches.map((branch: IAutoMovieEvidenceTopologyBranch) : [string, IAutoMovieEvidenceTopologyBranch] => [branch.name, branch]),
  );
  const expected: Map<string, IAutoMovieEvidenceTopologyEdge> = new Map(
    props.expected.map((edge: IAutoMovieEvidenceTopologyEdge) : [string, IAutoMovieEvidenceTopologyEdge] => [
      identity(edge.provider, edge.consumer),
      edge,
    ]),
  );
  const declarations: Map<string, IAutoMovieEvidenceTopologyDeclaration> = new Map<string, IAutoMovieEvidenceTopologyDeclaration>();
  for (const declaration of props.declarations) {
    const key: string = identity(declaration.provider, declaration.consumer);
    const previous: IAutoMovieEvidenceTopologyDeclaration | undefined = declarations.get(key);
    if (previous !== undefined) {
      diagnostics.push(
        diagnostic(
          "duplicate-declaration",
          declaration,
          `${key} is declared more than once.`,
        ),
      );
      continue;
    }
    declarations.set(key, declaration);
    const provider: IAutoMovieEvidenceTopologyBranch | undefined = branches.get(declaration.provider);
    const consumer: IAutoMovieEvidenceTopologyBranch | undefined = branches.get(declaration.consumer);
    if (provider === undefined || consumer === undefined) {
      diagnostics.push(
        diagnostic(
          "unknown-branch",
          declaration,
          `${key} names a branch outside the selected topology.`,
        ),
      );
      continue;
    }
    if (declaration.reason.trim() === "")
      diagnostics.push(
        diagnostic(
          "invalid-reason",
          declaration,
          `${key} requires a non-empty semantic reason.`,
        ),
      );
    const edge: IAutoMovieEvidenceTopologyEdge | undefined = expected.get(key);
    if (edge === undefined)
      diagnostics.push(
        diagnostic(
          "extra-provider",
          declaration,
          `${declaration.provider} is not a foundation of ${declaration.consumer}.`,
        ),
      );
    if ((!provider.active || !consumer.active) && declaration.status === "uses")
      diagnostics.push(
        diagnostic(
          "disabled-residue",
          declaration,
          `${key} remains positive while one of its branches is disabled.`,
        ),
      );
    if (
      declaration.status === "uses" &&
      provider.active &&
      consumer.active &&
      provider.order >= consumer.order &&
      !(edge?.simultaneous === true && provider.order === consumer.order)
    )
      diagnostics.push(
        diagnostic(
          "wrong-order",
          declaration,
          `${declaration.provider} must be reviewed before ${declaration.consumer}.`,
        ),
      );
  }
  for (const edge of props.expected) {
    const provider: IAutoMovieEvidenceTopologyBranch | undefined = branches.get(edge.provider);
    const consumer: IAutoMovieEvidenceTopologyBranch | undefined = branches.get(edge.consumer);
    const declaration: IAutoMovieEvidenceTopologyDeclaration | undefined = declarations.get(
      identity(edge.provider, edge.consumer),
    );
    if (provider === undefined || consumer === undefined) {
      if (declaration === undefined)
        diagnostics.push(
          diagnostic(
            "unknown-branch",
            edge,
            `${identity(edge.provider, edge.consumer)} names a branch outside the selected topology.`,
          ),
        );
      continue;
    }
    if (
      declaration === undefined ||
      (provider.active && consumer.active && declaration.status !== "uses")
    )
      diagnostics.push(
        diagnostic(
          "missing-consumer",
          edge,
          declaration === undefined
            ? `${edge.consumer} does not declare foundation ${edge.provider} as used or inapplicable.`
            : `${edge.consumer} does not account for active foundation ${edge.provider}.`,
        ),
      );
  }
  return diagnostics.sort((left: IAutoMovieEvidenceTopologyDiagnostic, right: IAutoMovieEvidenceTopologyDiagnostic) : number =>
    compareCodeUnits(
      `${left.consumer}\0${left.provider}\0${left.code}`,
      `${right.consumer}\0${right.provider}\0${right.code}`,
    ),
  );
}


const identity: (provider: string, consumer: string) => string = (provider: string, consumer: string): string =>
  `${provider}->${consumer}`;

const diagnostic: (code: IAutoMovieEvidenceTopologyDiagnostic["code"], edge: Pick<IAutoMovieEvidenceTopologyEdge, "consumer" | "provider">, message: string) => IAutoMovieEvidenceTopologyDiagnostic = (
  code: IAutoMovieEvidenceTopologyDiagnostic["code"],
  edge: Pick<IAutoMovieEvidenceTopologyEdge, "consumer" | "provider">,
  message: string,
): IAutoMovieEvidenceTopologyDiagnostic => ({
  code,
  consumer: edge.consumer,
  provider: edge.provider,
  message,
});
