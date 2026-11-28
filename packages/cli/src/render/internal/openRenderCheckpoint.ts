import type {
  AutoMovieInspectionShade,
  IAutoMovieCaptureSubject,
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawnPass,
  IAutoMovieRenderSpec,
} from "@automovie/interface";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { AutoMovieCliRender } from "../AutoMovieCliRender";
import { readErrorCode } from "../../file/internal/readErrorCode";
import { AutoMovieRenderOutputReservation } from "./AutoMovieRenderOutputReservation";

/* One render owns the checkpoint directory until its session closes. */
export async function openRenderCheckpoint(
  props: AutoMovieCliRender.IRenderVideoInput,
  input: AutoMovieCliRender.ICheckpoint,
  profile: Omit<IAutoMovieRenderSpec, "frameFormat">,
  open: () => Promise<ISession>,
): Promise<{ session: ISession; receipt: IReceipt }> {
  if (!/^[a-f0-9]{64}$/u.test(input.identity) || input.rendererIdentity.trim() === "")
    throw new Error("Render checkpoint needs the source SHA-256 and renderer identity");
  if (input.directory.trim() === "") throw new Error("Render checkpoint directory is blank");
  const directory: string = path.resolve(props.root, input.directory);
  const signature: string = digest(
    Buffer.from(JSON.stringify([
      input.identity,
      input.rendererIdentity,
      props.subject,
      props.props,
      props.background ?? "scene",
      props.passes ?? [],
      profile,
    ])),
  );
  await fs.mkdir(directory, { recursive: true });
  const staging: string = await fs.mkdtemp(path.join(directory, ".render-"));
  const lock: string = path.join(directory, ".render-checkpoint");
  let ticket: string | undefined;
  let opened: ISession | undefined;
  let pendingSpeech: IAutoMovieDialogueMouthTrack | undefined;
  const close = async (): Promise<void> => {
    try {
      await opened?.close();
    } finally {
      try {
        if (ticket !== undefined) await AutoMovieRenderOutputReservation.release(lock, ticket);
      } finally {
        await fs.rm(staging, { recursive: true });
      }
    }
  };
  try {
    ticket = await AutoMovieRenderOutputReservation.reserve(staging, lock, directory);
    const manifestFile: string = path.join(directory, "manifest.bin");
    const stored: IManifest | undefined = await readStored(manifestFile).then(
      (bytes): IManifest | undefined =>
        bytes === undefined ? undefined : unpack<IManifest>(bytes, manifestFile).metadata,
    );
    if (stored !== undefined && (stored.version !== 1 || stored.signature !== signature))
      throw new Error(`Render checkpoint identity changed in ${directory}`);
    if (stored === undefined) opened = await open();
    const manifest: IManifest = stored ?? {
      version: 1,
      signature,
      backend: opened!.backend,
      subject: opened!.subject,
    };
    if (stored === undefined) await atomicFile(staging, manifestFile, pack(manifest));
    const { subject, backend } = manifest;
    const frameIdentity: string = digest(Buffer.from(JSON.stringify(manifest)));
    if (!Number.isSafeInteger(subject.width) || subject.width <= 0 ||
        !Number.isSafeInteger(subject.height) || subject.height <= 0 ||
        !Number.isSafeInteger(subject.width * subject.height * 4))
      throw new Error(`Render checkpoint raster is invalid in ${directory}`);

    const receipt: IReceipt = {
      directory,
      identity: input.identity,
      reusedFrames: [],
      retainedFrames: [],
    };
    const live = async (): Promise<ISession> => {
      if (opened === undefined) {
        opened = await open();
        if (opened.backend !== backend || JSON.stringify(opened.subject) !== JSON.stringify(subject))
          throw new Error(`Render checkpoint subject or backend changed in ${directory}`);
        if (pendingSpeech !== undefined) {
          await opened.speak(pendingSpeech);
          pendingSpeech = undefined;
        }
      }
      return opened;
    };
    return {
      receipt,
      session: {
        subject,
        backend,
        close,
        async speak(track: IAutoMovieDialogueMouthTrack): Promise<void> {
          if (opened === undefined) pendingSpeech = track;
          else await opened.speak(track);
        },
        async frame(seconds, passes, inspectionDiagnostics, background) {
          const index: number = Math.round(seconds * subject.fps);
          if (!Number.isSafeInteger(index) || index < 0 || seconds !== index / subject.fps)
            throw new Error(`Render checkpoint time ${seconds} is outside the native clock`);
          const target: string = path.join(directory, `frame-${index}.bin`);
          const bytes: Buffer | undefined = await readStored(target);
          if (bytes !== undefined) {
            const pictures: IAutoMovieDrawnPass[] = decodeFrame(bytes, target, subject, index, passes, frameIdentity);
            receipt.reusedFrames.push(index);
            receipt.retainedFrames.push(index);
            return pictures;
          }
          const session: ISession = await live();
          const pictures: IAutoMovieDrawnPass[] = await session.frame(seconds, passes, inspectionDiagnostics, background);
          if (pictures.length !== passes.length || pictures.some((entry, slot) =>
            entry.pass !== passes[slot] || entry.picture.width !== subject.width ||
            entry.picture.height !== subject.height || entry.picture.pixels.length !== subject.width * subject.height * 4,
          ))
            throw new Error(`Render checkpoint frame ${index} has unexpected passes or raster`);
          const metadata: IFrame = {
            index,
            identity: frameIdentity,
            passes: pictures.map(({ picture, ...entry }) => entry),
          };
          await atomicFile(staging, target, pack(metadata, pictures.map(({ picture }) =>
            new Uint8Array(picture.pixels.buffer, picture.pixels.byteOffset, picture.pixels.byteLength),
          )));
          receipt.retainedFrames.push(index);
          return pictures;
        },
      },
    };
  } catch (cause) {
    try {
      await close();
    } catch (closeFailure) {
      throw new AggregateError([cause, closeFailure], `Could not close render checkpoint ${directory}`);
    }
    throw cause;
  }
}

