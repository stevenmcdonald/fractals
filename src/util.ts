
export interface IPromiseWithStatus extends Promise<any> {
  isResolved: () => boolean;
}

export function PromiseStatus(p: Promise<any>): IPromiseWithStatus {
  let resolved = false;

  const result = p.then((arg) => {
    resolved = true;
    return arg;
  })
  .catch((e) => {
    resolved = true;
    throw e;
  });

  (result as IPromiseWithStatus).isResolved = () => resolved;
  return (result as IPromiseWithStatus);
}

interface IWorkerPool {
  workerConstructor: Function;
  numWorkers: number;
  doneCallback: Function;
}

export class WorkerPool {
  private workers: any[];
  private promises: any[];
  private doneCallback: Function;

  constructor({workerConstructor, numWorkers, doneCallback}: IWorkerPool) {
    this.workers = [];
    this.promises = [];

    this.doneCallback = doneCallback;

    for (let i = 0; i < numWorkers; i++) {
      this.workers.push(workerConstructor());
      this.promises.push(PromiseStatus(Promise.resolve()));
    }
  }

  public async getWorker() {
    const result = await Promise.race(this.promises);
    this.doneCallback(result);

    for (let i = 0; i < this.promises.length; i++) {
      if (this.promises[i].isResolved()) {
        return [this.workers[i], i];
      }
    }
  }

  public addWork(p: Promise<any>, i: number) {
    if (i === undefined || !(i >= 0)) {
      throw new Error('bad index value: ' + i);
    }

    this.promises[i] = PromiseStatus(p);
  }

  public async flush() {
    await Promise.all(this.promises).then((results) => {
      results.forEach((result) => {
        this.doneCallback(result);
      });
    });
  }
}
