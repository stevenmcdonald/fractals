(function buddhaWorker() {
  'use strict';

  function Buddha(options) {
    // references to 'this' are *way* faster than references to 'self' in Chrome's profiler.
    // in the latter case, 40% of the time is spent in 'get self'.

    this.dimX = options.x;
    this.dimY = options.y;

    this.halfX = this.dimX / 2;
    this.halfY = this.dimY / 2;
    this.thirdX = this.dimX / 3;
    this.thirdY = this.dimY / 3;

    this.imageData = new Uint32Array(this.dimX * this.dimY);

    this.min_itr = options.min_itr || 0;
    this.max_itr = options.max_itr || 200;

    this.plots = options.plots || 1000;

    this.workerNumber = options.i || 0;

    // iterate() uses this for scratch space. We want to avoid reallocating it
    // so we don't spend all our time in the garbage collector. Fomat is [x1,y1,x2,y2...xn,yn]
    this.XY = new Float64Array(this.max_itr * 2);
  }

  Buddha.prototype.iterate = function iterate(x0, y0) {
    let xnew;
    let ynew;
    let x = 0;
    let y = 0;

    for (let i = 0; i < this.max_itr; i++) {
      xnew = (x * x) - (y * y) + x0;
      ynew = 2 * x * y + y0;
      this.XY[i * 2] = xnew;
      this.XY[i * 2 + 1] = ynew;

      if (i >= 3) {
        // check the last 2 points for obvious cycles
        const lasti = (i - 1) * 2;
        const slasti = (i - 2) * 2;
        if ((xnew === this.XY[lasti] && ynew === this.XY[lasti + 1]) ||
          (xnew === this.XY[slasti] && ynew === this.XY[slasti + 1])) {
          return false;
        }
      }

      // why did I switch this form 4 to 10?
      if (xnew * xnew + ynew * ynew > 10) {
      // if(xnew*xnew + ynew*ynew > 4) {
        if (i >= this.min_itr) { return i; }
        return false;
      }
      x = xnew;
      y = ynew;
    }

    return false;
  };

  Buddha.prototype.pushPixel = function pushPixel(x, y) {
    const dimX = this.dimX;
    const dimY = this.dimY;

     // var ix = 0.3 * dimX * (seqx + 0.5) + dimX/2;
     // var iy = 0.3 * dimY * seqy + dimY/2;
    const ix = Math.round(this.thirdX * (x + 0.5) + this.halfX);
    const iy = Math.round(this.thirdY * y + this.halfY);

    if (ix >= 0 && iy >= 0 && ix < dimX && iy < dimY) {
      // var temp = iy*dimX+ix;
      // rotate the image
      const temp = ix * dimY + iy;

      this.imageData[temp]++;
    }
  };

  Buddha.prototype.isPointInSet = function isPointInSet(x, y) {
    // Points within the Mandelbrot set will iterate until max_itr.
    // Check if our point is within the cardoid or period-2 bulb
    // and skip if it is.
    //
    // http://erleuchtet.org/2010/07/ridiculously-large-buddhabrot.html
    // http://en.wikipedia.org/wiki/Mandelbrot_set#Optimizations

    // this makes a significant different with very large 'max_itr' values
    // at 2000 it wasn't noticable
    // at 200000 it was a factor of 5 speedup

    const xminusq = x - 0.25;
    const ysquared = y * y;
    const q = xminusq * xminusq + y * y;

    // check if the point is within the main cardoid
    if (q * (q + xminusq) < ysquared / 4) {
      return true;
    }

    // or the period-2 bulb
    if ((x + 1) * (x + 1) + ysquared < ysquared / 4) {
      return true;
    }

    return false;
  };

  Buddha.prototype.calculate = function calculate() {
    let lastTime = new Date().getTime();

    console.log(`worker starting: ${this.workerNumber} time: ${lastTime}`);

    const tts = 1000000;

    for (let t = 0; t < this.plots; t++) {
      const currTime = new Date().getTime();

      if ((currTime - lastTime) > 5000) {
        lastTime = currTime;
        self.postMessage({
          cmd: 'progressDraw',
          imageData: this.imageData,
          i: this.workerNumber,
        });
        // we've sent our data to our caller, so start fresh
        this.imageData = new Uint32Array(this.dimX * this.dimY);
      }

      self.postMessage({
        cmd: 'progress',
        progress: (t + 1) / this.plots,
        i: this.workerNumber,
      });

      for (let tt=0; tt < tts; tt++) {

        const x = 6 * Math.random() - 3;
        const y = 6 * Math.random() - 3;
        // const x = Math.random() * 3 - 2; // -2 to 1
        // const y = Math.random() * 3 - 1.5; // -1.5 to 1.5

        if (this.isPointInSet(x, y)) {
          continue;
        }

        const result = this.iterate(x, y);

        if (result) {
          for (let i = 0; i < result; i++) {
            this.pushPixel(this.XY[i * 2], this.XY[i * 2 + 1], result);
          }
        }
      }
    }
    self.postMessage({
      cmd: 'progress',
      progress: 1,
      i: this.workerNumber,
    });
    self.postMessage({
      cmd: 'done',
      imageData: this.imageData,
      i: this.workerNumber,
    });
    console.log('worker done: ' + this.workerNumber);
  };

  Buddha.prototype.findCurly = function findCurly() {
    for (;;) {
      // why -3 - +3?
      const x = 6 * Math.random() - 3;
      const y = 6 * Math.random() - 3;

      // const x = Math.random() * 3 - 2; // -2 - 1
      // const y = Math.random() * 3 - 1.5; // -1.5 - 1.5

      if (this.isPointInSet(x, y)) {
        continue;
      }

      const result = this.iterate(x, y);
      if (result) {
        console.log('found curly at ' + result);
        for (let i = 0; i < result; i++) {
          this.pushPixel(this.XY[i * 2], this.XY[i * 2 + 1]);
        }
        self.postMessage({
          cmd: 'curlyDone',
          imageData: this.imageData,
          i: this.workerNumber,
        });
        return;
      }
    }
  };

  function eventListener(e) {
    const data = e.data;

    switch (data.cmd) {
      case 'start':

        console.log('worker start: ', data);

        // probably a good idea not to block in the event listener
        self.setTimeout(() => {
          const b = new Buddha(data);
          b.calculate();
        }, 0);
        break;
      case 'findCurlies':
        console.log('curlies start: ', data);

        self.setTimeout(() => {
          const b = new Buddha(data);
          b.findCurly();
        }, 0);
        break;
      default:
        console.log('unknown message: ', data);
    }
  }

  self.addEventListener('message', eventListener);
}());
