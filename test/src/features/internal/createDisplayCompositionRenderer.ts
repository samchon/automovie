import * as THREE from "three";

/**
 * One native compositor draw, retaining the selected target by object identity.
 * @author Samchon
 */
interface IDisplayCompositionRecord {
  target: THREE.WebGLRenderTarget | null;
  face: number;
  mip: number;
  alpha: number;
  fade: boolean;
  backing: boolean;
  srgb: boolean;
  viewport: number[];
  scissor: number[];
  scissorTest: boolean;
}

/**
 * Configured raster state and its effective pixel rectangles; target is a local scalar identity.
 * @author Samchon
 */
interface IDisplayCompositionSnapshot {
  target: number | null;
  face: number;
  mip: number;
  autoClear: boolean;
  color: number;
  alpha: number;
  viewport: number[];
  scissor: number[];
  scissorTest: boolean;
  currentViewport: number[];
  currentScissor: number[];
  currentScissorTest: boolean;
}

/**
 * Existing controls and observations borrowed by portable display tests.
 * @author Samchon
 */
interface IDisplayCompositionResult {
  renderer: THREE.WebGLRenderer;
  copied: THREE.FramebufferTexture[];
  rendered: IDisplayCompositionRecord[];
  size: THREE.Vector2;
  calls: string[];
  errors: Map<string, unknown>;
  nativeEncoding: { value: number };
  nativeWebGL2: { value: boolean };
  nativeFramebufferStatus: { value: number };
  nativeComponent: { value: number };
  nativeChannelBits: { value: unknown[] };
  nativeColourConstants: Map<string, unknown>;
  state: () => IDisplayCompositionSnapshot;
}

/**
 * In-memory renderer controls for display-compositor orchestration only.
 * Copies and shader uniforms are observable; supplied context responses do not establish pixel, tone-mapping or GPU equivalence. Failure inputs name the actual operation.
 * State comparison assigns native targets scalar object identities rather than traversing their cyclic texture and attachment ownership graphs. The caller owns native targets and compositor disposal.
 */