type ISession = Awaited<ReturnType<AutoMovieCliRender.IRenderVideoInputHost["session"]>>;

interface IManifest {
  version: 1;
  signature: string;
  backend: string;
  subject: IAutoMovieCaptureSubject;
}

interface IFrame {
  index: number;
  identity: string;
  passes: Omit<IAutoMovieDrawnPass, "picture">[];
}

interface IReceipt {
  directory: string;
  identity: string;
  reusedFrames: number[];
  retainedFrames: number[];
}

/* The digest covers the metadata, its length and every channel's RGBA bytes. */
function pack(metadata: object, pixels: readonly Uint8Array[] = []): Buffer {
  const json: Buffer = Buffer.from(JSON.stringify(metadata));
  const length: Buffer = Buffer.alloc(4);
  length.writeUInt32BE(json.length);
  const payload: Buffer = Buffer.concat([length, json, ...pixels]);
  return Buffer.concat([Buffer.from(digest(payload)), payload]);
}

function unpack<T>(file: Buffer, target: string): { metadata: T; pixels: Buffer } {
  const payload: Buffer = file.subarray(64);
  if (payload.length < 4 || digest(payload) !== file.subarray(0, 64).toString())
    throw new Error(`Render checkpoint digest mismatch in ${target}`);
  const end: number = 4 + payload.readUInt32BE(0);
  if (end > payload.length) throw new Error(`Render checkpoint header is truncated in ${target}`);
  return {
    metadata: JSON.parse(payload.toString("utf8", 4, end)) as T,
    pixels: payload.subarray(end),
  };
}

function decodeFrame(
  file: Buffer,
  target: string,
  subject: IAutoMovieCaptureSubject,
  index: number,
  passes: readonly AutoMovieInspectionShade[],
  identity: string,
): IAutoMovieDrawnPass[] {
  const { metadata, pixels } = unpack<IFrame>(file, target);
  const size: number = subject.width * subject.height * 4;
  if (metadata.identity !== identity || metadata.index !== index || metadata.passes.length !== passes.length ||
      metadata.passes.some((entry, slot) => entry.pass !== passes[slot]) ||
      pixels.length !== size * passes.length)
    throw new Error(`Render checkpoint frame identity mismatch in ${target}`);
  return metadata.passes.map((entry, slot) => ({
    ...entry,
    picture: {
      width: subject.width,
      height: subject.height,
      pixels: new Uint8ClampedArray(pixels.buffer, pixels.byteOffset + slot * size, size),
    },
  }));
}

function digest(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readStored(target: string): Promise<Buffer | undefined> {
  try {
    return await fs.readFile(target);
  } catch (error) {
    if (readErrorCode(error) === "ENOENT") return undefined;
    throw error;
  }
}

async function atomicFile(staging: string, target: string, bytes: Buffer): Promise<void> {
  const pending: string = path.join(staging, path.basename(target));
  await fs.writeFile(pending, bytes);
  await fs.rename(pending, target);
}
