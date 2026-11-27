import type ffmpegPath from "ffmpeg-static";

/*
 * The `ffmpeg-static` module's declared default export: the path of the binary
 * it downloaded, or null on a platform it has none for.
 */
export type AutoMovieFfmpegStaticPath = typeof ffmpegPath;