
import React from 'react';
import {
  BrowserRouter as Router,
  // Switch,
  Route,
  // useHistory,
} from 'react-router-dom';

import Mandel from './Mandel';

interface IProps {
  height: number;
  width: number;
  drawColors: Function;
  canvasRef: React.Ref<HTMLCanvasElement>;
}

const FractalRouter: React.FC<IProps> = ({height, width, drawColors, canvasRef}) => (
  <Router>
    <Mandel
      height={height}
      width={width}
      drawColors={drawColors}
      canvasRef={canvasRef}
    />
  </Router>
);

// // sounds ominous
// const FractalRouter: React.FC<IProps> = (props: IProps) =>  {
//   return (
//     <div>
//       <Router>
//         <FractalSubRouter />
//         <Switch>
//           <Route path="/mandel">
//             <Mandel height={props.height} width={props.width} />
//           </Route>
//           <Route path="/burning-ship">
//             <p>Not Yet</p>
//           </Route>
//         </Switch>
//       </Router>
//     </div>
//   );
// }

// const FractalSubRouter: React.FC = () => {
//   const history = useHistory();

//   const handleChange = (event: React.SyntheticEvent) => {
//     const target = event.target as HTMLSelectElement;
//     history.push('/' + target.value);
//   }

//   return (
//     <select name="fractal" defaultValue="mandel" onChange={handleChange}>
//       <option value="mandel">Mandelbrot</option>
//       <option value="burning-ship">Burning Ship</option>
//     </select>
//   );
// }

export default FractalRouter;
