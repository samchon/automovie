import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import {
  AutoMovieProductionFrameCapture,
  IAutoMovieBuildProjectOutput,
} from "@automovie/interface";

import { AutoMovieProductionBuilder } from "./AutoMovieProductionBuilder";
import { AutoMovieProductionOracleService } from "./AutoMovieProductionOracleService";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import {
  findAutoMovieProjectRoot,
  openAutoMovieProduction,
} from "./openAutoMovieProduction";
import type { AutoMovieModelArchetypeRegistry } from "./productionArchetypes";
import type { IAutoMovieProductionContextOptions } from "./IAutoMovieProductionContextOptions";
import { resolveAutoMovieProductionContextOptions } from "./resolveAutoMovieProductionContextOptions";

export type { IAutoMovieProductionContextOptions } from "./IAutoMovieProductionContextOptions";

/**
 * Active services for one resident production repository.
 */
export interface IAutoMovieProductionServices {
  /**
   * Tracked production project.
   */
  project: AutoMovieProductionProject;
  /**
   * Deterministic builder.
   */
  builder: AutoMovieProductionBuilder;
  /**
   * Geometry and actual-frame oracle.
   */
  oracle: AutoMovieProductionOracleService;
  /**
   * Read-only source-gate status.
   *
   * Each call reads the gate's inputs again and runs the gate only when they
   * moved since the last successful answer, so every capture, receipt and
   * commit boundary stays fresh without executing unchanged source again.
   */
  buildStatus: () => IAutoMovieBuildProjectOutput;
}

/**
 * Session context: fixed root and current production services.
 */
export class AutoMovieProductionContext {
  private readonly root: string;
  private readonly services = new Map<string, IAutoMovieProductionServices>();
  private readonly capture: IAutoMovieProductionContextOptions["capture"];
  private readonly defaultProductionId: IAutoMovieProductionContextOptions["productionId"];
  private readonly archetypes: IAutoMovieProductionContextOptions["archetypes"];
  private readonly authoringEvidence: IAutoMovieProductionContextOptions["authoringEvidence"];
  private readonly currentAuthoringEvidence: IAutoMovieProductionContextOptions["currentAuthoringEvidence"];

  /**
   * Open one host-fixed production context.
   *
   * The compile identity a production publishes includes the graph-selected source
   * owner bindings of its authoring evidence, so a context that judges
   * generated freshness without the same declaration reads every compiled
   * production as stale. Hand it the declaration the compile read.
   */
  public constructor(options: IAutoMovieProductionContextOptions);
  /** @deprecated Pass one named IAutoMovieProductionContextOptions record. */
  public constructor(
    capture?: AutoMovieProductionFrameCapture,
    projectRoot?: string,
    productionId?: string,
    archetypes?: AutoMovieModelArchetypeRegistry,
    authoringEvidence?: IAutoMovieProductionEvidence,
    currentAuthoringEvidence?: () => IAutoMovieProductionEvidence,
  );
  public constructor(
    input?: IAutoMovieProductionContextOptions | AutoMovieProductionFrameCapture,
    projectRoot?: string,
    productionId?: string,
    archetypes?: AutoMovieModelArchetypeRegistry,
    authoringEvidence?: IAutoMovieProductionEvidence,
    currentAuthoringEvidence?: () => IAutoMovieProductionEvidence,
  ) {
    const options = resolveAutoMovieProductionContextOptions({ input, legacy: { projectRoot, productionId, archetypes, authoringEvidence, currentAuthoringEvidence } });
    validateProductionId(options.productionId);
    this.root = findAutoMovieProjectRoot(options.projectRoot);
    this.capture = options.capture;
    this.defaultProductionId = options.productionId;
    this.archetypes = options.archetypes;
    this.authoringEvidence = options.authoringEvidence;
    this.currentAuthoringEvidence = options.currentAuthoringEvidence;
  }

  /**
   * Resolve one production under the immutable host root.
   */
  public forProduction(productionId?: string): IAutoMovieProductionServices {
    validateProductionId(productionId);
    const registered = AutoMovieProductionProject.registeredProductionIds(
      this.root,
    );
    let selected = productionId ?? this.defaultProductionId;
    if (selected === undefined) {
      if (registered.length !== 1)
        throw new Error(
          registered.length === 0
            ? "The project has no registered production. Create and compile one through the project API before requesting evidence."
            : `The project has ${registered.length} registered productions. Configure one productionId from: ${registered.join(", ")}.`,
        );
      selected = registered[0]!;
    }
    if (registered.includes(selected) === false)
      throw new Error(
        `Production "${selected}" is not registered. Choose one current productionId from: ${registered.join(", ")}.`,
      );
    const retained = this.services.get(selected);
    if (retained !== undefined) return retained;
    const opened = openAutoMovieProduction({
      projectRoot: this.root,
      productionId: selected,
      capture: this.capture,
      archetypes: this.archetypes,
      authoringEvidence: this.authoringEvidence,
      currentAuthoringEvidence: this.currentAuthoringEvidence,
    });
    this.services.set(opened.project.productionId, opened);
    return opened;
  }
}

const validateProductionId = (productionId: string | undefined): void => {
  if (
    productionId !== undefined &&
    (productionId.trim().length === 0 || productionId.trim() !== productionId)
  )
    throw new Error(
      "Host productionId must be a trimmed non-empty production namespace.",
    );
};
