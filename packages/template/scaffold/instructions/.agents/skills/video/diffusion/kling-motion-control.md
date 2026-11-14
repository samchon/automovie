# Kling Motion Control 3.0

Values were read from the linked documentation in November 2026; it owns them, so read it again when planning.

- **Takes the hint as:** one figure's body motion from a continuous motion video of 3 to 30 s; of several people it takes the most prominent.
- **Output:** the motion video's length, shorter on fast motion, at 720p or 1080p.
- **Adherence:** an orientation setting: follow the video's movement, expression and camera, or keep the image's orientation and leave the camera to the prompt, which caps the video at 10 s.
- **References:** one character image, framed as the motion is, full body for full-body motion, with the whole body and head unobstructed and room for large moves; optionally one element, which carries only the face.
- **Prompt:** up to 2,500 characters.
- **Sound:** the motion video's own sound, or none.
- **Continuing a take:** no extend mode; the previous take's last frame can serve as the character image.

Documentation: [guide](https://kling.ai/quickstart/motion-control-user-guide), [API](https://kling.ai/document-api/api/video/3-0-omni/motion-control).
