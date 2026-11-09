import type { IAutoMovieModelPart } from "@automovie/interface";
import {
  buildModel,
  collectAutoMovieOwnedResources,
  createAutoMovieResourceRetirement,
} from "@automovie/viewer";
import * as THREE from "three";

import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";
import { HumanDebugCurves } from "./HumanDebugCurves";
import { HumanDebugShading } from "./HumanDebugShading";
import type { IHumanDebugSubject } from "./IHumanDebugSubject";

/**
 * One loaded subject on screen: its surface parts through the ordinary `buildModel`, their
 * shading, and its generating curves as tubes, all driven by one options record.
 *
 * The owner adds {@link object} and {@link overlays} to its scene, calls {@link apply} for every
 * options change and {@link dispose} once; dispose releases the built resources, then the subject's
 * texture cache, whose wrappers the built materials only borrow.
 */
export class HumanDebugView {
  /** Surface parts and curve tubes. */
  public readonly object: THREE.Group = new THREE.Group();

  /** Edge and normal overlays in world coordinates. */
  public readonly overlays: THREE.Group;

  /** The subject drawn. */
  public readonly subject: IHumanDebugSubject;

  private readonly shading: HumanDebugShading;
  private readonly curves: HumanDebugCurves;
  private readonly retire: () => Promise<void>;
  private shown: { parts: string[]; curves: string[] } = { parts: [], curves: [] };

  /**
   * Build a subject.
   *
   * @param subject The loaded subject; ownership of its texture cache passes to the view.
   */
  public constructor(subject: IHumanDebugSubject) {
    this.subject = subject;
    const surface: ReturnType<typeof buildModel> = buildModel(subject.model, subject.textures?.resolve);
    const resources: readonly { dispose(): void }[] = collectAutoMovieOwnedResources(surface.object);
    const close: () => Promise<void> = createAutoMovieResourceRetirement(
      resources.map((resource: { dispose(): void }): (() => void) => (): void => resource.dispose()),
    );
    this.shading = new HumanDebugShading(surface.parts);
    this.curves = new HumanDebugCurves(subject.curves);
    this.overlays = this.shading.overlays;
    this.retire = createAutoMovieResourceRetirement([
      (): void => this.shading.dispose(),
      (): void => this.curves.dispose(),
      close,
      async (): Promise<void> => {
        await subject.textures?.dispose();
      },
    ]);
    this.object.add(surface.object, this.curves.object);
    this.object.updateMatrixWorld(true);
  }

  /**
   * Show the subject as the options say.
   *
   * @param options Frame options.
   * @returns Ids of the shown parts and curves.
   */
  public apply(options: IHumanDebugOptions): { parts: string[]; curves: string[] } {
    const extra: IHumanDebugDocument.ICurve[] = this.subject.prepareCurves?.(options, this.subject.curves.map((curve: IHumanDebugDocument.ICurve): string => curve.id)) ?? [];
    if (extra.length !== 0) {
      this.subject.curves.push(...extra);
      this.curves.extend(extra);
    }
    this.object.updateMatrixWorld(true);
    this.shown = { parts: this.shading.apply(options), curves: this.curves.apply(options) };
    return this.shown;
  }

  /**
   * The box the camera frames: the `focus` parts, else every shown part, else every shown curve.
   *
   * @param options Frame options; `focus` is read.
   * @returns The box in metres; empty when nothing is shown.
   */
  public focus(options: IHumanDebugOptions): THREE.Box3 {
    const parts: THREE.Box3 = this.shading.bounds(options.focus);
    if (!parts.isEmpty()) return parts;
    return options.focus.length === 0 ? this.curves.bounds() : parts;
  }

  /**
   * Label anchors of the curves the options label.
   *
   * @param options Frame options.
   */
  public labels(options: IHumanDebugOptions): ReturnType<HumanDebugCurves["labels"]> {
    return this.curves.labels(options);
  }

  /** Every part and curve id in subject order. */
  public inventory(): { parts: string[]; curves: string[] } {
    return {
      parts: this.subject.model.parts.map((part: IAutoMovieModelPart): string => part.id),
      curves: this.subject.curves.map((curve: IHumanDebugDocument.ICurve): string => curve.id),
    };
  }

  /** Ids shown by the latest apply. */
  public visible(): { parts: string[]; curves: string[] } {
    return { parts: [...this.shown.parts], curves: [...this.shown.curves] };
  }

  /** Detach and release every resource once. */
  public async dispose(): Promise<void> {
    this.object.removeFromParent();
    this.overlays.removeFromParent();
    await this.retire();
  }
}
