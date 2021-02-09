// made in to a web worker by workerize-loader

import {RequestMessage, ResponseMessage} from '../types';

// console.log('worker top-level');

interface iterateRequest {
  xs: number[];
  ys: number[];
  maxItr: number;
  metadata: any;
}

interface iterateResponse {
  values: number[];
}

/*
  return true if the point is in the main cadioid or the period 2 bulb,
  false otherwise

  https://en.wikipedia.org/wiki/Mandelbrot_set#Cardioid_/_bulb_checking
*/
function isInSet(x: number, y: number): boolean {
  const x_minus_q = x - 0.25;
  const y_squared = y * y;

  // main cadioid
  const q = x_minus_q * x_minus_q + y_squared;
  if ((q * (q + x_minus_q)) <= (0.25 * y_squared)) {
    return true;
  }

  // period 2 bulb
  const bulb = (x + 1) * (x + 1) + y_squared;
  if (bulb <= 0.0625) { // 1/16
    return true;
  }

  return false;
}

export function iterate(xc: number, yc: number, maxItr: number): number {
  let x = 0;
  let y = 0;

  let xminus1 = null;
  let xminus2 = null;
  let yminus1 = null;
  let yminus2 = null;

  if (isInSet(xc, yc)) { return maxItr; }

  for (let i = 0; i < maxItr; i++) {

    const new_x = (x * x) - (y * y) + xc;
    const new_y = (2 * x * y) + yc;

    if (xminus1 !== null && xminus1 === new_x && yminus1 === new_y) { return maxItr; }
    if (xminus2 !== null && xminus2 === new_x && yminus2 === new_y) { return maxItr ;
    }
    const mag = (new_x * new_x) + (new_y * new_y);
    if (mag >= 4) {
      // const abs = Math.sqrt(mag);
      // return i + 1 - Math.log(Math.log2(abs));
      return i;
    }

    [xminus2, yminus2] = [xminus1, yminus1];
    [xminus1, yminus1] = [x, y];
    [x, y] = [new_x, new_y];
  }

  return maxItr;
}

function iterate2(xc: number, yc: number, maxItr: number): number {
  if (isInSet(xc, yc)) { return maxItr; }

  let rsquare = 0;
  let isquare = 0;
  let zsquare = 0;

  let xminus1 = null;
  let xminus2 = null;
  let yminus1 = null;
  let yminus2 = null;

  for (let i = 0; i < maxItr; i++) {
    const x = rsquare - isquare + xc;
    const y = zsquare - rsquare - isquare + yc;

    if (xminus1 !== null && xminus1 === x && yminus1 === y) { return maxItr; }
    if (xminus2 !== null && xminus2 === x && yminus2 === y) { return maxItr; }

    rsquare = x * x;
    isquare = y * y;
    zsquare = (x + y) * (x + y);

    if (rsquare + isquare >= 4) { return i; }

    xminus2 = xminus1;
    yminus2 = yminus1;

    xminus1 = x;
    yminus1 = y;
  }

  return maxItr;
}

export function iteratePoints({xs, ys, maxItr, metadata}: iterateRequest) {

  self.performance.mark('iterate_start');
  const values = xs.map((x, i) => iterate2(x, ys[i], maxItr));
  self.performance.measure('iterate_time', 'iterate_start');

  // self.performance.getEntriesByType('measure').forEach(m => {
  //   console.log(`${m.name} ${m.duration}`);
  // });

  return {
    metadata,
    values,
  };
}
