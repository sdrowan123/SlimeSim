import RenderDimensions from "./RenderDimensions.js"
import { SlimeSim } from "./SlimeSim.js"
import { Stats } from "../lib/stats.module.js"

var renderDimensions = new RenderDimensions()
var threeJsHandler = new SlimeSim(renderDimensions)
var stats = Stats()
var useStats =false
window.onload = () => {
	stats.showPanel(0)
	if(useStats) document.body.appendChild(stats.dom)
	threeJsHandler.init()
	render()
}
function render() {
	if(useStats) stats.begin()
	threeJsHandler.render()
	if(useStats) stats.end()
	window.requestAnimationFrame(render)
}
