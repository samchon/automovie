import { AutoMovieRenderVideo } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderVideo.frameRate` gives the rational rate FFmpeg parses for a number.
 *
 * Scenarios:
 *
 * 1. 30 and 24 are whole rates over 1.
 * 2. 29.97 is 2997/100, and 0.5 is 1/2.
 * 3. A rate beyond FFmpeg's largest term is refused.
 */
export function test_render_delivery_auto_movie_video_frame_rate(): void {
  TestValidator.equals("thirty", AutoMovieRenderVideo.frameRate(30), [30, 1]);
  TestValidator.equals("twenty four", AutoMovieRenderVideo.frameRate(24), [24, 1]);
  TestValidator.equals("ntsc", AutoMovieRenderVideo.frameRate(29.97), [2997, 100]);
  TestValidator.equals("half", AutoMovieRenderVideo.frameRate(0.5), [1, 2]);
  TestValidator.error("too fast", (): void => {
    AutoMovieRenderVideo.frameRate(2_147_483_651);
  });
}