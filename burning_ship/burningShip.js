(function() {
    "use strict";

    var canvas, ctx, image, canvasData;

    var maxItr;

    // assumed to be square
    var dim;

    var worker;

    function mapColor(point) {

        var r, g, b, a;

        var v = point,
            s;


        // v = Math.pow(v, 2.5);
        // v = Math.min(v, 1);

        // v = Math.pow(v, Math.E);
        // v = Math.min(v, 1);

        s = Math.round(point * 255);
        r = s;
        g = s;
        b = s;
        a = 255;

        // if(point<0.5) {
        //     s = Math.round(point * 255 * 2);
        //     r = s;
        //     g = s;
        //     b = s;
        //     a = 255;
        // } else if(point<0.75) {
        //     s = Math.round(point * 255);

        //     r = s;
        //     g = 0;
        //     b = s;
        //     a = 255;

        // } else {
        //     s = Math.round(point * 255);

        //     r = s;
        //     g = 0;
        //     b = 0;
        //     a = 255;
        // }

        // v = Math.round(v * 255);

        // if(v<96) {
        //     s = v;//v * 4;

        //     r = s;
        //     b = s;
        //     g = s;
        //     a = 255;
        // } else if(v<128) {
        //     s = v;

        //     r = s;
        //     g = 0;
        //     b = 0;
        //     a = 127
        // } else if(v<160) {
        //     s = v;

        //     r = s;
        //     g = 0;
        //     b = 0;
        //     a = 160;
        // } else if(v<200) {
        //     s = v;

        //     r = s;
        //     g = s;
        //     b = 0;
        //     a = 255;
        // } else {
        //     r = v;
        //     g = v;
        //     b = v;
        //     a = 255;
        // }

        return([r, g, b, a]);
    }

    function draw(imageData) {
        var i, ii, x, y;

        var color;

        for(x=0; x<dim; x++) {
            for(y=0; y<dim; y++) {
                i = y*dim + x;
                // invert the y-axis so the "ship" is the right way around
                // ii = dim*dim - i - 1; // this flips around both axes
                ii = (dim-y-1)*dim + x;

                // scale the values 0 to 1 and invert them too
                var v = 1 - imageData[ii] / maxItr;

                color = mapColor(v);

                var ci = 4*i;
                canvasData[ci]   = color[0];
                canvasData[ci+1] = color[1];
                canvasData[ci+2] = color[2];
                canvasData[ci+3] = color[3];

            }
        }

        ctx.putImageData(image, 0, 0);
        console.log('drawn');
    }

    function startWorker(options) {

        if(!options.canvas) { throw new Error('canvas is required!'); }
        canvas = options.canvas;

        ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        image = ctx.createImageData(canvas.width, canvas.height);
        canvasData = image.data;

        dim = canvas.width;

        maxItr = options.itr || 88;

        var workerOptions = {
            cmd: 'start',
            center: options.center || { x: 0.45, y: 0.5 },
            range: options.range || 1.7,
            dim: canvas.width
        };

        if(!worker) {
            console.log('starting worker...');
            worker = new Worker('burningShipWorker.js');
            worker.addEventListener('message', burningShipListener);
        }

        console.log('starting render');
        worker.postMessage(workerOptions);
    }

    function stopWorker() {
        if(worker) {
            worker.terminate();
            console.log("worker terminated");
        }
    }

    function burningShipListener(e) {
        var data = e.data;
        switch(data.cmd) {
            case "done":
                console.log('done message');
                draw(data.imageData);
                break;
            default:
                console.log("unrecognized message: ", data);
        }
    }

    if(!window.scm) { window.scm = {}; }
    window.scm.BurningShipFractal = {
        startWorker: startWorker,
        stopWorker: stopWorker
    };

})();