export function createDisplayCompositionRenderer(
  width: number = 64,
  height: number = 32,
  attributes: WebGLContextAttributes | null = {
    antialias: true,
    premultipliedAlpha: true,
  },
): IDisplayCompositionResult {
  const size: THREE.Vector2 = new THREE.Vector2(width, height);
  let target: THREE.WebGLRenderTarget | null = null;
  let autoClear: boolean = true;
  let toneMapping: THREE.ToneMapping = THREE.ACESFilmicToneMapping;
  let exposure: number = 1.5;
  let color: THREE.Color = new THREE.Color(0x336699),
    alpha: number = 0.4;
  let face: number = 0,
    mip: number = 0,
    pixelRatio: number = 1,
    viewport: THREE.Vector4 = new THREE.Vector4(0, 0, width, height),
    scissor: THREE.Vector4 = new THREE.Vector4(0, 0, width, height),
    scissorTest: boolean = false;
  let currentViewport: THREE.Vector4 = viewport.clone(),
    currentScissor: THREE.Vector4 = scissor.clone(),
    currentScissorTest: boolean = scissorTest;
  const nativeEncoding: { value: number } = { value: 0x2601 };
  const nativeWebGL2: { value: boolean } = { value: true };
  const nativeFramebufferStatus: { value: number } = { value: 0x8cd5 };
  const nativeComponent: { value: number } = { value: 0x8c17 };
  const nativeChannelBits: { value: unknown[] } = { value: [8, 8, 8, 8] };
  const nativeColourConstants: Map<string, unknown> = new Map<string, unknown>([
    ["FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE", 0x8211],
    ["FRAMEBUFFER_ATTACHMENT_RED_SIZE", 0x8212],
    ["FRAMEBUFFER_ATTACHMENT_GREEN_SIZE", 0x8213],
    ["FRAMEBUFFER_ATTACHMENT_BLUE_SIZE", 0x8214],
    ["FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE", 0x8215],
    ["UNSIGNED_NORMALIZED", 0x8c17],
  ]);
  const targetIdentities: WeakMap<THREE.WebGLRenderTarget, number> =
    new WeakMap<THREE.WebGLRenderTarget, number>();
  let nextTargetIdentity: number = 0;
  const targetIdentity: () => number | null = (): number | null => {
    if (target === null) return null;
    const previous: number | undefined = targetIdentities.get(target);
    if (previous !== undefined) return previous;
    const identity: number = nextTargetIdentity++;
    targetIdentities.set(target, identity);
    return identity;
  };
  const copied: THREE.FramebufferTexture[] = [];
  const rendered: IDisplayCompositionRecord[] = [];
  const errors: Map<string, unknown> = new Map<string, unknown>();
  const calls: string[] = [];
  const perform: (name: string) => void = (name: string): void => {
    calls.push(name);
    if (errors.has(name)) throw errors.get(name);
  };
  const renderer: THREE.WebGLRenderer = {
    get toneMapping(): THREE.ToneMapping {
      return toneMapping;
    },
    set toneMapping(value: THREE.ToneMapping) {
      perform(value === THREE.NoToneMapping ? "quadTone" : "restoreTone");
      toneMapping = value;
    },
    get toneMappingExposure(): number {
      return exposure;
    },
    set toneMappingExposure(value: number) {
      perform(value === 1 ? "quadExposure" : "restoreExposure");
      exposure = value;
    },
    get autoClear(): boolean {
      return autoClear;
    },
    set autoClear(value: boolean) {
      perform(value ? "restoreAuto" : "compositeAuto");
      autoClear = value;
    },
    getDrawingBufferSize: (value: THREE.Vector2): THREE.Vector2 =>
      value.copy(size),
    getContextAttributes: (): WebGLContextAttributes | null => attributes,
    getContext: (): Record<string, unknown> => ({
      FRAMEBUFFER: 0x8d40,
      FRAMEBUFFER_COMPLETE: 0x8cd5,
      COLOR_ATTACHMENT0: 0x8ce0,
      FLOAT: 0x1406,
      ...Object.fromEntries(nativeColourConstants),
      ...(nativeWebGL2.value
        ? { FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: 0x8210, SRGB: 0x8c40 }
        : {}),
      LINEAR: 0x2601,
      SCISSOR_BOX: 0x0c10,
      SCISSOR_TEST: 0x0c11,
      getParameter: (): number[] => currentScissor.toArray(),
      isEnabled: (): boolean => currentScissorTest,
      checkFramebufferStatus: (): number => {
        perform("framebufferStatus");
        return nativeFramebufferStatus.value;
      },
      getFramebufferAttachmentParameter: (
        _target: number,
        _attachment: number,
        parameter: number,
      ): unknown => {
        if (parameter === 0x8211) {
          perform("component");
          return nativeComponent.value;
        }
        const channel: number = [0x8212, 0x8213, 0x8214, 0x8215].indexOf(
          parameter,
        );
        if (channel !== -1) {
          perform("precision");
          return nativeChannelBits.value[channel];
        }
        perform("encoding");
        return nativeEncoding.value;
      },
    }),
    getActiveCubeFace: (): number => face,
    getActiveMipmapLevel: (): number => mip,
    getPixelRatio: (): number => pixelRatio,
    setPixelRatio: (value: number): void => {
      pixelRatio = value;
    },
    getViewport: (value: THREE.Vector4): THREE.Vector4 => value.copy(viewport),
    getCurrentViewport: (value: THREE.Vector4): THREE.Vector4 =>
      value.copy(currentViewport),
    getScissor: (value: THREE.Vector4): THREE.Vector4 => value.copy(scissor),
    getScissorTest: (): boolean => scissorTest,
    setViewport: (value: THREE.Vector4): void => {
      perform("viewport");
      viewport = value.clone();
      currentViewport = value.clone().multiplyScalar(pixelRatio).round();
    },
    setScissor: (value: THREE.Vector4): void => {
      perform("scissor");
      scissor = value.clone();
      currentScissor = value.clone().multiplyScalar(pixelRatio).round();
    },
    setScissorTest: (value: boolean): void => {
      perform("scissorTest");
      scissorTest = value;
      currentScissorTest = value;
    },
    getRenderTarget: (): THREE.WebGLRenderTarget | null => target,
    setRenderTarget: (
      value: THREE.WebGLRenderTarget | null,
      nextFace: number = 0,
      nextMip: number = 0,
    ): void => {
      perform(value === null ? "screen" : "host");
      target = value;
      face = nextFace;
      mip = nextMip;
      currentViewport =
        value === null
          ? viewport.clone().multiplyScalar(pixelRatio).round()
          : value.viewport.clone();
      currentScissor =
        value === null
          ? scissor.clone().multiplyScalar(pixelRatio).round()
          : value.scissor.clone();
      currentScissorTest = value === null ? scissorTest : value.scissorTest;
    },
    getClearColor: (value: THREE.Color): THREE.Color => value.copy(color),
    getClearAlpha: (): number => alpha,
    setClearColor: (value: THREE.Color, nextAlpha: number): void => {
      perform("restoreColor");
      color = value.clone();
      alpha = nextAlpha;
    },
    clear: (): void => {
      perform("clear");
    },
    resetState: (): void => {
      perform("reset");
      target = null;
      face = 0;
      mip = 0;
    },
    copyFramebufferToTexture: (value: THREE.FramebufferTexture): void => {
      perform("copy");
      copied.push(value);
    },
    render: (scene: THREE.Scene): void => {
      const material: THREE.Material | THREE.Material[] | undefined = (
        scene.children[0] as THREE.Mesh | undefined
      )?.material;
      if (!(material instanceof THREE.RawShaderMaterial)) {
        perform("sourceRender");
        return;
      }
      perform(
        material.uniforms.copyBacking!.value
          ? "backingRender"
          : "compositeRender",
      );
      rendered.push({
        target,
        face,
        mip,
        alpha: material.uniforms.alpha!.value,
        fade: material.uniforms.fade!.value,
        backing: material.uniforms.copyBacking!.value,
        srgb: material.uniforms.outputSRGB!.value,
        viewport: currentViewport.toArray(),
        scissor: currentScissor.toArray(),
        scissorTest: currentScissorTest,
      });
    },
  } as unknown as THREE.WebGLRenderer;
  return {
    renderer,
    copied,
    rendered,
    size,
    calls,
    errors,
    nativeEncoding,
    nativeWebGL2,
    nativeFramebufferStatus,
    nativeComponent,
    nativeChannelBits,
    nativeColourConstants,
    state: (): IDisplayCompositionSnapshot => ({
      target: targetIdentity(),
      face,
      mip,
      autoClear,
      color: color.getHex(),
      alpha,
      viewport: viewport.toArray(),
      scissor: scissor.toArray(),
      scissorTest,
      currentViewport: currentViewport.toArray(),
      currentScissor: currentScissor.toArray(),
      currentScissorTest,
    }),
  };
}
