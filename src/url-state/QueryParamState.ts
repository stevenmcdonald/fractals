
import { History } from 'history';

type Callback = (v: string) => any;

interface IQueryParamState {
  history: History;
}

export default class QueryParamState {
  private listeners: {[key: string]: Callback } = {};
  private state: {[key: string]: string} = {};
  private history: History;

  constructor(args: IQueryParamState) {
    console.log('QuertParamState created');

    this.history = history;
  }

  public setState(search: string) {
    const params = new URLSearchParams(search);
    for (const [name, value] of params) {
      console.log('setstate:', [name, value]);
      const callback = this.listeners[name];
      if (callback) {
        this.state[name] = value;
        callback(value);
      }
    }
  }

  public setValue(name: string, value: string) {

  }

  public addListener(id: string, callback: Callback, value: any) {
    if (this.listeners[id]) {
      throw new Error('already using a param called: ' + id);
    }

    this.listeners[id] = callback;

    return () => {
      delete this.listeners[id];
    };
  }

  public getQuery() {
    const params = new URLSearchParams(this.state);
    return params;
  }

  // public updateState() {

  // }
}
