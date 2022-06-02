import { rndFloat, rndInt } from "./Util.js"
import * as THREE from "../lib/three.module.js"
import * as PNGReader from "../lib/pngjs-browser.js"
import { ShaderBuilder } from "./ShaderBuilder.js"
import { PingPongShaderBuilder } from "./PingPongShaderBuilder.js"
import { orthographicCamera, Vector } from "./ThreeJsUtils.js"
import { UPDATE_DOTS_FRAGMENT } from "./Shaders/UpdateDotsFragment.js"
import { PASS_THROUGH_VERTEX } from "./Shaders/PassThroughVertex.js"
import { RENDER_DOTS_VERTEX } from "./Shaders/RenderDotsVertex.js"
import { RENDER_DOTS_FRAGMENT } from "./Shaders/RenderDotsFragment.js"
import { DIFFUSE_DECAY_FRAGMENT } from "./Shaders/DiffuseDecayFragment.js"
import { FINAL_RENDER_FRAGMENT } from "./Shaders/FinalRenderFragment.js"

var WIDTH = 1024
var NUMAGENTS = window.innerWidth * window.innerHeight * 1 / 20;

var forShow = false
export class SlimeSim {
	constructor(renderDimensions) {
		this.dims = renderDimensions
	}
	init() {
		this.width = forShow ? 800 : window.innerWidth
		this.height = forShow ? 800 : window.innerHeight
		this.textureLoader = new THREE.TextureLoader()
		this.last = 0

		this.initScene()

		this.initSettings()

		this.initTimes()

		this.initShaders()

		document.body.appendChild(this.renderer.domElement)
	}
	initScene() {
		this.scene = new THREE.Scene()

		this.camera = orthographicCamera(this.width, this.height)
		this.camera.position.z = 1

		this.renderer = new THREE.WebGLRenderer({
			alpha: true,
			blending: THREE.NoBlending
		})

		this.renderer.setSize(this.width, this.height)
	}

	
	initSettings() {
		this.settings = {
			moveSpeed : 35,
			turnSpeed : -70,
			sensorAngleSpacing : 112,
			sensorOffsetDst : 20,
			sensorSize : 1,
			trailWeight : 2,
			decayRate : 0.35,
			diffuseRate : 8,
			agentOpacityCoeff : 17.5,
			textTime : 5,
			colour : new THREE.Vector4(0.05, 1.0, 0.18, 0.95),
			trailColour : new THREE.Vector4(0.0, 0.0, 1.0, 1.0),
			backgroundColour : new THREE.Vector4(0.0, 0.0, 0.0, 1.0),
			textColour : new THREE.Vector4(0.05, 1.0, 0.25, 1.0)
		}
	}

