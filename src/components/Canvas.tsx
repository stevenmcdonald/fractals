
import React from 'react';

import QueryParamStateProvider from '../url-state/QueryParamStateProvider';

import Mandel from './Mandel';

import styles from '../styles/Canvas.module.css';

const Canvas: React.FC = (
  ) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [height, setHeight] = React.useState(0);
  const [width, setWidth] =  React.useState(0);

  const ctx = canvasRef.current
    && canvasRef.current.getContext('2d', {alpha: false});
  const imageData = ctx && ctx.createImageData(width, height);

  const init = () => {
    clear();
    // initialize sizes
    onresize();
  };

  const clear = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); }
    }
  };

  const onresize = () => {
    const canvas = canvasRef.current;

    if (canvas) {
      // set the canvas height and width to match the resized element
      // taking devicePixelRatio in to account
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      canvas.width = canvas.clientWidth * window.devicePixelRatio;

      console.log('*** canvas size:', canvas.height, canvas.width);

      setHeight(canvas.height);
      setWidth(canvas.width);
    }
  };

  const drawColors = (colors: number[][]) => {
    if (ctx && imageData) {
      for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        const base = i * 4;

        try {
          imageData.data[base] = color[0];
          imageData.data[base + 1] = color[1];
          imageData.data[base + 2] = color[2];
          imageData.data[base + 3] = 255;
        } catch (e) {
          console.error('failed', i, color);
          return;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }
  };

  React.useEffect(() => {
    console.log('setting onresize handler');
    window.onresize = onresize;

    init();

    return () => {
      window.onresize = null;
    };
  }, [window]);

  return (
    <QueryParamStateProvider>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
      >
      </canvas>
      <Mandel
        height={height}
        width={width}
        drawColors={drawColors}
        canvasRef={canvasRef}
      />
    </QueryParamStateProvider>
  );
};

export default Canvas;
