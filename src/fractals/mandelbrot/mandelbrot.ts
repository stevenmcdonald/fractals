import worker from './worker/worker_shim';
import { WorkerPool } from '../../util';

type coord = [number, number];

function* getPixelGenerator(width: number, height: number) {
  let i = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < height; x++) {
      yield [x, y, i];
      i++;
    }
  }
}

interface IArgs {
  domain: coord;
  maxItr: number;
  xTransform: (n: number) => number;
  yTransform: (n: number) => number;
}

class Mandelbrot {
  private size: number;
  private domain: coord;
  private maxItr: number;
  private xTransform: (n: number) => number;
  private yTransform: (n: number) => number;

  private results: number[];
  private batchSize: number;

  private numWorkers = 7;

  constructor({domain, maxItr, xTransform, yTransform}: IArgs) {
    this.domain = domain;
    this.maxItr = maxItr;
    this.xTransform = xTransform;
    this.yTransform = yTransform;

    this.size = this.domain[0] * this.domain[1]
    this.results = Array(this.size);
    this.batchSize = Math.floor((this.size) / 27); // somewhat arbitrary
  }

  public render(): Promise<number[]> {
    return new Promise(async (resolve, reject) => {
      const startTime = performance.now();
      const pool = new WorkerPool({
        workerConstructor: worker,
        numWorkers: this.numWorkers,
        doneCallback: this.addResults,
      });

      let xs = [];
      let ys = [];

      console.log('batchSize', this.batchSize);

      const pixels = getPixelGenerator(this.domain[0], this.domain[1]);

      for (const [x, y, i] of pixels) {
        if (xs.length === this.batchSize) {
          const [w, n] = await pool.getWorker();

          const metadata = i - this.batchSize;

          // console.log('mandelbrot batch', {
          //   metadata,
          //   i,
          // });

          pool.addWork(
            w.iteratePoints({
              metadata,
              xs,
              ys,
              maxItr: this.maxItr,
            }), n);

          xs = [];
          ys = [];
        }

        xs.push(this.xTransform(x));
        ys.push(this.yTransform(y));
      }

      if (xs.length) {
        const [w, n] = await pool.getWorker().catch(reject);

        const metadata = (this.domain[0] * this.domain[1]) - xs.length;

        // console.log('rest', {
        //   metadata,
        //   foo: metadata + xs.length,
        // });

        pool.addWork(
          w.iteratePoints({
            metadata,
            xs,
            ys,
            maxItr: this.maxItr,
          }), n);
      }

      await pool.flush().catch(reject);

      console.info('mandelbrot render time:', performance.now() - startTime);

      const errors = [];
      for (let i = 0; i < this.results.length; i++) {
        if (this.results[i] === undefined) {
          errors.push(i);
        }
      }
      if (errors.length) {
        console.error('mandelbrot errors:', errors.length, errors);
      }

      resolve(this.results);
    });
  }

  private addResults = (result: {values: number[], metadata: number}) => {
    if (result) {
      // console.log('result:', {
      //   length: result.values.length,
      //   first: result.values[0],
      //   metadata: result.metadata,
      // });
      for (let j = 0; j < result.values.length; j++) {
        this.results[j + result.metadata] = result.values[j];
      }
    }
  }
}

export default Mandelbrot;