	initTimes(){

		let time1 = {
			startTime : 5,
			centreX : 0,
			centreY : Math.round(WIDTH / 3.5),
			dir : 'src/bumpMaps/title.png',
			bumpMap : null,
			destMap : null,
			textSize : 0
		}

		let time2 = {
			startTime : 8,
			centreX : 0,
			centreY : -Math.round(WIDTH / 5),
			dir : 'src/bumpMaps/by.png',
			bumpMap : null,
			destMap : null,
			textSize : 0
		}

		let time3 = {
			startTime : 10,
			centreX : Math.round(WIDTH),	
			centreY : -Math.round(WIDTH / 4.1),
			dir : 'src/bumpMaps/scroll.png',
			bumpMap : null,
			destMap : null,
			textSize : 0
		}

		this.times = [time1, time2, time3]

		let canvas = document.createElement('canvas')
		for(let i = 0; i < this.times.length; i++){
			let loader = new THREE.TextureLoader();
			let self = this
			let aspectRatio = Math.trunc(window.innerWidth / window.innerHeight)
			loader.load(this.times[i].dir,
				function ( texture ) {
					
					// in this example we create the material when the texture is loaded
					texture.needsUpdate = true
					console.log(texture)
					let matrix = toImageData(texture.image)

					
					console.log("Aspec: " + aspectRatio)

					let textureArray = new Uint8Array(WIDTH * WIDTH * 4)
					let w = texture.image.width
					let h = texture.image.height
					let destArray = new Float32Array(WIDTH * WIDTH * 4)
					for(let j = 0; j < matrix.length; j ++){
						if (matrix[j] != 0) {
							let x = WIDTH / 2 - Math.round(((w / aspectRatio)) / 2) + Math.round((self.times[i].centreX / aspectRatio)) + Math.round((j % w) / aspectRatio) + WIDTH / 2
							let y = WIDTH / 2 - h / 2 + self.times[i].centreY - Math.trunc(j / w)
							textureArray[(y * WIDTH + x) * 4] = 1

							//Start here eh?
							destArray[(1 + i) * j * 4] = x / (WIDTH * WIDTH)
							destArray[(1 + i) * j * 4 + 1] = y / (WIDTH * WIDTH)
							destArray[(1 + i) * j * 8] = x / (WIDTH * WIDTH)
							destArray[(1 + i) * j * 8 + 1] = y / (WIDTH * WIDTH)
						}
					}
					self.times[i].bumpMap = new THREE.DataTexture(textureArray, WIDTH, WIDTH, THREE.RGBAFormat) //Check here or give up
					self.times[i].bumpMap.needsUpdate = true
					self.times[i].destMap = new THREE.DataTexture(destArray, WIDTH, WIDTH, THREE.RGBAFormat, THREE.FloatType)
					self.times[i].destMap.needsUpdate = true
					self.times[i].textSize = matrix.length * 2
				},
			)

			function toImageData(image){
				canvas.width = image.width
				canvas.height = image.height
				let ctx = canvas.getContext('2d')
				ctx.drawImage(image, 0, 0)
				let matrix = new Uint32Array(ctx.getImageData(0, 0, image.width, image.height).data.buffer)
				return matrix
			}
		}
	}
	initShaders() {
		let dotAmount = WIDTH * WIDTH

		let arrays = this.getDataArrays(dotAmount)

		this.diffuseShader = new PingPongShaderBuilder()
			.withDimensions(this.width, this.height)
			.withVertex(PASS_THROUGH_VERTEX)
			.withFragment(DIFFUSE_DECAY_FRAGMENT)
			.withUniform("points", null)
			.withUniform("decay", this.settings.decayRate)
			.withUniform("diffuse", this.settings.diffuseRate)
			.withUniform("delta", 0)
			.withUniform("time", 0)
			.withUniform("agentOpacityCoeff", this.settings.agentOpacityCoeff)
			.withUniform("trailWeight", this.settings.trailWeight)
			.withUniform("resolution", new THREE.Vector2(this.width, this.height))
			.withUniform("textMap1", this.times[0].bumpMap)
			.withUniform("textMap2", this.times[1].bumpMap)
			.withUniform("textMap3", this.times[2].bumpMap)
			.withUniform("destMap1", this.times[0].destMap)
			.withUniform("numText", this.times[0].textSize)
			.withUniform("startTime1", this.times[0].startTime)
			.withUniform("startTime2", this.times[1].startTime)
			.withUniform("startTime3", this.times[2].startTime)
			.withUniform("textDuration", this.settings.textTime)
			.create()

		this.getUpdateDotsShader(arrays.positionsAndDirections)
		this.getRenderDotsShader(arrays.pos, arrays.uvs)

		this.finalMat = new THREE.ShaderMaterial({
			uniforms: {
				diffuseTexture: {
					value: null
				},
				pointsTexture: {
					value: null
				},
				dotOpacity: { value: 0 },
				trailOpacity: { value: 1 },
				colour : {value: this.settings.colour},
				trailColour : {value: this.settings.trailColour},
				backgroundColour : {value: this.settings.backgroundColour},
				textColour : {value: this.settings.textColour}
			},
			transparent: true,
			blending: THREE.AdditiveBlending,
			vertexShader: PASS_THROUGH_VERTEX,
			fragmentShader: FINAL_RENDER_FRAGMENT
		})

		this.finalMesh = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(),
			this.finalMat
		)
		this.finalMesh.position.set(0, 0, 0)
		this.finalMesh.scale.set(this.width, this.height, 1)

