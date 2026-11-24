import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionLegendEntry,
} from "@automovie/interface";
import type {
  IAutoMovieDrawScene,
  IAutoMovieDrawSubject,
} from "@automovie/render";
import type {
  IAutoMovieInspectorScene,
  IAutoMovieInspectorSceneHost,
} from "@automovie/viewer";
import * as THREE from "three";

import { InspectionScene } from "./InspectionScene";

/**
 * Recording doubles for the inspector's scene mount: a host whose frames run
 * when the test says, the renderer it creates, a subject whose creation the
 * test settles, the instance it delivers, and a report that keeps every event.
 * Each counts or keeps what the mount asks of it, so a test asserts the mount's
 * behaviour from these records.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The doubles stand at the mount's own host, subject and report seams, and the instance carries a real three.js scene.
 * @evidence contracts/development/testing.md#independent-expectations The instance's marks are the authored axis and a contact on [1, 1.25) seconds, and the host's size is the literal 640 (settable) by 360.
 * @evidence contracts/development/testing.md#distinguishing-cases The test chooses when frames run, when creation arrives or fails, and whether seeks resolve at once or are held.
 * @evidence contracts/development/testing.md#execution-ownership In-memory doubles; no browser, WebGL or React runs.
 */
export namespace InspectorMountRecording {
  /** A renderer that counts what it is asked to do. */
  export class Renderer implements IAutoMovieInspectorSceneHost.IRenderer {
    /** Whether clipping planes apply, as the mount sets it. */
    public localClippingEnabled: boolean = false;

    /** The tone mapping the mount sets. */
    public toneMapping: THREE.ToneMapping = THREE.NoToneMapping;

    /** The tone mapping exposure the mount sets. */
    public toneMappingExposure: number = 1;

    /** Whether each render clears first, as the mount sets it. */
    public autoClear: boolean = true;

    /** The shadow map's update setting, as the mount sets it. */
    public shadowMap: { autoUpdate: boolean } = { autoUpdate: true };

    /** How many times a frame was rendered. */
    public renders: number = 0;

    /** How many times the renderer was disposed. */
    public disposed: number = 0;

    /** Every size the renderer was given, in order. */
    public readonly sizes: [number, number][] = [];

    /** The render target last set. */
    private target_: THREE.WebGLRenderTarget | null = null;

    /** The render target last set, or `null` for the canvas. */
    public getRenderTarget(): THREE.WebGLRenderTarget | null {
      return this.target_;
    }

    /** Keep the render target. */
    public setRenderTarget(target: THREE.WebGLRenderTarget | null): void {
      this.target_ = target;
    }

    /** Count one render. */
    public render(): void {
      ++this.renders;
    }

    /** Ignore the pixel ratio. */
    public setPixelRatio(): void {}

    /** Keep the size. */
    public setSize(width: number, height: number): void {
      this.sizes.push([width, height]);
    }

    /** Count one disposal. */
    public dispose(): void {
      ++this.disposed;
    }
  }

  /** A host whose frames run when the test says, with a settable size. */
  export class Host implements IAutoMovieInspectorSceneHost {
    /** Every renderer created, in order. */
    public readonly renderers: Renderer[] = [];

    /** The pending frame callbacks by handle. */
    public readonly frames: Map<number, (nowMs: number) => void> = new Map();

    /** The canvas width the host reports, pixels. */
    public width: number = 640;

    /** The next frame handle. */
    private next_: number = 1;

    /** Create and keep a recording renderer. */
    public createRenderer(): Renderer {
      const renderer: Renderer = new Renderer();
      this.renderers.push(renderer);
      return renderer;
    }

    /** Keep the callback until the test runs it. */
    public requestFrame(callback: (nowMs: number) => void): number {
      this.frames.set(this.next_, callback);
      return this.next_++;
    }

    /** Drop the pending callback. */
    public cancelFrame(handle: number): void {
      this.frames.delete(handle);
    }

    /** The settable width by 360 pixels at a pixel ratio of 1. */
    public size(): IAutoMovieInspectorSceneHost.ISize {
      return { width: this.width, height: 360, pixelRatio: 1 };
    }

    /**
     * Run every pending frame at one time, then let every seek they started
     * settle.
     */
    public async run(nowMs: number): Promise<void> {
      const pending: ((nowMs: number) => void)[] = [...this.frames.values()];
      this.frames.clear();
      for (const callback of pending) callback(nowMs);
      await flush();
    }
  }

  /** Two named quads, a permanent axis and a contact with a half-open lifetime. */
  export class Instance implements IAutoMovieDrawScene {
    /** The scene of the two quads, `hero` and `prop`. */
    public readonly scene: THREE.Scene = InspectionScene.scene(
      InspectionScene.quad("hero", -2),
      InspectionScene.quad("prop", 2),
    );

    /** A camera eight metres back on `+Z`. */
    public readonly camera: THREE.PerspectiveCamera =
      new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100);

    /** The frame rate. */
    public readonly fps: number = 30;

    /** The picture width, pixels. */
    public readonly width: number = 640;

