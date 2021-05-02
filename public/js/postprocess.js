import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js";
import { EffectComposer } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/postprocessing/RenderPass.js";
import { BloomPass } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/postprocessing/BloomPass.js";
// import { FilmPass } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/postprocessing/FilmPass.js";
import { ShaderPass } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/postprocessing/ShaderPass.js";
import { PixelShader } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/shaders/PixelShader.js";
import { HalftonePass } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/postprocessing/HalftonePass.js";

let aScene = null;

let sceneEl = null;
let scene = null;
let renderer = null;
let composer = null;

let initGetRenderer = null;

AFRAME.registerSystem("effects", {
  init: function () {
    aScene = this;
    initGetRenderer = new Promise((resolve) => {
      sceneEl = this.sceneEl;
      sceneEl.addEventListener("loaded", () => {
        renderer = sceneEl.renderer;
        resolve();
      });
    });
  },

  /**
   * Record the timestamp for the current frame.
   * @param {number} t
   * @param {number} dt
   */
  tick: function (t, dt) {
    this.t = t;
    this.dt = dt;
  },

  /**
   * Binds the EffectComposer to the A-Frame render loop.
   * (This is the hacky bit.)
   */
  bind: function () {
    const render = renderer.render;
    const system = this;
    let isDigest = false;

    renderer.render = function () {
      if (isDigest) {
        render.apply(this, arguments);
      } else {
        isDigest = true;
        system.composer.render(system.dt);
        isDigest = false;
      }
    };
  },
});

initGetRenderer.then(() => {
  scene = sceneEl.object3D;
  const renderer = sceneEl.renderer;
  const camera = sceneEl.camera;

  composer = new EffectComposer(renderer);
  const pass1 = new RenderPass(scene, camera);
  const pass2 = new BloomPass(1, 25, 4, 256);
  // pass2.renderToScreen = true;
  const halftoneParams = {
    shape: 1,
    radius: 4,
    rotateR: Math.PI / 12,
    rotateB: (Math.PI / 12) * 2,
    rotateG: (Math.PI / 12) * 3,
    scatter: 0,
    blending: 1,
    blendingMode: 1,
    greyscale: false,
    disable: false,
  };
  const pass3 = new HalftonePass(
    window.innerWidth,
    window.innerHeight,
    halftoneParams
  );
  pass3.renderToScreen = true;

  const pass4 = new ShaderPass(PixelShader);
  const PixelParams = {
    pixelSize: 2,
    postprocessing: true,
  };
  pass4.uniforms["pixelSize"].value = PixelParams.pixelSize;
  pass4.uniforms["resolution"].value = new THREE.Vector2(
    window.innerWidth,
    window.innerHeight
  );
  pass4.uniforms["resolution"].value.multiplyScalar(window.devicePixelRatio);

  composer.addPass(pass1);
  composer.addPass(pass3);
  composer.addPass(pass4);

  aScene.composer = composer;
  aScene.t = 0;
  aScene.dt = 0;

  aScene.bind();
});
