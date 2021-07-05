import React, {
  forwardRef,
  Fragment,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

export default forwardRef((props, ref) => {
  const [currentValue, setCurrentValue] = useState(null);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => {
    return {
      onParentModelChanged(parentModel) {
        // When the filter is empty we will receive a null value here
        if (!parentModel) {
          inputRef.current.value = '';
          setCurrentValue(null);
        } else {
          inputRef.current.value = parentModel.filter + '';
          setCurrentValue(parentModel.filter);
        }
      },
    };
  });

  const onInputBoxChanged = (input) => {
    if (input.target.value === '') {
      props.parentFilterInstance((instance) => {
        instance.onFloatingFilterChanged(null, null);
      });
      return;
    }

    setCurrentValue(Number(input.target.value));
    props.parentFilterInstance((instance) => {
      instance.onFloatingFilterChanged('equals', input.target.value);
    });
  };

  const style = {
    padding: '4px',
    borderRadius: '3px',
    borderColor: '#babfc7',
  };

  return (
    <Fragment>
      <div className="ag-labeled ag-label-align-left ag-text-field ag-input-field">
        <div className="ag-wrapper ag-input-wrapper ag-text-field-input-wrapper">
          <select
            className="ag-input-field-input ag-text-field-input"
            ref={inputRef}
            style={style}
            onInput={onInputBoxChanged}
          >
            <option></option>
            <option value="1">True</option>
            <option value="0">False</option></select>
        </div>
      </div>
    </Fragment>
  );
});
