
export type REQUEST = 'REQUEST';
export type RESPONSE = 'RESPONSE';
export type ERROR = 'ERROR';

export interface RequestMessage {
  type: REQUEST;
  payload: {
    points: {
      metadata: any[],
      x: Float64Array,
      y: Float64Array,
    },
    maxItr: number,
  };
}

export interface ResponseMessage {
  type: RESPONSE;
  payload: {
    points: {
      metadata: any[],
      values: number[],
    },
  };
}

export interface ErrorResponse {
  type: ERROR;
  payload: Error;
}