		this.scene.add(this.finalMesh)
	}
	getDataArrays(dotAmount) {
		let pos = new Float32Array(dotAmount * 3)
		let uvs = new Float32Array(dotAmount * 2)
		let positionsAndDirections = new Float32Array(dotAmount * 4)
		for (let i = 0; i < WIDTH * WIDTH; i++) {
			if(i < NUMAGENTS){
				pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = 0

				uvs[i * 2] = (i % WIDTH) / WIDTH
				uvs[i * 2 + 1] = ~~(i / WIDTH) / WIDTH

				let id = i * 4
				let rnd = i / dotAmount
				let x = 0
				let y = 0

				//y -= this.height * 0.5
				//x -= this.width * 0.5

				let rndAng = rndFloat(0, Math.PI * 2)
				let radius = rndInt(0, 1)
				let rndDis = rndFloat(0, radius)
				//x
				positionsAndDirections[id++] = x
				//y
				positionsAndDirections[id++] = y
				//direction
				positionsAndDirections[id++] = rndAng // ((rnd % (1 / 3)) / (1 / 3)) * Math.PI * 2 // rndFloat(0, Math.PI * 2)

				//team (0-> red, 1-> green, 2-> blue)
				positionsAndDirections[id] =
					(rnd < 2 / 3 ? (rnd < 1 / 3 ? 0 : 1) : 2) % 1
			}
			else{
				let id = i * 4
				uvs[i * 2] = 100000000
				uvs[i * 2 + 1] = 1000000000
				positionsAndDirections[id++] = 10000000
				//y
				positionsAndDirections[id++] = 10000000
			}
		}
		return { pos, uvs, positionsAndDirections }
	}
	changeParticleAmount(newAmount) {
		WIDTH = Math.sqrt(newAmount)
		let arrays = this.getDataArrays(newAmount)
		this.updateDotsShader.dispose()
		this.renderDotsShader.dispose()
		this.renderDotsShader = null
		this.getRenderDotsShader(arrays.pos, arrays.uvs)
		this.updateDotsShader = null
		this.getUpdateDotsShader(arrays.positionsAndDirections)
	}
	getUpdateDotsShader(positionsAndDirections) {
		if (!this.updateDotsShader) {
			this.updateDotsShader = new PingPongShaderBuilder()
				.withDimensions(WIDTH, WIDTH)
				.withVertex(PASS_THROUGH_VERTEX)
				.withFragment(UPDATE_DOTS_FRAGMENT)
				.withTextureData(positionsAndDirections)
				.withUniform("diffuseTexture", null)
				.withUniform("pointsTexture", null)
				.withUniform("resolution", Vector([this.width, this.height]))
				.withUniform("textureDimensions", Vector([WIDTH, WIDTH]))
				.withUniform("sensorAngle", this.settings.sensorAngleSpacing)
				.withUniform("rotationAngle", this.settings.turnSpeed)
				.withUniform("sensorDistance", this.settings.sensorOffsetDst)
				.withUniform("sensorSize", this.settings.sensorSize)
				.withUniform("sensorOffsetDst", this.settings.sensorOffsetDst)
				.withUniform("moveSpeed", this.settings.moveSpeed)
				.withUniform("numAgents", NUMAGENTS)
				.withUniform("textMap1", null)
				.withUniform("textMap2", null)
				.withUniform("textMap3", null)
				.withUniform("startTime1", this.times[0].startTime)
				.withUniform("startTime2", this.times[1].startTime)
				.withUniform("startTime3", this.times[2].startTime)
				.withUniform("textDuration", this.settings.textTime)
				.withUniform("delta", 0)
				.withUniform("destMap1", this.times[0].destMap)
				.withUniform("numText1", this.times[0].textSize)
				.create()
		}
		return this.updateDotsShader
	}

	getRenderDotsShader(pos, uvs) {
		if (!this.renderDotsShader) {
			this.renderDotsShader = new ShaderBuilder()
				.withDimensions(this.width, this.height)
				.withVertex(RENDER_DOTS_VERTEX)
				.withFragment(RENDER_DOTS_FRAGMENT)
				.withUniform("positionTexture", null)
				.withUniform("resolution", Vector([this.width, this.height]))
				.withAttribute("position", new THREE.BufferAttribute(pos, 3, false))
				.withAttribute("uv", new THREE.BufferAttribute(uvs, 2, false))
				.create()
		}
		return this.renderDotsShader
	}

	getDelta(){
		const time = performance.now()
		let delta = (time - this.last)
		
		let now = time / 1000
		delta = delta / 1000
		if(delta > 1) delta = 1
		this.last = time
		return delta
	}

	timeUpdate(){
		let time = performance.now() / 1000

		//First accelerate
		if(time > 8){
			this.getUpdateDotsShader().setUniform(
				"moveSpeed",
				this.settings.moveSpeed + 10
			)
		}
		if(time > 14){
			this.getUpdateDotsShader().setUniform(
				"moveSpeed",
				this.settings.moveSpeed + 20
			)
		}
		if(time > 40){
			this.getUpdateDotsShader().setUniform(
				"moveSpeed",
				this.settings.moveSpeed + 100
			)
		}
	}

	render() {
		//console.log(this.times[0].bumpMap)
		this.timeUpdate()
		let delta = this.getDelta()

		this.getUpdateDotsShader().setUniform(
			"pointsTexture",
			this.renderDotsShader.getTexture()
		)
		this.getUpdateDotsShader().setUniform(
			"diffuseTexture",
			this.diffuseShader.getTexture()
		)
		this.getUpdateDotsShader().setUniform(
			"delta",
			delta
		)
		this.getUpdateDotsShader().setUniform(
			"time",
			performance.now() / 1000
		)
		this.getUpdateDotsShader().setUniform(
			"textMap1",
			this.times[0].bumpMap
		)
		this.getUpdateDotsShader().setUniform(
			"textMap2",
			this.times[1].bumpMap
		)
		this.getUpdateDotsShader().setUniform(
			"textMap3",
			this.times[2].bumpMap
		)
		this.getUpdateDotsShader().setUniform(
			"destMap1",
			this.times[0].destMap
		)
		this.getUpdateDotsShader().setUniform(
			"numText1",
			this.times[0].textSize
		)
		this.getUpdateDotsShader().render(this.renderer, {})


		this.getRenderDotsShader().setUniform(
			"positionTexture",
			this.updateDotsShader.getTexture()
		)
		this.getRenderDotsShader().setUniform(
			"diffuseTexture",
			this.diffuseShader.getTexture()
		)
		this.getRenderDotsShader().setUniform(
			"delta",
			delta
		)
		this.getRenderDotsShader().setUniform(
			"trailWeight",
			this.settings.trailWeight
		)
		this.renderDotsShader.render(this.renderer)
		//CHECK DIFFUSE AND FIX THAT?? okay beyeyyy

		

		this.diffuseShader.setUniform("points", this.renderDotsShader.getTexture())
		this.diffuseShader.setUniform("delta", delta)
		this.diffuseShader.setUniform("time", performance.now() / 1000)
		this.diffuseShader.setUniform("trailWeight", this.settings.trailWeight)
		this.diffuseShader.setUniform("textMap1", this.times[0].bumpMap)
		this.diffuseShader.setUniform("textMap2", this.times[1].bumpMap)
		this.diffuseShader.setUniform("textMap3", this.times[2].bumpMap)
		this.diffuseShader.setUniform("destMap1", this.times[0].destMap)
		this.diffuseShader.setUniform("numText", this.times[0].textSize)
		this.diffuseShader.render(this.renderer)


		this.finalMesh.material.uniforms.diffuseTexture.value =
			this.diffuseShader.getTexture()
		this.finalMesh.material.uniforms.pointsTexture.value =
			this.renderDotsShader.getTexture()

		this.renderer.setSize(this.width, this.height)
		this.renderer.clear()

		this.renderer.render(this.scene, this.camera)

	}
}