import * as fs from "node:fs";
import * as path from "node:path";

import type { IAutoMovieScaffoldProps } from "./IAutoMovieScaffoldProps";
import { listAutoMovieScaffoldFiles } from "./listAutoMovieScaffoldFiles";
import { renderAutoMovieLanguageContracts } from "./renderAutoMovieLanguageContracts";
import { renderScaffoldEntries } from "./renderScaffoldEntries";
import { scaffoldAssetDirectory } from "./scaffoldAssetDirectory";
import { AUTOMOVIE_TEMPLATE_VERSIONS } from "./templateVersions";
import {
  validateAutoMovieInstructionDocumentLinks,
  validateAutoMovieSkillRouterLinks,
} from "./validateAutoMovieSkillRouters";

/**
 * Render the bundled scaffold into an in-memory `{ posixPath: content }` map:
 * read every asset, normalize line endings, substitute `{{name}}` and the
 * catalog-resolved `{{version:*}}` tokens, and restore the root pack-safe
 * `_gitignore` stand-in to the installed `.gitignore` identity.
 *
 * The map is deliberately not written to disk here (that is {@link writeFiles}'s
 * job). Callers can inspect the returned candidate or pass it directly to the
 * bounded writer without an intermediate file or persisted project state.
 *
 * @evidenceExclude requirements/agent-authoring/capability-discovery.md#agent-technique-example The base scaffold supplies no example production or executable demonstration.
 * @evidence requirements/agent-authoring/capability-discovery.md#agent-topic-document-discovery Materializes the generated project's routed documentation corpus and its guide entry points.
 * @evidence requirements/agent-authoring/capability-discovery.md#agent-choice-surface-discovery Publishes the scaffold's documented authoring choices and declared capability limits together.
 * @evidence requirements/agent-authoring/capability-discovery.md#agent-diagnostic-discovery Publishes authoring guides that connect diagnostics to the relevant public APIs and source corrections.
 * @evidence requirements/agent-authoring/capability-discovery.md#agent-capability-gap-discovery Ships the contracts that distinguish missing implementation work from an unavailable product capability.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Emits reusable authoring instructions while leaving each production's content in project-owned source.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-extension-compatibility Materializes an editable scaffold whose capability additions remain separate from project-owned content.
 * @evidenceExclude requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-closed-basis Scaffold rendering returns template bytes and does not derive, validate, or publish production artifacts.
 * @evidenceExclude requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-compile-refusal Scaffold rendering returns template bytes and does not derive, validate, or publish production artifacts.
 * @evidenceExclude requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-explicit-generation Scaffold rendering returns template bytes and does not derive, validate, or publish production artifacts.
 * @evidenceExclude requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-portable-publication Scaffold rendering returns template bytes and does not derive, validate, or publish production artifacts.
 * @evidenceExclude requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-provenance-separation Scaffold rendering returns template bytes and does not derive, validate, or publish production artifacts.
 * @evidenceExclude specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-basis Scaffold rendering writes template bytes and implements no derived ledger, basis closure, generation attempt, compile freshness matrix, publication path invariant, or budget boundary.
 * @evidenceExclude specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-freshness Scaffold rendering writes template bytes and implements no derived ledger, basis closure, generation attempt, compile freshness matrix, publication path invariant, or budget boundary.
 * @evidenceExclude specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-generation Scaffold rendering writes template bytes and implements no derived ledger, basis closure, generation attempt, compile freshness matrix, publication path invariant, or budget boundary.
 * @evidenceExclude specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-manifest Scaffold rendering writes template bytes and implements no derived ledger, basis closure, generation attempt, compile freshness matrix, publication path invariant, or budget boundary.
 * @evidenceExclude specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-portability Scaffold rendering writes template bytes and implements no derived ledger, basis closure, generation attempt, compile freshness matrix, publication path invariant, or budget boundary.
 * @evidenceExclude specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-derivation-output-lineage Scaffold materialization returns template bytes and records no production output lineage.
 * @evidenceExclude specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-change-impact-report Scaffold materialization returns template bytes and does not evaluate production source changes or emit an impact report.
 * @evidenceExclude specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-change-impact-invariant Scaffold materialization returns template bytes and does not evaluate production source changes.
 * @evidence requirements/agent-authoring/README.md#에이전트-저작-요구사항 Publishes a portable scaffold whose documentation exposes reusable authoring capabilities.
 * @evidence requirements/product/README.md#제품-계약-요구사항 Materializes reusable AutoMovie capability while leaving production facts in project-owned source.
 * @evidence specifications/authoring-and-authority/README.md#저작과-권한-시스템-명세 Derives editable project source from explicit scaffold identity and pinned inputs.
 * @evidenceExclude requirements/product/authorability.md#product-authoring-choice-space Scaffold materialization does not implement the product authoring choice space requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/knowledge-boundary.md#agent-authoring-api-refusal Scaffold materialization does not implement the agent tool authoring api refusal requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/knowledge-boundary.md#agent-content-supply-refusal Scaffold materialization does not implement the agent tool content supply refusal requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Scaffold materialization does not implement the agent tool contract guidance requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Scaffold materialization does not implement the agent tool host evidence requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/knowledge-boundary.md#agent-no-surprise-external-effects Scaffold materialization does not implement the agent tool no surprise external effects requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/knowledge-boundary.md#agent-provider-neutrality Scaffold materialization does not implement the agent tool provider neutrality requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/partial-work.md#agent-atomic-compilation Scaffold materialization does not implement the agent atomic compilation requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/partial-work.md#agent-declared-omission Scaffold materialization does not implement the agent declared omission requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/partial-work.md#agent-partial-result-control Scaffold materialization does not implement the agent partial result control requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/partial-work.md#agent-partial-verification-scope Scaffold materialization does not implement the agent partial verification scope requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/partial-work.md#agent-partial-work-gap-distinction Scaffold materialization does not implement the agent partial work gap distinction requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/partial-work.md#agent-resumable-authoring Scaffold materialization does not implement the agent resumable authoring requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/roles-and-authorities.md#agent-author-authority Scaffold materialization does not implement the agent author authority requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/roles-and-authorities.md#agent-director-authority Scaffold materialization does not implement the agent director authority requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/roles-and-authorities.md#agent-evidence-producer-authority Scaffold materialization does not implement the agent evidence producer authority requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Scaffold materialization does not implement the agent runtime authority requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/roles-and-authorities.md#agent-user-delegation-authority Scaffold materialization does not implement the agent user delegation authority requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/source-owned-loop.md#agent-change-impact-visibility Scaffold materialization does not implement the agent change impact visibility requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Scaffold materialization does not implement the agent narrowest valid check requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Scaffold materialization does not implement the agent ordinary code authoring requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/source-owned-loop.md#agent-reviewable-source-change Scaffold materialization does not implement the agent reviewable source change requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Scaffold materialization does not implement the agent source result link requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/authorability.md#product-explicit-control Scaffold materialization does not implement the product explicit control requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/authorability.md#product-hidden-inference-refusal Scaffold materialization does not implement the product hidden inference refusal requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/charter.md#product-author-owned-film Scaffold materialization does not implement the product author owned film requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/charter.md#product-reproducible-judgment Scaffold materialization does not implement the product reproducible judgment requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/charter.md#product-structural-output Scaffold materialization does not implement the product structural output requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/choice-and-external-services.md#product-delegation-not-proxy-decision Scaffold materialization does not implement the product delegation not proxy decision requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/choice-and-external-services.md#product-deterministic-external-adoption Scaffold materialization does not implement the product deterministic external adoption requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/choice-and-external-services.md#product-external-substitution-choice Scaffold materialization does not implement the product external substitution choice requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/choice-and-external-services.md#product-provider-neutral-capability Scaffold materialization does not implement the product provider neutral capability requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/extensibility-and-compatibility.md#product-capability-gap Scaffold materialization does not implement the product capability gap requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/extensibility-and-compatibility.md#product-explicit-protocol-change Scaffold materialization does not implement the product explicit protocol change requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/extensibility-and-compatibility.md#product-independent-extension-axes Scaffold materialization does not implement the product independent extension axes requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/extensibility-and-compatibility.md#product-omission-compatibility Scaffold materialization does not implement the product omission compatibility requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/prototype-quality.md#product-authored-variation-determinism Scaffold materialization does not implement the product authored variation determinism requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/prototype-quality.md#product-prototype-geometry Scaffold materialization does not implement the product prototype geometry requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/prototype-quality.md#product-prototype-handoff Scaffold materialization does not implement the product prototype handoff requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/prototype-quality.md#product-prototype-motion-time Scaffold materialization does not implement the product prototype motion time requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/prototype-quality.md#product-prototype-readability Scaffold materialization does not implement the product prototype readability requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/scope-and-exclusions.md#product-content-catalogue-exclusion Scaffold materialization does not implement the product content catalogue exclusion requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/scope-and-exclusions.md#product-detailed-likeness-exclusion Scaffold materialization does not implement the product detailed likeness exclusion requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/scope-and-exclusions.md#product-editor-export-exclusion Scaffold materialization does not implement the product editor export exclusion requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/scope-and-exclusions.md#product-exclusion-reopening Scaffold materialization does not implement the product exclusion reopening requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude requirements/product/scope-and-exclusions.md#product-nondeterministic-completion-exclusion Scaffold materialization does not implement the product nondeterministic completion exclusion requirement; it only publishes reusable project-owned authoring capability.
 * @evidenceExclude specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-agent-input-output Scaffold materialization does not implement the spec authoring agent input output system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Scaffold materialization does not implement the spec authoring authority compatibility system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-violation-failure Scaffold materialization does not implement the spec authoring authority violation failure system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-decision-authority-state Scaffold materialization does not implement the spec authoring decision authority state system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Scaffold materialization does not implement the spec authoring runtime evidence authority invariant system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-user-director-input Scaffold materialization does not implement the spec authoring user director input system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/external-execution-and-provider-neutrality.md#spec-authoring-external-adoption-output Scaffold materialization does not implement the spec authoring external adoption output system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/external-execution-and-provider-neutrality.md#spec-authoring-external-execution-state Scaffold materialization does not implement the spec authoring external execution state system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/external-execution-and-provider-neutrality.md#spec-authoring-external-failure-substitution Scaffold materialization does not implement the spec authoring external failure substitution system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/external-execution-and-provider-neutrality.md#spec-authoring-external-request-output Scaffold materialization does not implement the spec authoring external request output system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/external-execution-and-provider-neutrality.md#spec-authoring-external-selection-input Scaffold materialization does not implement the spec authoring external selection input system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/external-execution-and-provider-neutrality.md#spec-authoring-provider-compatibility Scaffold materialization does not implement the spec authoring provider compatibility system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/external-execution-and-provider-neutrality.md#spec-authoring-provider-source-invariant Scaffold materialization does not implement the spec authoring provider source invariant system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Scaffold materialization does not implement the spec authoring host evidence output system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Scaffold materialization does not implement the spec authoring knowledge request output system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-authoring-invariant Scaffold materialization does not implement the spec authoring tool authoring invariant system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-boundary-compatibility Scaffold materialization does not implement the spec authoring tool boundary compatibility system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-content-side-effect-invariant Scaffold materialization does not implement the spec authoring tool content side effect invariant system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-diagnostic-failure Scaffold materialization does not implement the spec authoring tool diagnostic failure system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-atomic-invariant Scaffold materialization does not implement the spec authoring partial atomic invariant system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-omission-failure Scaffold materialization does not implement the spec authoring partial omission failure system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-result-checkpoint Scaffold materialization does not implement the spec authoring partial result checkpoint system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-resume-compatibility Scaffold materialization does not implement the spec authoring partial resume compatibility system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Scaffold materialization does not implement the spec authoring partial target input system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Scaffold materialization does not implement the spec authoring partial verification invariant system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-work-state Scaffold materialization does not implement the spec authoring partial work state system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-choice-determinism-invariant Scaffold materialization does not implement the spec authoring choice determinism invariant system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-deterministic-input-identity Scaffold materialization does not implement the spec authoring deterministic input identity system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-downstream-fidelity-output Scaffold materialization does not implement the spec authoring downstream fidelity output system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-fidelity-failure-choice Scaffold materialization does not implement the spec authoring fidelity failure choice system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-prototype-exclusion-compatibility Scaffold materialization does not implement the spec authoring prototype exclusion compatibility system responsibility; it only derives the portable editable scaffold.
 * @evidenceExclude specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-structural-output-invariant Scaffold materialization does not implement the spec authoring structural output invariant system responsibility; it only derives the portable editable scaffold.
 * @author Samchon
 *
 * @evidenceExclude requirements/agent-authoring/project-ownership.md#agent-editable-source-authority Rendering produces bytes in memory; which of them a project may then edit is decided by the project that receives them, not here.
 * @evidenceExclude requirements/agent-authoring/project-ownership.md#agent-repository-project-boundary The boundary between reusable capability and one work's facts is drawn by the packages a rendered project depends on, not by the act of rendering the template.
 * @evidenceExclude requirements/agent-authoring/project-ownership.md#agent-project-owned-bytes The template ships no production image, audio, model, or motion assets; their acquisition and ownership belong to the authored project.
 * @evidenceExclude requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Tool replaceability is a property of the rendered project's dependencies and public contracts, which rendering copies rather than decides.
 * @evidenceExclude requirements/agent-authoring/project-ownership.md#agent-ambiguous-ownership-refusal The template carries no authored production assets whose source, license, or digest it could adjudicate.
 * @evidenceExclude specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-system-project-responsibility The split of system and project responsibility is stated by the contracts the template ships, not performed by rendering them.
 * @evidenceExclude specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-state Capability state belongs to the packages a project installs; rendering emits the same bytes whatever those packages can currently do.
 * @evidenceExclude specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-not-content-invariant The invariant is held by what the template contains, which is a harness and no production content; rendering copies that set without deciding it.
 * @evidenceExclude specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-failure-gap Rendering template bytes does not diagnose a production implementation or classify its runtime capability.
 * @evidenceExclude specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Rendering has no production derivation state beyond the scaffold bytes it returns.
 * @evidenceExclude specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-ownership-failure Ownership failures belong to an actual source or file publication boundary; this renderer only returns candidate bytes.
 * @evidenceExclude specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-resume-compatibility Rendering is one in-memory operation with no persisted execution to resume.
 * @evidenceExclude requirements/agent-authoring/project-ownership.md#agent-sandbox-write-boundary Scaffold rendering returns bytes and does not own a repository experiment root or approve sandbox packing and installation.
 * @evidenceExclude specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-sandbox-physical-ownership Rendering template bytes selects no repository experiment root and performs no package packing or installation.
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-transports Copies the authored reference-navigation guidance without registering clients or changing machine-local configuration.
 * @evidenceExclude requirements/agent-authoring/reference-navigation.md#agent-reference-selection Scaffold rendering publishes authoring documentation but installs no MCP provider and executes no reference navigation.
 * @evidenceExclude requirements/agent-authoring/reference-navigation.md#agent-reference-source Scaffold rendering publishes authoring documentation but installs no MCP provider and executes no reference navigation.
 * @evidenceExclude requirements/agent-authoring/reference-navigation.md#agent-reference-bounds Scaffold rendering publishes authoring documentation but installs no MCP provider and executes no reference navigation.
 * @evidenceExclude requirements/agent-authoring/reference-navigation.md#agent-reference-isolation Scaffold rendering publishes authoring documentation but installs no MCP provider and executes no reference navigation.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-transports Copies the authored reference-navigation guidance without registering clients or changing machine-local configuration.
 * @evidenceExclude specifications/authoring-and-authority/reference-navigation.md#spec-reference-selection Scaffold rendering publishes authoring documentation but installs no MCP provider and executes no reference navigation.
 * @evidenceExclude specifications/authoring-and-authority/reference-navigation.md#spec-reference-source Scaffold rendering publishes authoring documentation but installs no MCP provider and executes no reference navigation.
 * @evidenceExclude specifications/authoring-and-authority/reference-navigation.md#spec-reference-bounds Scaffold rendering publishes authoring documentation but installs no MCP provider and executes no reference navigation.
 * @evidenceExclude specifications/authoring-and-authority/reference-navigation.md#spec-reference-isolation Scaffold rendering publishes authoring documentation but installs no MCP provider and executes no reference navigation.
 */
