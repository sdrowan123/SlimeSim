export const RENDER_DOTS_FRAGMENT = `
uniform float trailWeight;
uniform float delta;

uniform sampler2D input_texture;
uniform sampler2D diffuseTexture;
void main(){
    float oldAlpha = texture2D(diffuseTexture, gl_PointCoord).a;
    float alpha = min(1.0, oldAlpha + trailWeight * delta);
    gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
}
`
