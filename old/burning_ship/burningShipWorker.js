(function() {
    "use strict";

// Web Worker to create the Burning Ship Fractal
//
// Based on code by Paul Bourke: http://paulbourke.net/fractals/burnship/

function BurningShip(options) {

    // X,Y size, square
    this.dim = options.dim || 1000;

    this.center = {};
    if(options.center) {
        this.center.x = options.center.x;
        this.center.y = options.center.y;
    } else {
        this.center.x = 0;
        this.center.y = 0;
    }

    this.range = options.range || 3;

    this.itermax = options.itermax || 255;

    this.imageBuffer = new Uint32Array(this.dim*this.dim);
}

BurningShip.prototype.iterate = function(in_cx, in_cy) {

    var x0 = 0,
        y0 = 0,
        x, y, k;

    // I don't entirely understand this yet...
    var cx = this.center.x + 2 * this.range * (in_cx/this.dim - 0.5);
    var cy = this.center.y + 2 * this.range * (in_cy/this.dim - 0.5);

    for(k=0; k<this.itermax; k++) {
        x = x0*x0 - y0*y0 - cx;
        y = 2 * Math.abs(x0*y0) - cy;
        if(x*x + y*y > 10) {
            return(k);
        }
        x0 = x;
        y0 = y;
    }
    return(this.itermax);
};

BurningShip.prototype.createFractal = function() {

    var i, j, k; // loops

    for(i=0; i<this.dim; i++) {
        for(j=0; j<this.dim; j++) {

            k = this.iterate(i, j);
            this.imageBuffer[j*this.dim+i] = k;
        }
    }

    this.doneCallback();
};

BurningShip.prototype.doneCallback = function() {

    self.postMessage({
        cmd: 'done',
        imageData: this.imageBuffer
    });
};

function eventListener(e) {
    var data = e.data;

    switch(data.cmd) {
        case 'start':

            console.log("worker start: ", data);

            // probably a good idea not to block in the event listener
            setTimeout(function(){
                var b = new BurningShip(data);
                b.createFractal();
            }, 0);
            break;
        default:
            console.log("unknown message: ", data);
    }
}

self.addEventListener('message', eventListener);

})();