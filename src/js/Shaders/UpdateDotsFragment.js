export const UPDATE_DOTS_FRAGMENT = `
    uniform vec2 resolution; 
        
    uniform float moveSpeed;
    uniform float rotationAngle;
    uniform float sensorDistance;
    uniform float sensorAngle;
    uniform float sensorSize;
    uniform float sensorOffsetDst;

    uniform float delta;
    uniform float time;

    uniform float numAgents;
    
    uniform vec2 textureDimensions;

    uniform sampler2D diffuseTexture;
    uniform sampler2D pointsTexture;

    //the positions & directions as rg & b values
    uniform sampler2D input_texture;

    varying vec2 vUv;

    uniform sampler2D textMap1;
    uniform sampler2D textMap2;
    uniform sampler2D textMap3;
    uniform sampler2D destMap1;
    uniform float startTime1;
    uniform float startTime2;
    uniform float startTime3;
    uniform float numText1;
    uniform float textDuration;

    const float PI  = 3.14159265358979323846264; 
    const float PI2 = PI * 2.;

    float sense(float angle, vec2 position, float sensorAngleOffset){
        float sensorAngle = angle + sensorAngleOffset;
        vec2 sensorDir = vec2(cos(sensorAngle), sin(sensorAngle));
        vec2 sensorPos = position + sensorDir * sensorOffsetDst;
    
        float sensorCentreX = sensorPos.x;
        float sensorCentreY = sensorPos.y;

        float sum = 0.0;
        vec2 uv = sensorPos / resolution + 0.5;
        vec2 agentUV = gl_FragCoord.xy / resolution;
        for (float offsetX = -sensorSize; offsetX <= sensorSize; offsetX ++) {
            for (float offsetY = -sensorSize; offsetY <= sensorSize; offsetY ++) {
                //float sampleX = min(resolution.x - 1.0, max(0.0, sensorCentreX + offsetX));
                //float sampleY = min(resolution.y - 1.0, max(0.0, sensorCentreY + offsetY));
                //float uvX = sampleX / resolution.x + 0.5;
                //float uvY = sampleY / resolution.y + 0.5;

                sum += texture2D(diffuseTexture, (uv + vec2(offsetX, offsetY) / resolution)).a;
                if(time > startTime1){
                    float textFade = (time - startTime1) / (textDuration / 2.0);
                    textFade = min(textFade, 2.0);
                    if(texture2D(textMap1, (uv + vec2(offsetX, offsetY) / resolution)).x > 0.0){
                        sum += textFade;
                    }

                    //if((resolution.x * gl_FragCoord.y) + gl_FragCoord.x < numText1){
                      //  sum += distance(texture2D(destMap1, agentUV).xy * textureDimensions.x * textureDimensions.y, vec2(sensorCentreX, sensorCentreY)) * 0.1;
                    //}
                }

                if(time > startTime2){
                    float textFade = (time - startTime2) / (textDuration / 2.0);
                    textFade = min(textFade, 2.0);
                    if(texture2D(textMap2, (uv + vec2(offsetX, offsetY) / resolution)).x > 0.0){
                        sum += textFade;
                    }
                }

                if(time > startTime3){
                    float textFade = (time - startTime3) / (textDuration / 2.0);
                    textFade = min(textFade, 2.0);
                    if(texture2D(textMap3, (uv + vec2(offsetX, offsetY) / resolution)).x > 0.0){
                        sum += textFade;
                    }
                }
            }
        }

        return sum;
    }
    
    uint hash(uint state)
    {
        state ^= 2747636419u;
        state *= 2654435769u;
        state ^= state >> 16;
        state *= 2654435769u;
        state ^= state >> 16;
        state *= 2654435769u;
        return state;
    }

    vec2 wrapPos(vec2 pos) {
        return fract( (pos.xy + resolution * 0.5) /resolution ) * resolution - resolution * 0.5;
    }
     

    void main()	{

        vec2 uv = gl_FragCoord.xy / textureDimensions;
        vec4 tmpPos = texture2D( input_texture, gl_FragCoord.xy / textureDimensions );
        
        if((resolution.x * gl_FragCoord.y) + gl_FragCoord.x > numAgents) {
            gl_FragColor = vec4( 9999.0, 9999.0, 0.0, 0.0 );
            return;
        }

        if ((resolution.x * gl_FragCoord.y) + gl_FragCoord.x < numText1 && time > startTime1){
            float rotationAngle = rotationAngle * 2.0;
        }   

        vec2 position = tmpPos.xy;
        float angle = tmpPos.z;

        //if(time > startTime1 && (resolution.x * gl_FragCoord.y) + gl_FragCoord.x < numText1){
            //vec2 teeed = texture2D(destMap1, uv).xy * resolution.x * resolution.y;
            //gl_FragColor = vec4(teeed.x, teeed.y, 0.0, 0.0);
            //gl_FragColor = vec4(teeed.x, teeed.y, 0.0, 0.0);
            //return;
        //}
        float sensorAngleRad = sensorAngle * (PI / 180.0);
        float weightForward = sense(angle, position, 0.0);
        float weightLeft = sense(angle, position, sensorAngleRad);
        float weightRight = sense(angle, position, -sensorAngleRad);

        float random = float(hash(uint(position.y * resolution.x + position.x + float(hash(uint((gl_FragCoord.y * resolution.x) + gl_FragCoord.x + time * 100000.0))))));
        float randomSteerStrength = random / 4294967295.0;

        // Continue in same direction
        if (weightForward > weightLeft && weightForward > weightRight) {
            angle += 0.0;
        }
        else if (weightForward < weightLeft && weightForward < weightRight) {
            angle += (randomSteerStrength - 0.5) * 2.0 * rotationAngle * delta;
        }
        // Turn right
        else if (weightRight > weightLeft) {
            angle -= randomSteerStrength * rotationAngle * delta;
        }
        // Turn left
        else if (weightLeft > weightRight) {
            angle += randomSteerStrength * rotationAngle * delta;
        }
        //if(angle > 3.1415 * 2.0) angle = 0.0;
        
        
        //vec2 newPosition = position  + vec2(cos(angle),sin(angle)) *  moveSpeed * delta;
        vec2 direction = vec2(cos(angle), sin(angle));
        vec2 newPosition = position + direction * delta * moveSpeed;
        
        //wrap coordinates on screen
        newPosition.xy = wrapPos(newPosition.xy);
    
        gl_FragColor = vec4( newPosition.xy, angle, 0.0 );

    }`
