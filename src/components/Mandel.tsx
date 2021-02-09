
import React from 'react';
import worker from '../fractals/mandelbrot/worker/worker_shim';
import Mandelbrot from '../fractals/mandelbrot/mandelbrot';

import { debounce } from 'debounce';

import { PromiseStatus, WorkerPool } from '../util';

import { useQueryParamState } from '../url-state';

import * as chroma from 'chroma-js';
import linearScale from 'simple-linear-scale';

import NumberInput from './NumberInput';

import styles from '../styles/fractal_controls.module.css';

enum State {
  IDLE = 'idle',
  RUNNING = 'running',
  // ERROR = 'error',
  // COMPLETE,
}

export enum FractalType {
  MANDELBROT = 'mandelbrot',
  BURNING_SHIP = 'burning_ship',
}

interface IProps {
  height: number;
  width: number;
  drawColors: Function;
  // type: FractalType;
  canvasRef: React.Ref<HTMLCanvasElement>;
}

function Integer(n: string) {
  const num = Number(n);
  if (isNaN(num)) {
    return 1;
  }

  return Math.floor(num);
}

const Mandel: React.FC<IProps> = ({height, width, drawColors, canvasRef}: IProps) => {
  const [state, setState] = React.useState(State.IDLE);

  // const [centerX, setCenterX] = React.useState(0);
  // const [centerY, setCenterY] = React.useState(0);
  // const [zoom, setZoom] = React.useState(0);
  // const [maxItr, setMaxItr] = React.useState(256);

  const [centerX, setCenterX] = useQueryParamState('x', Number, 0);
  const [centerY, setCenterY] = useQueryParamState('y', Number, 0);
  const [zoom, setZoom] = useQueryParamState('z', Number, 0);
  const [maxItr, setMaxItr] = useQueryParamState('m', Integer, 256);

  const scaler = React.useRef((x: number) => { throw new Error('!'); });

  const start = (e: any = undefined) => {
    // console.log('start!!!');
    if (e && e.preventDefault) { e.preventDefault(); }

    if (state === State.IDLE) {
      setState(State.RUNNING);
      return;
    }
    console.error('already running!');
  };

  React.useEffect(() => {
    // console.log('mandel resize', [height, width]);
    if (height && width) {
      start();
    }
  }, [height, width]);

  const scale = (n: number) => scaler.current(n);

  const translateX = (x: number) => x + centerX!;

  const translateY = (y: number) => -1 * (y - centerY!);

  const cScale = chroma.bezier(['yellow', 'orange', 'red', 'purple', 'blue'].reverse())
    .scale()
    .correctLightness()
    .colors(maxItr, 'rgb');

  const color = (values: number[]): number[][] => {
    const colorStart = performance.now();
    const colors = [];

    for (let i = 0; i < values.length; i++) {
      const v = values[i];

      let c = [0, 0, 0];
      if (v === undefined) {
        throw new Error('value undefined: ' + i);
        console.error('is this an off by one?', i);
      } else if (v !== maxItr) {
        c = cScale[v];
      }

      colors.push(c);
    }

    console.log('color time:', performance.now() - colorStart);

    return colors;
  };

  /* render */
  const render = async () => {
    const mandel = new Mandelbrot({
      domain: [width, height],
      maxItr,
      xTransform: (x) => translateX(scale(x)),
      yTransform: (y) => translateY(scale(y)),
    });
    const results = await mandel.render();

    const colors = color(results);

    const drawStart = performance.now();
    drawColors(colors);
    console.log('draw time:', performance.now() - drawStart);
  };

  React.useEffect(() => {
    // apply scaling
    // range is +/- 2/2^zoom
    const scaleFactor = Math.pow(2, zoom);
    const min = -2 / scaleFactor;
    const max = 2 / scaleFactor;

    scaler.current = linearScale([0, height], [min, max]);

    // console.log('setting scaler', {
    //   height,
    //   width,
    //   zoom,
    // });
  }, [height, width, zoom, centerX, centerY]);

  // // canvas handlers
  // React.useEffect(() => {
  //   const oldOnclick = window.onclick;
  //   const oldOnwheel = window.onwheel;

  //   if (canvasRef && canvasRef.current) {
  //     const canvas = canvasRef.current;

  //     canvas.onclick = (e: React.MouseEvent<HTMLCanvasElement>) => {
  //       const rect = canvas.getBoundingClientRect();
  //       let x = (e.clientX - rect.left) * window.devicePixelRatio;
  //       let y = (e.clientY - rect.top) * window.devicePixelRatio;

  //       console.log('click:', {x, y});

  //       x = translateX(scale(x));
  //       y = translateY(scale(y));

  //       console.log('click2', {x, y});

  //       setCenterX(x);
  //       setCenterY(y);
  //       start();

  //       if (oldOnclick) { oldOnclick(e); }
  //     };

  //     canvas.onwheel = debounce((e: React.WheelEvent<HTMLCanvasElement>) => {
  //       console.log('wheel', e.deltaY);

  //       setZoom((z) => z = z + e.deltaY);
  //       start();

  //       if (oldOnwheel) { oldOnwheel(e); }
  //     }, 50, true);
  //   }

  //   return () => {
  //     console.log('removing handlers');
  //     if (canvasRef && canvasRef.current) {
  //       canvasRef.current.onclick = oldOnclick;
  //       canvasRef.current.onwheel = oldOnwheel;
  //     }
  //   };
  // }, [canvasRef, centerX, centerY]);

  // Worker / State
  React.useEffect(() => {
    if (state === State.RUNNING) {
      const startTime = performance.now();
      render()
      .then(() => {
        setState(State.IDLE);
        // console.log('total time:', performance.now() - startTime);
      });
    }
  }, [state]);

  return (
    <div className={styles.controlsContainer}>
      <div>{state}</div>
      <div>
        <button className={styles.goButton} type="submit" onClick={start}>Go!</button>
        <button className={styles.goButton} type="button" onClick={() => {
          const w = Promise.resolve();

          Promise.race([w]).then((result) => {
            console.log('pp', result);
          });

        }}>Debug!</button>
      </div>
      <div>
        <form onSubmit={start}>
          <NumberInput label="Center X:" value={centerX} onChange={setCenterX} />
          <NumberInput label="Center Y:" value={centerY} onChange={setCenterY} />
          <NumberInput label="Zoom:" value={zoom} onChange={setZoom} />
          <NumberInput label="Max Itr" value={maxItr} onChange={setMaxItr} />
        </form>
      </div>
    </div>
  );
};

export default Mandel;
