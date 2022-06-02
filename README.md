# Slime Simulation in WebGL for THREEJS

![Slime Image](https://user-images.githubusercontent.com/98781207/171663801-346395e7-1fd1-4263-a818-4f4b00fb203a.PNG)

Inspired by [Coding Adventure: Ant and Slime Simulations](https://www.youtube.com/watch?v=X-iSQQgOd1A) by Sebastian Lague. The idea was to take his approach and build shaders for WebGL with bumpmap support. Eventually I would like to expand this bumpmap support to all images and be able to build an entire webpage which can morph between pages with the shader!

## Challenges
The first major challenge was that WebGL doesn't *really* support compute shaders. I quickly learned about ping pong shaders, essentially a way to make fragment shaders into compute shaders by making two copies of the same shader and passing the data between them each frame. Credit to [Bewelge](https://github.com/Bewelge) and [mrdoob](https://github.com/mrdoob/three.js/blob/master/examples/webgl_gpgpu_birds.html) for their implementations of ping pong shaders.

The biggest challenge was the lack of Read/Write Buffer support in WebGL. HLSL supports Buffers which can be written to in the shader stage, so you can essentially modify multiple textures and multiple coordinates at any shader pass. This is integral to the algorithms curated by Sebastian Lague, and is *not* supported by WebGL. I spent a long time trying to get over this hurdle, attemptimg all kinds of approaches including making each pixel search a small radius around it for the trail. None of these approaches really behaved as I intended until I found [this](https://kaesve.nl/projects/mold/summary.html) article by Ken Voskuil. Ken's approach is a bit of a hack which I hadn't considered: you can use a vertex shader to remap a mesh's coordinates to the pixels you want to modify. Ken goes into detail on how this works in his article, but this made the shader behave exactly as I intended.
