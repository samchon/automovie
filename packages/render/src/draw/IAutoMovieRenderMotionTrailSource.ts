import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieInspectionTrail,
  IAutoMoviePathFrame,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { Object3D } from "three";

import type { IAutoMovieRenderObservePlacedSceneNativeSupport } from "../scene/IAutoMovieRenderObservePlacedSceneNativeSupport";

/** A subject's optional source reading for a selected, settled motion trail. */
export interface IAutoMovieRenderMotionTrailSource {
  /**
   * Read the production's existing authoring and support evidence for one
   * placed object. Return undefined when it provides no source for that node.
   * The sample borrows the placed scene. Read it synchronously without placing
   * another pose or changing its objects.
   */
  read(
    sample: IAutoMovieRenderMotionTrailSource.ISample,
  ): IAutoMovieRenderMotionTrailSource.IObservation | undefined;
}

/** Data supplied across the shared placed trail provider. */
export namespace IAutoMovieRenderMotionTrailSource {
  /** One exact selected object at its settled film and shot clocks. */
  export interface ISample {
    /** Exact film second and the actual placed shot time when present. */
    readonly time: IAutoMovieInspectionDiagnostics.ITime;

    /** Played sequence entry, null when the scene has only a film clock. */
    readonly entry: number | null;

    /** Selected inspection path at that time. */
    readonly path: string;

    /** The actual attached node whose origin the sampler reads. */
    readonly object: Object3D;
  }

  /** The available authoritative channels at the sample. */
  export interface IObservation {
    /**
     * Source-owned route and pace. Keep the same immutable descriptor for a
     * route identity within one played occurrence. A new route starts a new
     * observed segment. A route may contain from two to 1,201 finite points.
     */
    readonly route?: IAutoMovieInspectionTrail.IAuthoredRoute;

    /** Source path baseline at this time, when its producer makes one available. */
    readonly baseline?: IAutoMoviePathFrame;

    /** Source-owned gait phase in cycles, from zero inclusive to one exclusive. */
    readonly phase?: number;

    /** The selected object's actual local forward axis, when known to its owner. */
    readonly forwardAxis?: IAutoMovieVector3;

    /**
     * Immutable identity shared by two placements of a role whose native
     * nodes may be replaced. Supply the same object on both sides only for an
     * authored handoff. The sampler also requires the same played occurrence,
     * measured support anchor and world origin.
     */
    readonly compatibleRemount?: ICompatibleRemount;

    /** Existing placed socket, support and its declared support-local anchor. */
    readonly support?: NonNullable<
      IAutoMovieRenderObservePlacedSceneNativeSupport["sample"]
    >;
  }

  /** The source's identity for one intentionally continuous role handoff. */
  export interface ICompatibleRemount {
    /** The role whose owner reuses this same record across the handoff. */
    readonly role: string;
  }
}
