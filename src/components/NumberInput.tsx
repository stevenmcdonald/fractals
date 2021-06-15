/*
  onChange is called with the current value, always a number

*/

import React from 'react';

interface IProps {
  label: string;
  value: number;
  onChange: (arg: number) => void;
}

const NumberInput: React.FC<IProps> = ({label, value, onChange}) => {

  function localOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e && e.target) {
      if (['', '-'].includes(e.target.value)) { return; }

      const val = parseFloat(e.target.value) || 0;

      // console.log('number onChange', val);

      onChange(val);
   } else {
     console.error('whu?', e);
   }
  }

  return(
    <label>
      {label}
      <input
        type="number"
        value={value}
        onChange={localOnChange}
        step="0.01"
      />
    </label>
  );
};

export default NumberInput;
