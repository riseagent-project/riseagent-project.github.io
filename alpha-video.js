/* H.264 RGB + alpha, reconstructed on the GPU once per decoded video frame. */
(() => {
  const offline = new Map();
  function offlineURL(url) {
    if (!offline.has(url)) offline.set(url, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url.replace(/\.mp4$/, '.js');
      script.deliver = encoded => {
        const bytes = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
        resolve(URL.createObjectURL(new Blob([bytes], {type: 'video/mp4'})));
        script.remove();
      };
      script.onerror = () => { script.remove(); reject(new Error('Cannot load alpha video: ' + url)); };
      document.head.append(script);
    }));
    return offline.get(url);
  }
  async function install(video, originalURL) {
    const url = new URL(originalURL, document.baseURI);
    url.pathname = url.pathname.replace(/\.webm$/, '.alpha.mp4');
    url.search = '';
    const src = url.protocol === 'file:' ? await offlineURL(url.href) : url.href;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'alpha-video-frame';
    Object.assign(canvas.style, {position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', visibility: 'hidden'});
    const gl = canvas.getContext('webgl', {alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false});
    if (!gl) throw new Error('WebGL is unavailable for transparent video playback');
    function shader(type, code) {
      const result = gl.createShader(type);
      gl.shaderSource(result, code); gl.compileShader(result);
      if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
      return result;
    }
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, 'attribute vec2 position; varying vec2 uv; void main(){ uv=vec2((position.x+1.0)*0.5,(1.0-position.y)*0.5); gl_Position=vec4(position,0.0,1.0); }'));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `precision mediump float;
      varying vec2 uv; uniform sampler2D frame; uniform vec2 pixel;
      void main(){
        vec2 colorUV=vec2(clamp(uv.x*0.5,pixel.x*0.5,0.5-pixel.x*0.5),clamp(uv.y,pixel.y*0.5,1.0-pixel.y*0.5));
        vec3 color=texture2D(frame,colorUV).rgb;
        float alpha=texture2D(frame,colorUV+vec2(0.5,0.0)).r;
        gl_FragColor=vec4(color*alpha,alpha);
      }`));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const pixel = gl.getUniformLocation(program, 'pixel');
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {position: 'relative', width: '100%', minWidth: '0'});
    wrapper.className = 'alpha-video-wrapper';
    video.before(wrapper); wrapper.append(video, canvas);
    video.dataset.alphaState = 'packed';
    video.classList.remove('canvas-presented');
    video.src = src;
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth / 2; canvas.height = video.videoHeight;
      video.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(pixel, 1 / video.videoWidth, 1 / video.videoHeight);
    });
    let failed = false;
    function paint() {
      if (failed || video.readyState < 2 || video.seeking || !canvas.width) return;
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        canvas.style.visibility = 'visible';
        // Retain layout and active media decoding; the transparent canvas covers it.
        video.style.opacity = '0';
      } catch (error) {
        failed = true;
        console.error('Transparent video compositor failed', error);
      }
    }
    if ('requestVideoFrameCallback' in video) {
      const tick = () => { paint(); if (!failed) video.requestVideoFrameCallback(tick); };
      video.requestVideoFrameCallback(tick);
    } else {
      let request;
      const tick = () => { paint(); if (!video.paused && !failed) request = requestAnimationFrame(tick); };
      video.addEventListener('play', () => { cancelAnimationFrame(request); tick(); });
      video.addEventListener('pause', () => cancelAnimationFrame(request));
    }
    video.addEventListener('seeked', paint);
    video.addEventListener('loadeddata', paint);
    video.load();
    return canvas;
  }
  window.FloorbenchAlphaVideo = {install};
})();
