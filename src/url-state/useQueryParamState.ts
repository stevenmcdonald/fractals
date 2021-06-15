
import React from 'react';

import QueryParamState from './QueryParamState';
// import QueryParamStateProvider from './QueryParamStateProvider';
import { QueryParamContext } from './context';

export const useQueryParamState = (
  id: string,
  convert: (i: string) => any,
  def: any,
) => {
  const [value, stateSetValue] = React.useState(convert(def));

  const paramState = React.useContext<QueryParamState>(QueryParamContext);

  const setValue = (newValue: any) => {
    console.log('set by caller:', newValue);
    stateSetValue(newValue);
  };

  React.useEffect(() => {
    const convertAndSet = (newValue: any) => {
      stateSetValue(convert(newValue));
    };

    const unlisten = paramState.addListener(id, convertAndSet, value);

    return unlisten;
  }, [convert, paramState, id, value]);

  return [value, setValue];
};