    /** The picture height, pixels. */
    public readonly height: number = 360;

    /** The declared mark kinds. */
    public readonly markKinds: readonly string[] = ["contact"];

    /** Every second sought, in order. */
    public readonly seeks: number[] = [];

    /** Whether a seek waits for `settle` instead of resolving at once. */
    public hold: boolean = false;

    /** The resolvers of the held seeks. */
    private held_: (() => void)[] = [];

    /** The instance's duration, seconds. */
    public readonly durationSeconds: number;

    /** The subject whose disposal count this instance raises. */
    private readonly owner_: Subject;

    /**
     * @param durationSeconds The instance's duration, seconds.
     * @param owner The subject whose disposal count this instance raises.
     */
    public constructor(durationSeconds: number, owner: Subject) {
      this.durationSeconds = durationSeconds;
      this.owner_ = owner;
      this.camera.position.set(0, 0, 8);
    }

    /** The axis at every second, and the contact on [1, 1.25) seconds. */
    public marks = (
      seconds: number,
    ): ReturnType<NonNullable<IAutoMovieDrawScene["marks"]>> => [
      InspectionScene.mark("hero/axis", "curve/axis", 0x00a0ff, {
        type: "polyline",
        points: [-2, -1, 0, -2, 1, 0],
        closed: false,
      }),
      ...(seconds >= 1 && seconds < 1.25
        ? [
            InspectionScene.mark("hero/contact", "contact", 0x00c2a8, {
              type: "arrows",
              origins: [-2, 0, 0],
              vectors: [0, 1, 0],
            }),
          ]
        : []),
    ];

    /** Keep the second, and hold the seek while `hold` is set. */
    public seek(seconds: number): Promise<void> {
      this.seeks.push(seconds);
      if (!this.hold) return Promise.resolve();
      return new Promise<undefined>(
        (resolve: (value: undefined) => void): void => {
          this.held_.push((): void => resolve(undefined));
        },
      );
    }

    /** Resolve every held seek and let the mount react. */
    public async settle(): Promise<void> {
      for (const resolve of this.held_.splice(0)) resolve();
      await flush();
    }

    /** Count one disposal on the owning subject. */
    public dispose(): void {
      ++this.owner_.disposed;
    }
  }

  /** A subject whose creation the test settles. */
  export class Subject implements IAutoMovieDrawSubject {
    /** How many of its instances were disposed. */
    public disposed: number = 0;

    /** The instance delivered, once it arrives. */
    public instance: Instance | undefined;

    /** The pending creation's resolver. */
    private settle_: ((instance: Instance) => void) | undefined;

    /** The pending creation's rejecter. */
    private reject_: ((error: Error) => void) | undefined;

    /** @param duration_ The duration of the instance it delivers, seconds. */
    public constructor(private readonly duration_: number) {}

    /** Start a creation the test settles with `arrive` or `fail`. */
    public create(): Promise<Instance> {
      return new Promise<Instance>(
        (
          resolve: (instance: Instance) => void,
          reject: (error: Error) => void,
        ): void => {
          this.settle_ = resolve;
          this.reject_ = reject;
        },
      );
    }

    /** Deliver the instance and let the mount take it. */
    public async arrive(): Promise<void> {
      this.instance = new Instance(this.duration_, this);
      this.settle_!(this.instance);
      await flush();
    }

    /** Fail the creation and let the mount hear it. */
    public async fail(error: Error): Promise<void> {
      this.reject_!(error);
      await flush();
    }
  }

  /** A report that keeps every event. */
  export class Report implements IAutoMovieInspectorScene.IReport {
    /** Every ready report's facts, in order. */
    public readonly facts: IAutoMovieInspectorScene.IFacts[] = [];

    /** Every legend reported, in order. */
    public readonly legends: IAutoMovieInspectionLegendEntry[][] = [];

    /** Every error message reported, in order. */
    public readonly errors: string[] = [];

    /** Every refused request with its message, in order. */
    public readonly refusals: [IAutoMovieCapturePlanRequest, string][] = [];

    /** Keep the facts. */
    public ready(facts: IAutoMovieInspectorScene.IFacts): void {
      this.facts.push(facts);
    }

    /** Keep the legend. */
    public legend(entries: IAutoMovieInspectionLegendEntry[]): void {
      this.legends.push(entries);
    }

    /** Ignore the labels. */
    public labels(): void {}

    /** Keep a reported error; `null` clears nothing. */
    public error(message: string | null): void {
      if (message !== null) this.errors.push(message);
    }

    /** Keep the refused request and its message. */
    public refused(
      request: IAutoMovieCapturePlanRequest,
      message: string,
    ): void {
      this.refusals.push([request, message]);
    }
  }

  /**
   * Let every pending promise reaction run: a macrotask runs after the whole
   * microtask queue drains.
   */
  function flush(): Promise<void> {
    return new Promise<undefined>(
      (resolve: (value: undefined) => void): void => {
        setImmediate((): void => resolve(undefined));
      },
    );
  }
}
