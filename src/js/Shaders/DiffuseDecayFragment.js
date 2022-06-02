export const DIFFUSE_DECAY_FRAGMENT = `
uniform sampler2D points;
		uniform sampler2D input_texture;
		uniform vec2 resolution;
		uniform float diffuse;
		uniform float decay;
		uniform float delta;
		uniform float trailWeight;
		uniform float agentOpacityCoeff;

		uniform sampler2D textMap1;
		uniform sampler2D textMap2;
		uniform sampler2D textMap3;
		uniform sampler2D destMap1;
		uniform float numText;
		uniform float time;
		uniform float startTime1;
		uniform float startTime2;
		uniform float startTime3;
		uniform float textDuration;

		varying vec2 vUv;
		void main(){
		
			vec2 uv = gl_FragCoord.xy / resolution;
			float pixelPoint = min(1.0, texture2D(points, uv).a + trailWeight * delta) / agentOpacityCoeff + texture2D(input_texture, uv).a;
			pixelPoint = min(1.0, pixelPoint);

			vec2 frag = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y) - 0.5;

			if(frag.x < 0.0 || frag.x >= resolution.x || frag.y < 0.0 || frag.y >= resolution.y){
				return;
			}
			
			
			//accumulator
			float sum = 0.0;
			
			//blur box size
			const float dim = 1.;
		
			for( float i = -dim; i <= dim; i++ ){
				for( float j = -dim; j <= dim; j++ ){
			
					float val = texture2D( input_texture,  (gl_FragCoord.xy + vec2(i,j)) / resolution ).a;
					val += min(1.0, texture2D(points, (gl_FragCoord.xy + vec2(i,j)) / resolution).a + trailWeight * delta) / agentOpacityCoeff;
					sum += val;
				}
			}

			float blurredA = sum / 9.0;
			float diffuseWeight = clamp(diffuse * delta, 0.0, 1.0);

			float alpha = pixelPoint * (1.0 - diffuseWeight) + blurredA * (diffuseWeight);
			alpha = max(0.0, alpha - decay * delta);

			//Interpret text map
			if(texture2D(textMap1, uv).x > 0.0 && time > startTime1){
				float textFade = (time - startTime1) / textDuration;
				if(textFade > alpha) alpha = textFade;
			}

			if(texture2D(textMap2, uv).x > 0.0 && time > startTime2){
				float textFade = (time - startTime2) / textDuration;
				if(textFade > alpha) alpha = textFade;
			}

			if(texture2D(textMap3, uv).x > 0.0 && time > startTime3){
				float textFade = (time - startTime3) / textDuration;
				if(textFade > alpha) alpha = textFade;
			}

			//if((resolution.x * gl_FragCoord.y) + gl_FragCoord.x < numText){
			//	if(texture2D(destMap1, uv).x * resolution.x * resolution.y > 0.0 && texture2D(destMap1, uv).y * resolution.x * resolution.y > 0.0){
			//		float textFade = (time - startTime1) / textDuration;
			//		if(textFade > alpha) alpha = textFade;
			//	}
			//}
			alpha = min(2.0, alpha);

			gl_FragColor =  vec4( 0.0, 0.0, 0.0, alpha);
			
		
		}`

		//THE PROBLEM: original code differentiates between diffusemap and trailmap, trailmap should keep em all ;)
