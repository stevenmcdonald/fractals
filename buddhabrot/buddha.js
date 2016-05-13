(function buddha() {
  'use strict';

  let progress;

  let canvas;
  let ctx;

  // size of the canvas
  let dimX;
  let dimY;

  // min_itr: miniumum number of iterations needed to draw.
  //          setting this higher means plotting only values close
  //          to the edge of the Mandelbrot set
  //
  let min_itr;
  // max_itr: the number of iterations to try before we decide that
  //          it's not going to escape
  let max_itr;

  // how many millions of plots to do
  let plots;

  let start; // used for timing

  // this holds the data before processing
  let buddhaBrot;

  // we process to canvasData and write 'image' to the canvas
  let image;
  let canvasData;

  // multithread stuff uses this
  let numBuddhas;
  let buddhas;
  let progresses;

  let colormapper;

  const colormapers = {
    monochrome: (point) => [point, point, point, 255],

    snow: (point) => {
      let scale = point * point;
      scale = Math.min(scale, 255);
      return [scale, scale, scale, 255];
    },

    crazy: (point) => [
      Math.round(Math.random() * 255),
      Math.round(Math.random() * 255),
      Math.round(Math.random() * 255),
      point,
    ],

    bichrome: (point) => {
      if (point % 2 === 0) {
        return [point, 0, 0, 255];
      }

      return [0, 0, point, 255];
    },

    rainbowish: (point) => {
      if (point <= 31) return [point, point, point, 255];
      if (point <= 63) return [point, 0, 0, 255];
      if (point <= 95) return [0, point, 0, 255];
      if (point <= 127) return [0, 0, point, 255];
      return [point, point, point, 255];
    },

    experiment2: (point) => {
      let scaled;

      if (point <= 127) {
        scaled = point * 2;
        return [0, 0, point, 255];
      }
      scaled = (point - 127) * 2; // scale 127-255 -> 0-255 (254)
      return [scaled, scaled, scaled, 255];
    },

    flame: (point) => {
      let scaled;

      if (point <= 95) {
        return [point, point, point, 255];
      }
      if (point <= 127) {
        scaled = 128 + point; // 224 - 255
        return [scaled, 0, 0, 32];
      }
      if (point <= 159) {
        scaled = 96 + point;
        return [scaled, 0, 0, 255];
      }
      if (point <= 191) {
        scaled = 64 + point;
        return [scaled, scaled, 0, 255];
      }
      if (point <= 223) {
        return [223, 223, point, 255];
      }

      return [point, point, point, 255];
    },

    experiment: (point) => {
      let scaled;

      // plots 100
      // max_itr 2000

      if (point <= 95) {
        return [0, 0, 0, 0];
      }
      if (point <= 127) {
        // scaled = point * 2;
        scaled = (point - 96) * 8;
        return [0, 0, scaled, 255];
      }
      if (point <= 159) {
        scaled = (point - 32) * 2;
        return [point - 32, 0, scaled, 255];
      }
      // if(point <= 191)
      //     return();
      // if(point <= 223)
      //     return();

      // scaled = (point - 127) * 2 // scale 127-255 -> 0-255 (254)
      // return([scaled, scaled, scaled, 255]);
      // return([point, point, point, 255]);
      return [255, 255, 255, point];
    },

    cymrgb: (point) => {
      let scaled;

      if (point <= 31) {
        // 127 - 255
        scaled = (point + 33) * 4 - 1;
        return [scaled, scaled, scaled, 255];
      }
      if (point <= 63) {
        scaled = (point + 1) * 4 - 1;
        return [0, scaled, scaled, 255];
      }
      if (point <= 95) {
        scaled = (point - 31) * 4 - 1;
        return [scaled, scaled, 0, 255];
      }
      if (point <= 127) {
        scaled = (point - 63) * 4 - 1;
        return [scaled, 0, scaled, 255];
      }
      if (point <= 159) {
        scaled = (point - 95) * 4 - 1;
        return [scaled, 0, 0, 255];
      }
      if (point <= 191) {
        scaled = (point - 127) * 4 - 1;
        return [0, scaled, 0, 255];
      }
      if (point <= 223) {
        scaled = (point - 159) * 4 - 1;
        return [0, scaled, 0, 255];
      }

      scaled = (point - 191) * 4 - 1;
      return [scaled, scaled, scaled, 255];
    },

    frosty: (point) =>
      [point, Math.max(0, point - 127), Math.max(0, point - 127), 255],

    sporl: (point, raw) => {
      let scaled;

      if (raw > 0.75) {
        scaled = Math.round(raw * 255);
        return [scaled, scaled, scaled, 255];
      }
      if (raw > 0.5) {
        scaled = Math.round((raw + 0.25) * 255);
        return [scaled, 0, 0, 255];
      }
      if (raw > 0.25) {
        scaled = Math.round((raw + 0.5) * 255);
        return [0, 0, scaled, 255];
      }
      scaled = Math.round((raw + 0.75) * 255);
      return [0, scaled, 0, 255];
    },

    __user: (point, raw) => {
      if (window.scm.Buddha.userColorMap
          && typeof window.scm.Buddha.userColorMap === 'function') {
        const color = window.scm.Buddha.userColorMap(point, raw);
        return color;
      }

      throw new Error('no userColorMap!');
    },
  };

  function mapColor(point, point8) {
    const color = colormapers[colormapper](point8, point);
    // console.log('color: ', color);
    return color;
  }

  function curlyMapColor(point, point8) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    if (point8) console.log('point8 ' + point8);
    return [r, g, b, point8];
  }

  function scale(ramp) {
    let newRamp = isNaN(ramp) ? 0 : ramp;

    if (newRamp < 0) { throw new Error('low ramp'); }
    if (newRamp > 1) { newRamp = 1; }
    newRamp = Math.pow(ramp, 0.5);
    // ramp scaled 0-255
    const ramp8 = Math.round(newRamp * 255);

    return [newRamp, ramp8];
  }

  function draw(imageData) {
    const spot = new Date().getTime();
    const t = spot - start;
    if (t < 1000) {
      console.log('time: ' + t + ' ms');
    } else {
      console.log('time: ' + t / 1000 + ' seconds');
    }

    // this list is too long for Math.max.apply, etc
    let biggest = 0;
    imageData.forEach((element) => {
      biggest = Math.max(element, biggest);
    });
    let smallest = 0;
    imageData.forEach((element) => {
      smallest = Math.min(element, smallest);
    });

    for (let j = 0; j < (dimX * dimY); j++) {
      let ramp = 2 * (imageData[j] - smallest) / (biggest - smallest);

      const temp = scale(ramp);
      ramp = temp[0];
      const ramp8 = temp[1];

      const rgba = mapColor(ramp, ramp8);

      const tempi = j * 4;
      canvasData[tempi] = rgba[0];     // r
      canvasData[tempi + 1] = rgba[1]; // g
      canvasData[tempi + 2] = rgba[2]; // b
      canvasData[tempi + 3] = rgba[3]; // a
    }

    ctx.putImageData(image, 0, 0);
  }

  function drawCurly(imageData) {
    // this list is too long for Math.max.apply, etc
    let biggest = 0;
    imageData.forEach((element) => {
      biggest = Math.max(element, biggest);
    });
    let smallest = 0;
    imageData.forEach((element) => {
      smallest = Math.min(element, smallest);
    });

    for (let j = 0; j < (dimX * dimY); j++) {
      let ramp = 2 * (imageData[j] - smallest) / (biggest - smallest);

      const temp = scale(ramp);
      ramp = temp[0];
      const ramp8 = temp[1];

      const rgba = curlyMapColor(ramp, ramp8);

      const tempi = j * 4;
      canvasData[tempi] = Math.round((canvasData[tempi] + rgba[0]) / 2);     // r
      canvasData[tempi + 1] = Math.round((canvasData[tempi + 1] + rgba[1]) / 2); // g
      canvasData[tempi + 2] = Math.round((canvasData[tempi + 2] + rgba[2]) / 2); // b
      canvasData[tempi + 3] = Math.round((canvasData[tempi + 3] + rgba[3]) / 2); // a
    }

    ctx.putImageData(image, 0, 0);
  }

  function addBuddhaData(imageData) {
    for (let i = 0; i < dimX * dimY; i++) {
      buddhaBrot[i] += imageData[i];
    }
  }

  function updateProgress(newProgress, i) {
    progresses[i] = newProgress;

    let p = 0;
    for (let j = 0; j < numBuddhas; j++) {
      p += progresses[j];
    }

    progress.animate(p / numBuddhas);
  }

  function buddhaListener(e) {
    const data = e.data;
    switch (data.cmd) {
      case 'progress':
        updateProgress(data.progress, data.i);
        break;
      case 'done':
        if (window.scm.Buddha.doneCallback) { window.scm.Buddha.doneCallback(); }
        stopBuddha();
        progress.set(0);
        // fall through and draw
      case 'progressDraw':
        addBuddhaData(data.imageData, data.i);
        draw(buddhaBrot);
        break;
      case 'curlyDone':
        console.log('curly found');
        if (window.scm.Buddha.doneCallback) { window.scm.Buddha.doneCallback(); }
        drawCurly(buddhaBrot);
        break;
      default:
        console.log('unknown message ', data);
    }
  }

  function startMultiThreaded(threads) {
    numBuddhas = threads;
    start = new Date().getTime();
    buddhas = new Array(threads);
    progresses = new Float32Array(threads);

    for (let b = 0; b < threads; b++) {
      buddhas[b] = new Worker('buddhaWorker.js');
      buddhas[b].addEventListener('message', buddhaListener);
      buddhas[b].postMessage({
        cmd: 'start',
        x: dimX,
        y: dimY,
        min_itr: min_itr,
        max_itr: max_itr,
        plots: plots / threads,
        i: b,
      });
      console.log('buddha ' + b);
    }
  }

  function startCurlieThreaded(threads) {
    numBuddhas = threads;
    start = new Date().getTime();
    buddhas = new Array(threads);
    progresses = new Float32Array(threads);

    for (let b = 0; b < threads; b++) {
      buddhas[b] = new Worker('buddhaWorker.js');
      buddhas[b].addEventListener('message', buddhaListener);
      for (let c = 0; c < plots; c++) {
        buddhas[b].postMessage({
          cmd: 'findCurlies',
          x: dimX,
          y: dimY,
          min_itr: min_itr,
          max_itr: max_itr,
          plots: plots / threads,
          i: b,
        });
      }
      console.log('curlie buddha ' + b);
    }
  }

  function startBuddha(options) {

    const threads = options.threads || 2;

    min_itr = options.min_itr || 0;
    max_itr = options.max_itr || 200;
    plots = options.plots || 1000;

    colormapper = options.colormap || 'monochrome';

    if (!options.canvas) {
      throw new Error('canvas is required!');
    }

    canvas = options.canvas;
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    dimX = canvas.width;
    dimY = canvas.height;

    buddhaBrot = new Uint32Array(dimX * dimY);

    image = ctx.createImageData(dimX, dimY);
    canvasData = image.data;

    if (!progress) {
      progress = new ProgressBar.Line('#progress-container', { color: '#FCB03C' });
    }
    progress.set(0);

    startMultiThreaded(threads);
  }

  function startCurlies(options) {
    const threads = options.threads || 2;

    min_itr = options.min_itr || 2000;
    max_itr = options.max_itr || 20000;
    plots = options.plots || 10;

    if (!options.canvas) {
      throw new Error('canvas is required!');
    }
    canvas = options.canvas;

    dimX = canvas.width;
    dimY = canvas.height;

    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    buddhaBrot = new Uint32Array(dimX * dimY);

    image = ctx.createImageData(dimX, dimY);
    canvasData = image.data;

    if (!progress) {
      progress = new ProgressBar.Line('#progress-container', {
        color: '#FCB03C',
      });
    }
    progress.set(0);

    startCurlieThreaded(threads);
  }

  function stopBuddha() {
    for (let i = 0; i < numBuddhas; i++) {
      if (buddhas[i]) {
        buddhas[i].terminate();
      }
    }
    console.log('stopped');
  }

  function redraw(colormap) {
    if (buddhaBrot && buddhaBrot.length) {
      if (colormap) { colormapper = colormap; }
      draw(buddhaBrot);
    }
  }

  if (!window.scm) { window.scm = {}; }
  window.scm.Buddha = {
    startBuddha,
    stopBuddha,
    startCurlies,
    redraw,
  };
}());
