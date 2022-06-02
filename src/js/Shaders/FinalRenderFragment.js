export const FINAL_RENDER_FRAGMENT = `
	uniform sampler2D diffuseTexture;
	uniform sampler2D pointsTexture;
	uniform sampler2D text1;

	uniform float trailOpacity;
	uniform float dotOpacity;

	uniform vec4 colour;
	uniform vec4 trailColour;
	uniform vec4 backgroundColour;
	uniform vec4 textColour;
	varying vec2 vUv;
	void main(){

		vec4 trail = texture2D(diffuseTexture, vUv);
		float alpha = trail.a;
		float alphaOverload = alpha - 1.0;

		vec4 col = mix(trailColour, colour, alpha * 2.0 / 3.0);
		if(alphaOverload > 0.0){
			col = mix(col, textColour, alphaOverload);
		}
		gl_FragColor = mix(backgroundColour, col, alpha);
	}
`