export const renderScaffold = (
  props: IAutoMovieScaffoldProps,
): Record<string, string> => {
  const name = props.name.trim();
  if (name.length === 0) throw new Error("scaffold requires a project name");
  // A trailing space cannot survive `trim`, so refusing one here would be a
  // rule no input can break: such a name is normalized rather than rejected.
  // A trailing dot is not whitespace and reaches this rule intact, which is
  // why only that half of the Windows restriction is stated.
  if (
    name === "." ||
    name === ".." ||
    name.endsWith(".") ||
    /[<>:"/\\|?*\u0000-\u001f]/u.test(name) ||
    /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(name)
  )
    throw new Error(
      `scaffold project name "${name}" must be one portable directory segment`,
    );
  const variables: Record<string, string> = { name, language: props.language };
  for (const [key, value] of Object.entries(AUTOMOVIE_TEMPLATE_VERSIONS))
    variables[`version:${key}`] = value;

  const root = scaffoldAssetDirectory();
  const languageEntries = Object.entries(
    renderAutoMovieLanguageContracts({ language: props.language }),
  ).map(([relative, content]) => ({ content, relative }));
  const files = renderScaffoldEntries(
    [
      ...listAutoMovieScaffoldFiles(root).map((relative) => ({
        content: fs.readFileSync(path.join(root, relative), "utf8"),
        relative,
      })),
      ...languageEntries,
    ],
    variables,
  );
  const instructionSources = Object.entries(files).map(([path, content]) => ({
    path,
    content,
  }));
  validateAutoMovieSkillRouterLinks(instructionSources);
  validateAutoMovieInstructionDocumentLinks(instructionSources, "AGENTS.md");
  return files;
};
