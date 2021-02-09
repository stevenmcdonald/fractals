
import React from 'react';

import Canvas from './Canvas';

import styles from '../styles/Fractals.module.css';


const Fractals: React.FC = () => {
  return (
    <div className={styles.container}>
      <header>
        Fractals and shit
      </header>
      <main>
        <Canvas />
      </main>
      <footer>
        ...
      </footer>
    </div>
  );
}

export default Fractals;
