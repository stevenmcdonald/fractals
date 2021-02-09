
import React from 'react';

import { History, createBrowserHistory } from 'history';

import QueryParamState from './QueryParamState';

import { QueryParamContext } from './context';

const state = new QueryParamState();

interface IProps {
  children: React.ReactChildren;
}

const QueryParamStateProvider: React.FC<IProps> = ({children}: IProps) => {
  const history = createBrowserHistory();
  const [urlString, setUrlString] = React.useState(history.location);

  console.log('blah', history.location, history.location.toString());

  React.useEffect(() => {
    state.setState(history.location.search);

    const unlisten = history.listen((location, action) => {
      console.log('history event:', location, action);
    });

    return unlisten;
  }, [history]);

  return (
    <QueryParamContext.Provider value={state}>
      { children }
    </QueryParamContext.Provider>
  );

};

export default QueryParamStateProvider;
