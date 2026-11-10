# @automovie/ingest

Turns external media bytes into AutoMovie records. glTF, GLB and VRM documents become models, skeletons and clips, WAVE audio becomes its format facts and a mono sample buffer, and a P6 PPM becomes an RGB image. Decoding depends only on the bytes.

The host, the program that calls the package, opens files, downloads and does anything browser-side, then hands over the bytes.

## Use

```bash
npm install @automovie/ingest
```

```ts
import { decodeAutoMoviePpmImage } from "@automovie/ingest";

declare const bytes: Uint8Array;

const image = decodeAutoMoviePpmImage(bytes, {
  maxPixels: 1920 * 1080,
  maxHeaderBytes: 100,
  transfer: "srgb",
});
// image.width, image.height and image.rgb8
```

## Entry points

| Export | Purpose |
| --- | --- |
| `inspectAutoMovieExternalModelBytes` | Check glTF, GLB or VRM bytes and their sidecars against a named profile: `gltf-static-v1`, `gltf-humanoid-v1`, `gltf-motion-v1` or `vrm-humanoid-v1` |
| `adoptAutoMovieExternalMotion` | Check that one inspected motion take can be used natively or by retargeting |
| `ingestDocument`, `humanoidSkeleton` | Map a document parsed by `@gltf-transform/core` onto nodes and clips, then onto a humanoid skeleton |
| `decodeProductionAudioAsset` | Decode WAVE bytes into mono samples at a requested rate |
| `decodeAutoMoviePpmImage` | Decode one bounded P6 RGB8 image under an explicit `srgb`, `bt709` or `linear` convention |

Nothing is guessed or repaired. A defect such as an unknown attached bone, an unsupported WAVE layout or a truncated raster is refused with its cause.

The supported subsets are narrow; the accepted forms are listed in each function's JSDoc. Audio is 16-bit PCM or 32-bit float, mono or stereo. PPM is maxval 255, a single image, with `maxPixels` and `maxHeaderBytes` supplied by the host.
