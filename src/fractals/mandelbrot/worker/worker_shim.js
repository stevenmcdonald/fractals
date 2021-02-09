//
// the CRA TypeScript config doesn't handle this import syntax, so
// we import in JS

import worker from 'workerize-loader!./worker'; // eslint-disable-line import/no-webpack-loader-syntax

export default worker;
