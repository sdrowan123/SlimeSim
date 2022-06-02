export const RENDER_DOTS_VERTEX = `
uniform sampler2D positionTexture;

void main(){ 
    vec4 pos = texture2D(positionTexture,uv ) ;
    gl_Position =  projectionMatrix * modelViewMatrix * vec4(pos.xy, 0.,1.);
    gl_PointSize = 1.0;
}
`
