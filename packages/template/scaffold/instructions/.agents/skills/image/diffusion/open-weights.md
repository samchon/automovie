# Open-weight image models

Values were read from the linked documentation in November 2026; it owns them, so read it again when choosing.

- **Reached through:** diffusers or ComfyUI on the user's hardware.
- **Control:** ControlNet conditions on edges, depth or pose, and IP-Adapter on a reference image, with Flux and SDXL as current bases. Qwen-Image-Edit-2509 takes depth, edge and keypoint maps natively; its later releases do not document control input.
- **Seed:** a fixed seed repeats the image on the same setup, which makes this the route that conditions on a rendered form and repeats.
- **Licenses:** each checkpoint has its own, such as the Qwen Research License of Qwen-Image-2.1.

Documentation: [ControlNet in diffusers](https://huggingface.co/docs/diffusers/main/en/using-diffusers/controlnet), [IP-Adapter](https://huggingface.co/docs/diffusers/main/en/using-diffusers/ip_adapter), [Qwen-Image-Edit-2509](https://huggingface.co/Qwen/Qwen-Image-Edit-2509).
