import React from 'react';
import { Input, Tabs } from 'antd';
import {useEffect, useRef, useState} from "react";
import ToolBar from "./ToolBar";

const { TextArea } = Input;

export default function QueryInput({ onSubmit, queryId, queryName, initialQuery }) {
  const [query, setQuery] = useState(typeof initialQuery !== 'undefined' ? initialQuery : '');

  const onKeyDown = e => {
    // Run the query on ctrl + enter
    if (e.keyCode === 13 && e.ctrlKey) onSubmit(query)
  }

  useEffect(() => {
    const func = e => onKeyDown(e);
    document.addEventListener('keydown', func);
    return () => {
      document.removeEventListener('keydown', func);
    };
  });

  return (
    <div style={{height: '100%'}}>
      <ToolBar onQuerySubmit={() => onSubmit(query)} queryId={queryId}/>
      <TextArea
        style={{ height: '100%'}}
        className="query-input"
        value={query}
        placeholder="Enter your query here"
        onChange={e => setQuery(e.target.value)}
      />
    </div>
  )
}
